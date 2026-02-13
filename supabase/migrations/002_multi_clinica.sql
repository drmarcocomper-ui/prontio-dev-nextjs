-- ============================================
-- 002 — Multi-clínica + Perfis de Usuário
-- ============================================

-- 1. Novas tabelas
-- --------------------------------------------

-- Clínicas onde o médico atende
create table clinicas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  cnpj       text,
  telefone   text,
  endereco   text,
  cidade     text,
  estado     text check (estado is null or char_length(estado) = 2),
  ativo      boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

alter table clinicas enable row level security;

-- Vínculo usuário ↔ clínica ↔ papel
create table usuarios_clinicas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  clinica_id uuid not null references clinicas(id) on delete cascade,
  papel      text not null check (papel in ('medico', 'secretaria')),
  created_at timestamptz not null default now(),
  unique (user_id, clinica_id)
);

alter table usuarios_clinicas enable row level security;

-- 2. Colunas novas em tabelas existentes
-- --------------------------------------------

-- Dados do médico (compartilhados entre clínicas)
alter table pacientes    add column medico_id uuid references auth.users(id);
alter table prontuarios  add column medico_id uuid references auth.users(id);
alter table receitas     add column medico_id uuid references auth.users(id);

-- Dados por clínica
alter table agendamentos add column clinica_id uuid references clinicas(id);
alter table transacoes   add column clinica_id uuid references clinicas(id);

-- Configurações: escopo por clínica ou por usuário
alter table configuracoes drop constraint configuracoes_pkey;
alter table configuracoes add column id uuid not null default gen_random_uuid();
alter table configuracoes add primary key (id);
alter table configuracoes add column clinica_id uuid references clinicas(id);
alter table configuracoes add column user_id uuid references auth.users(id);
create unique index configuracoes_scope_idx on configuracoes (
  chave,
  coalesce(clinica_id::text, ''),
  coalesce(user_id::text, '')
);

-- 3. Migração de dados existentes
-- --------------------------------------------

-- 3.1. Criar clínica padrão a partir das configurações
insert into clinicas (id, nome, cnpj, telefone, endereco, cidade, estado)
values (
  gen_random_uuid(),
  coalesce((select valor from configuracoes where chave = 'nome_consultorio' limit 1), 'Meu Consultório'),
  (select valor from configuracoes where chave = 'cnpj' limit 1),
  (select valor from configuracoes where chave = 'telefone_consultorio' limit 1),
  (select valor from configuracoes where chave = 'endereco_consultorio' limit 1),
  (select valor from configuracoes where chave = 'cidade_consultorio' limit 1),
  (select valor from configuracoes where chave = 'estado_consultorio' limit 1)
);

-- 3.2. Vincular todos os usuários existentes como médico na clínica padrão
insert into usuarios_clinicas (user_id, clinica_id, papel)
select au.id, c.id, 'medico'
from auth.users au cross join clinicas c;

-- 3.3. Preencher medico_id com o primeiro usuário
update pacientes   set medico_id = (select id from auth.users limit 1);
update prontuarios set medico_id = (select id from auth.users limit 1);
update receitas    set medico_id = (select id from auth.users limit 1);

-- 3.4. Preencher clinica_id com a clínica padrão
update agendamentos set clinica_id = (select id from clinicas limit 1);
update transacoes   set clinica_id = (select id from clinicas limit 1);

-- 3.5. Escopar configurações de horários → clinica_id
update configuracoes set clinica_id = (select id from clinicas limit 1)
where chave like 'horario_%' or chave in ('duracao_consulta', 'intervalo_inicio', 'intervalo_fim');

-- 3.6. Escopar configurações profissionais → user_id
update configuracoes set user_id = (select id from auth.users limit 1)
where chave in ('nome_profissional', 'profissional_nome', 'especialidade', 'crm', 'rqe', 'email_profissional', 'cor_primaria');

-- 3.7. Remover configs de consultório migradas para tabela clinicas
delete from configuracoes
where chave in ('nome_consultorio', 'cnpj', 'telefone_consultorio', 'endereco_consultorio', 'cidade_consultorio', 'estado_consultorio');

