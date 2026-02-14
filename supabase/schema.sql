-- ============================================
-- Prontio — Schema SQL para Supabase
-- ============================================

-- Extensão pg_trgm (necessária para busca por nome)
create extension if not exists pg_trgm;

-- 1. Clínicas
-- --------------------------------------------
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

comment on table clinicas is 'Clínicas onde o médico atende';

-- 2. Vínculo usuário ↔ clínica ↔ papel
-- --------------------------------------------
create table usuarios_clinicas (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  clinica_id uuid not null references clinicas(id) on delete cascade,
  papel      text not null check (papel in ('superadmin', 'gestor', 'profissional_saude', 'financeiro', 'secretaria')),
  created_at timestamptz not null default now(),
  unique (user_id, clinica_id)
);

create index usuarios_clinicas_user_idx    on usuarios_clinicas (user_id);
create index usuarios_clinicas_clinica_idx on usuarios_clinicas (clinica_id);

comment on table usuarios_clinicas is 'Vínculo entre usuários e clínicas com papel (superadmin/gestor/profissional_saude/financeiro/secretaria)';

-- 3. Pacientes
-- --------------------------------------------
create table pacientes (
  id          uuid primary key default gen_random_uuid(),
  medico_id   uuid not null references auth.users(id),
  nome        text not null,
  cpf         text,
  rg          text,
  data_nascimento date,
  sexo        text check (sexo in ('masculino', 'feminino', 'outro')),
  estado_civil text check (estado_civil in ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel')),
  telefone    text,
  email       text,
  cep         text,
  endereco    text,
  numero      text,
  complemento text,
  bairro      text,
  cidade      text,
  estado      text,
  convenio    text,
  observacoes text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz
);

create unique index pacientes_cpf_unique on pacientes (cpf) where cpf is not null;
create index pacientes_nome_idx on pacientes using gin (nome gin_trgm_ops);
create index pacientes_medico_idx on pacientes (medico_id);

comment on table pacientes is 'Cadastro de pacientes do médico (compartilhado entre clínicas)';

-- 4. Agendamentos
-- --------------------------------------------
create table agendamentos (
  id           uuid primary key default gen_random_uuid(),
  paciente_id  uuid not null references pacientes (id) on delete cascade,
  clinica_id   uuid not null references clinicas (id),
  data         date not null,
  hora_inicio  time not null,
  hora_fim     time not null,
  tipo         text check (tipo in ('consulta', 'retorno', 'exame', 'procedimento', 'avaliacao')),
  status       text not null default 'agendado'
               check (status in ('agendado', 'confirmado', 'em_atendimento', 'atendido', 'cancelado', 'faltou')),
  observacoes  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz,

  constraint agendamentos_hora_check check (hora_fim > hora_inicio)
);

create index agendamentos_data_idx on agendamentos (data);
create index agendamentos_paciente_idx on agendamentos (paciente_id);
create index agendamentos_clinica_idx on agendamentos (clinica_id);

comment on table agendamentos is 'Agenda de consultas e procedimentos (por clínica)';

-- 5. Prontuários
-- --------------------------------------------
create table prontuarios (
  id                    uuid primary key default gen_random_uuid(),
  paciente_id           uuid not null references pacientes (id) on delete cascade,
  medico_id             uuid not null references auth.users(id),
  data                  date not null,
  tipo                  text check (tipo in ('consulta', 'retorno', 'exame', 'procedimento', 'avaliacao')),
  cid                   text,
  queixa_principal      text,
  historia_doenca       text,
  exame_fisico          text,
  hipotese_diagnostica  text,
  conduta               text,
  observacoes           text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz
);

create index prontuarios_paciente_idx on prontuarios (paciente_id);
create index prontuarios_data_idx on prontuarios (data desc);
create index prontuarios_medico_idx on prontuarios (medico_id);

comment on table prontuarios is 'Evoluções clínicas / prontuário do paciente (por médico)';

-- 6. Transações financeiras
-- --------------------------------------------
create table transacoes (
  id               uuid primary key default gen_random_uuid(),
  clinica_id       uuid not null references clinicas (id),
  tipo             text not null check (tipo in ('receita', 'despesa')),
  categoria        text,
  descricao        text not null,
  valor            numeric(12,2) not null check (valor > 0),
  data             date not null,
  paciente_id      uuid references pacientes (id) on delete set null,
  forma_pagamento  text check (forma_pagamento in (
    'dinheiro', 'pix', 'cartao_credito', 'cartao_debito',
    'boleto', 'transferencia', 'convenio'
  )),
  status           text not null default 'pago'
                   check (status in ('pago', 'pendente', 'cancelado')),
  observacoes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz
);

create index transacoes_data_idx on transacoes (data desc);
create index transacoes_tipo_idx on transacoes (tipo);
create index transacoes_paciente_idx on transacoes (paciente_id);
create index transacoes_clinica_idx on transacoes (clinica_id);

comment on table transacoes is 'Receitas e despesas (por clínica)';

-- 7. Receitas médicas
-- --------------------------------------------
create table receitas (
  id            uuid primary key default gen_random_uuid(),
  paciente_id   uuid not null references pacientes (id) on delete cascade,
  medico_id     uuid not null references auth.users(id),
  data          date not null,
  tipo          text not null check (tipo in ('simples', 'especial', 'controle_especial')),
  medicamentos  text not null,
  observacoes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

create index receitas_paciente_idx on receitas (paciente_id);
create index receitas_data_idx on receitas (data desc);
create index receitas_medico_idx on receitas (medico_id);

comment on table receitas is 'Receitas médicas prescritas aos pacientes (por médico)';

-- 8. Configurações
-- --------------------------------------------
create table configuracoes (
  id         uuid primary key default gen_random_uuid(),
  chave      text not null,
  valor      text not null default '',
  clinica_id uuid references clinicas(id),
  user_id    uuid references auth.users(id)
);

create unique index configuracoes_scope_idx on configuracoes (
  chave,
  coalesce(clinica_id::text, ''),
  coalesce(user_id::text, '')
);

comment on table configuracoes is 'Configurações por escopo (clínica, usuário ou global)';

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table clinicas enable row level security;
alter table usuarios_clinicas enable row level security;
alter table pacientes enable row level security;
alter table agendamentos enable row level security;
alter table prontuarios enable row level security;
alter table transacoes enable row level security;
alter table receitas enable row level security;
alter table configuracoes enable row level security;

-- Funções SECURITY DEFINER para evitar recursão no RLS de usuarios_clinicas
create or replace function public.get_my_clinica_ids()
returns setof uuid language sql security definer set search_path = '' stable
as $$ select clinica_id from public.usuarios_clinicas where user_id = auth.uid(); $$;

create or replace function public.get_my_medico_clinica_ids()
returns setof uuid language sql security definer set search_path = '' stable
as $$ select clinica_id from public.usuarios_clinicas where user_id = auth.uid() and papel in ('superadmin', 'gestor', 'profissional_saude'); $$;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = '' stable
as $$ select exists (select 1 from public.usuarios_clinicas where user_id = auth.uid() and papel = 'superadmin'); $$;

create or replace function public.get_my_clinic_medico_ids()
returns setof uuid language sql security definer set search_path = '' stable
as $$
  select uc.user_id from public.usuarios_clinicas uc
  where uc.clinica_id in (select public.get_my_clinica_ids())
  and uc.papel in ('superadmin', 'profissional_saude');
$$;

-- clinicas: usuário vê clínicas que pertence; admin vê todas
create policy "Acesso clinicas" on clinicas for select to authenticated
  using (id in (select public.get_my_clinica_ids()) or public.is_admin());

create policy "Medico gerencia clinicas" on clinicas for all to authenticated
  using (id in (select public.get_my_medico_clinica_ids()) or public.is_admin())
  with check (id in (select public.get_my_medico_clinica_ids()) or public.is_admin());

-- usuarios_clinicas
create policy "Acesso vinculos leitura" on usuarios_clinicas for select to authenticated
  using (user_id = auth.uid() or clinica_id in (select public.get_my_medico_clinica_ids()) or public.is_admin());

create policy "Medico gerencia vinculos" on usuarios_clinicas for all to authenticated
  using (clinica_id in (select public.get_my_medico_clinica_ids()) or public.is_admin())
  with check (clinica_id in (select public.get_my_medico_clinica_ids()) or public.is_admin());

-- pacientes: médico, suas secretárias e admin (usa SECURITY DEFINER para bypass de RLS em usuarios_clinicas)
create policy "Acesso pacientes" on pacientes for all to authenticated
  using (
    medico_id = auth.uid()
    or medico_id in (select public.get_my_clinic_medico_ids())
    or public.is_admin()
  );

-- prontuarios/receitas: médico e admin
create policy "Medico acessa prontuarios" on prontuarios for all to authenticated
  using (medico_id = auth.uid() or public.is_admin())
  with check (medico_id = auth.uid() or public.is_admin());

create policy "Medico acessa receitas" on receitas for all to authenticated
  using (medico_id = auth.uid() or public.is_admin())
  with check (medico_id = auth.uid() or public.is_admin());

-- agendamentos: por clínica (médico, secretária e admin)
create policy "Acesso agendamentos" on agendamentos for all to authenticated
  using (clinica_id in (select public.get_my_clinica_ids()) or public.is_admin());

-- transacoes: por clínica (superadmin, gestor, financeiro)
create policy "Medico acessa transacoes" on transacoes for all to authenticated
  using (clinica_id in (select public.get_my_clinica_ids()) or public.is_admin());

-- configuracoes
create policy "Acesso configuracoes" on configuracoes for all to authenticated
  using (
    user_id = auth.uid()
    or clinica_id in (select public.get_my_clinica_ids())
    or (user_id is null and clinica_id is null)
    or public.is_admin()
  );