-- 4. Tornar colunas NOT NULL após backfill
-- --------------------------------------------
alter table pacientes    alter column medico_id  set not null;
alter table prontuarios  alter column medico_id  set not null;
alter table receitas     alter column medico_id  set not null;
alter table agendamentos alter column clinica_id set not null;
alter table transacoes   alter column clinica_id set not null;

-- 5. Índices
-- --------------------------------------------
create index pacientes_medico_idx     on pacientes (medico_id);
create index prontuarios_medico_idx   on prontuarios (medico_id);
create index receitas_medico_idx      on receitas (medico_id);
create index agendamentos_clinica_idx on agendamentos (clinica_id);
create index transacoes_clinica_idx   on transacoes (clinica_id);
create index usuarios_clinicas_user_idx    on usuarios_clinicas (user_id);
create index usuarios_clinicas_clinica_idx on usuarios_clinicas (clinica_id);

-- 6. RLS atualizado
-- --------------------------------------------

-- clinicas: usuário vê clínicas que pertence
create policy "Acesso clinicas" on clinicas for select to authenticated
  using (id in (select clinica_id from usuarios_clinicas where user_id = auth.uid()));

create policy "Medico gerencia clinicas" on clinicas for all to authenticated
  using (id in (select clinica_id from usuarios_clinicas where user_id = auth.uid() and papel = 'medico'))
  with check (id in (select clinica_id from usuarios_clinicas where user_id = auth.uid() and papel = 'medico'));

-- usuarios_clinicas: médico gerencia seus vínculos e os de suas clínicas
create policy "Acesso vinculos leitura" on usuarios_clinicas for select to authenticated
  using (
    user_id = auth.uid()
    or clinica_id in (select clinica_id from usuarios_clinicas uc where uc.user_id = auth.uid() and uc.papel = 'medico')
  );

create policy "Medico gerencia vinculos" on usuarios_clinicas for all to authenticated
  using (
    clinica_id in (select clinica_id from usuarios_clinicas uc where uc.user_id = auth.uid() and uc.papel = 'medico')
  )
  with check (
    clinica_id in (select clinica_id from usuarios_clinicas uc where uc.user_id = auth.uid() and uc.papel = 'medico')
  );

-- pacientes: médico e suas secretárias (via clínica compartilhada)
drop policy "Acesso autenticado" on pacientes;
create policy "Acesso pacientes" on pacientes for all to authenticated
  using (
    medico_id = auth.uid()
    or medico_id in (
      select uc2.user_id from usuarios_clinicas uc1
      join usuarios_clinicas uc2 on uc1.clinica_id = uc2.clinica_id and uc2.papel = 'medico'
      where uc1.user_id = auth.uid()
    )
  );

-- prontuarios/receitas: SOMENTE o médico
drop policy "Acesso autenticado" on prontuarios;
create policy "Medico acessa prontuarios" on prontuarios for all to authenticated
  using (medico_id = auth.uid()) with check (medico_id = auth.uid());

drop policy "Acesso autenticado" on receitas;
create policy "Medico acessa receitas" on receitas for all to authenticated
  using (medico_id = auth.uid()) with check (medico_id = auth.uid());

-- agendamentos: por clínica (médico e secretária)
drop policy "Acesso autenticado" on agendamentos;
create policy "Acesso agendamentos" on agendamentos for all to authenticated
  using (clinica_id in (select clinica_id from usuarios_clinicas where user_id = auth.uid()));

-- transacoes: por clínica, SOMENTE médico
drop policy "Acesso autenticado" on transacoes;
create policy "Medico acessa transacoes" on transacoes for all to authenticated
  using (clinica_id in (select clinica_id from usuarios_clinicas where user_id = auth.uid() and papel = 'medico'));

-- configuracoes
drop policy "Acesso autenticado" on configuracoes;
create policy "Acesso configuracoes" on configuracoes for all to authenticated
  using (
    user_id = auth.uid()
    or clinica_id in (select clinica_id from usuarios_clinicas where user_id = auth.uid())
    or (user_id is null and clinica_id is null)
  );
