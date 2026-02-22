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
  telefone2  text,
  telefone3  text,
  endereco   text,
  cidade     text,
  estado     text check (estado is null or char_length(estado) = 2),
  ativo      boolean not null default true,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  stripe_price_id        text,
  subscription_status    text check (subscription_status is null or subscription_status in ('trialing','active','past_due','canceled','unpaid','incomplete')),
  trial_ends_at          timestamptz,
  current_period_end     timestamptz,
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
  valor        numeric(12,2),
  observacoes  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz,

  constraint agendamentos_hora_check check (hora_fim > hora_inicio)
);

create index agendamentos_data_idx on agendamentos (data);
create index agendamentos_paciente_idx on agendamentos (paciente_id);
create index agendamentos_clinica_idx on agendamentos (clinica_id);
create index agendamentos_clinica_data_idx on agendamentos (clinica_id, data);

comment on table agendamentos is 'Agenda de consultas e procedimentos (por clínica)';

-- 4b. Log de alteração de status de agendamentos
-- --------------------------------------------
create table agendamento_status_log (
  id               uuid primary key default gen_random_uuid(),
  agendamento_id   uuid not null references agendamentos(id) on delete cascade,
  status_anterior  text not null,
  status_novo      text not null,
  user_id          uuid not null references auth.users(id),
  created_at       timestamptz not null default now()
);

create index agendamento_log_agendamento_idx on agendamento_status_log (agendamento_id);

comment on table agendamento_status_log is 'Auditoria de mudanças de status em agendamentos';

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
create index transacoes_clinica_data_idx on transacoes (clinica_id, data desc);

comment on table transacoes is 'Receitas e despesas (por clínica)';

-- 7. Receitas médicas
-- --------------------------------------------
create table receitas (
  id            uuid primary key default gen_random_uuid(),
  paciente_id   uuid not null references pacientes (id) on delete cascade,
  medico_id     uuid not null references auth.users(id),
  data          date,
  tipo          text not null check (tipo in ('simples', 'controle_especial')),
  medicamentos  text not null,
  observacoes   text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

create index receitas_paciente_idx on receitas (paciente_id);
create index receitas_data_idx on receitas (data desc);
create index receitas_medico_idx on receitas (medico_id);

comment on table receitas is 'Receitas médicas prescritas aos pacientes (por médico)';

-- 8. Medicamentos (catálogo global do sistema)
-- --------------------------------------------
create table medicamentos (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null,
  posologia         text,
  quantidade        text,
  via_administracao text,
  created_at        timestamptz not null default now()
);

create index medicamentos_nome_idx on medicamentos using gin (nome gin_trgm_ops);

comment on table medicamentos is 'Catálogo global de medicamentos do sistema';

-- 9. Catálogo de exames (catálogo global do sistema)
-- --------------------------------------------
create table catalogo_exames (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  codigo_tuss text,
  created_at  timestamptz not null default now()
);

create index catalogo_exames_nome_idx on catalogo_exames using gin (nome gin_trgm_ops);

comment on table catalogo_exames is 'Catálogo global de exames do sistema';

-- 9b. Catálogo de profissionais para encaminhamentos (catálogo global)
-- --------------------------------------------
create table catalogo_profissionais (
  id              uuid primary key default gen_random_uuid(),
  nome            text not null,
  especialidade   text not null,
  telefone        text,
  created_at      timestamptz not null default now()
);

create index catalogo_profissionais_nome_idx on catalogo_profissionais using gin (nome gin_trgm_ops);

comment on table catalogo_profissionais is 'Catálogo global de profissionais para encaminhamentos';

INSERT INTO catalogo_profissionais (nome, especialidade, telefone) VALUES
('Clínica Santi Medicina Diagnóstica', 'Radiologia', '(27) 3441-5700'),
('Dra. Carolina Trabach', 'Gastroenterologista - Hepatologia', '(27) 3063-9400'),
('Juliana Secco', 'Educadora Física', '(27) 99279-5995'),
('Dra. Carmen Dolores Gonçalves Brandão', 'Endocrinologista', '(27) 3219-0109'),
('Dra. Milena Pandolfi', 'Alergista', '(27) 99920-1890'),
('Hospital Santa Rita (Anestesia)', 'Anestesista', '(27) 3334-8000'),
('Dr. Felipe Reuter Paoliello', 'Anestesista', '(27) 3335-6300'),
('Dr. Marcos Célio', 'Anestesista', '(27) 3183-2222'),
('Dra. Bruna', 'Anestesista', '(27) 3183-2222'),
('Dr. Lucas Guerra', 'Urologista', '(27) 99767-5890'),
('Dr. Igor Machado Cardoso', 'Ortopedista', '(27) 3345-0191'),
('Dr. Bruno Folador', 'Ginecologista', '(27) 3235-5666'),
('Hospital Santa Rita (Central de Guias)', 'Hospital', '(27) 99238-9869'),
('Hospital Santa Rita (Particular)', 'Hospital', '(27) 98158-4266'),
('Instituto de Urologia do Espírito Santo', 'Urologia', '(27) 3183-2242'),
('Dr. Sérgio Ottoni', 'Neurocirurgião', '(27) 3335-6300'),
('Dr. Camilo Milanez', 'Urologista', '(27) 99832-6607'),
('Dr. Antônio Carlos Avanza', 'Cardiologista', '(27) 3345-1750'),
('Dr. Antônio Carlos Avanza (Risco Cirúrgico)', 'Cardiologista', '(27) 3345-1750'),
('Dr. Eric Fuini Ribeiro Puggina', 'Cardiologista', '(27) 3063-5533'),
('Dr. Laranja', 'Cardiologista', '(27) 3345-1750'),
('Dr. Laranja (Risco Cirúrgico)', 'Cardiologista', '(27) 3345-1750'),
('Dra. Paula Sousa de Avelar', 'Cardiologista', '(27) 3145-1750'),
('Dra. Gabriela Nolasco Santa Fardin', 'Cirurgiã Proctológica', '(27) 99294-5744'),
('Dr. Felipe Mustafá', 'Cirurgião do Aparelho Digestivo', '(27) 3145-1750'),
('Dr. Fábio Miranda', 'Cirurgião Geral', '(27) 3225-1439'),
('Dr. Gustavo Alves', 'Cirurgião Geral', '(27) 3059-2222'),
('Dr. Augusto dos Santos', 'Cirurgião Vascular/Angiologista', '(27) 3335-6300'),
('Clínica de Fisioterapia PelvES', 'Fisioterapia', '(27) 99699-4551'),
('Clínica Santi', 'Exame de Imagem', '(27) 3441-5700'),
('Dr. Carlos Cley', 'Dermatologista', '(27) 3315-2305'),
('Dra. Marisa Simon', 'Dermatologista', '(27) 99893-3699'),
('Dr. Áureo Paoliello', 'Médico', '(27) 3335-6300'),
('Dra. Mariana Puppo', 'Gastroenterologista', '(27) 99896-8042'),
('Dra. Samina', 'Cirurgiã Geral', '(27) 3376-7755'),
('Dra. Corina', 'Ginecologista (Climatério)', '(27) 3235-5650'),
('Dra. Graziela Zanetti', 'Endocrinologista', '(27) 99744-1925'),
('Celine Cristina', 'Fisioterapeuta', '(27) 99949-4909'),
('Dra. Flávia Rezende', 'Fisioterapeuta', '(27) 99880-6864'),
('Dr. Wallace Carneiro Machado Jr', 'Geriatra', '(27) 3225-7233'),
('Dra. Marília', 'Ginecologista', '(27) 3182-1040'),
('Dr. Luiz Henrique', 'Infectologista', '(27) 3145-1750'),
('Dra. Carolina Salume', 'Infectologista', '(27) 4141-3505'),
('Dra. Marcela Alice', 'Nefro Pediatra', '(27) 98868-2320'),
('Dr. Laranja', 'Nefrologista', '(27) 3335-6300'),
('Dra. Ana Catarina', 'Nefrologista', '(27) 3329-0250'),
('Dra. Fernanda Zobole', 'Nefrologista', '(27) 99274-2049'),
('Dra. Elida', 'Neurologista', '(27) 99769-1037'),
('Dra. Tatiana', 'Nutricionista', '(27) 3061-6160'),
('Oncoclínicas', 'Oncologia', '(27) 99912-4587'),
('Dr. Loureno Cezana', 'Oncologista', '(27) 21227-4444'),
('Dr. Giuliano Luchi', 'Otorrinolaringologista', '(27) 3026-7738'),
('Dr. Ronald', 'Pneumologista', '(27) 3335-6300'),
('Dra. Marli Lopes', 'Pneumologista', '(27) 3024-0222'),
('Dra. Roberta Couto Barcelos', 'Pneumologista', '(27) 99962-9365'),
('Dr. Raphael Marianeli', 'Proctologista', '(27) 3061-4750'),
('Dra. Flávia Rachel Starling Schwanz', 'Proctologista', '(27) 99994-8167'),
('Fernanda Dalapícola Camatta', 'Psicóloga', '(27) 99640-9777'),
('Taíssa Breda Ferraz', 'Psicóloga', '(27) 99908-0603'),
('Benedito Jr.', 'Psicólogo', '(27) 99725-7799'),
('Gyovanna Mazzocco Machado Azevedo', 'Psicóloga', '(27) 98177-4624'),
('Márcia Campana', 'Psicóloga', '(27) 99961-0028'),
('RM Clínica Triad', 'Ressonância Magnética', '(27) 2222-3333'),
('Dr. Luiz Sérgio Pereira Grillo Júnior', 'Ultrassom', '(27) 3060-6900'),
('Ana Paula Piumbini', 'Ultrassom', '(27) 3239-2440'),
('CEUS (Dr. Herdy / Dr. Bruno Rossi)', 'Ultrassom', '(27) 3337-2838'),
('Unimed Diagnóstico', 'Diagnóstico por Imagem', '(27) 3200-2426'),
('Dr. José Antônio Prezotti', 'Urologista', '(27) 3022-0108'),
('Dr. Rodrigo Lessa', 'Urologista', '(27) 3345-8383'),
('Dr. Rodrigo Tristão', 'Urologista', '(27) 2142-2766');

-- 10. Solicitações de exames
-- --------------------------------------------
create table solicitacoes_exames (
  id                  uuid primary key default gen_random_uuid(),
  paciente_id         uuid not null references pacientes(id) on delete cascade,
  medico_id           uuid not null references auth.users(id),
  data                date,
  tipo                text,
  exames              text not null,
  indicacao_clinica   text,
  operadora           text,
  numero_carteirinha  text,
  observacoes         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz
);

create index solicitacoes_exames_paciente_idx on solicitacoes_exames (paciente_id);
create index solicitacoes_exames_data_idx on solicitacoes_exames (data desc);
create index solicitacoes_exames_medico_idx on solicitacoes_exames (medico_id);

comment on table solicitacoes_exames is 'Solicitações de exames prescritas aos pacientes (por médico)';

-- 11. Atestados médicos
-- --------------------------------------------
create table atestados (
  id                uuid primary key default gen_random_uuid(),
  paciente_id       uuid not null references pacientes(id) on delete cascade,
  medico_id         uuid not null references auth.users(id),
  data              date,
  tipo              text not null check (tipo in ('comparecimento','afastamento','aptidao','acompanhante')),
  conteudo          text not null,
  cid               text,
  dias_afastamento  integer check (dias_afastamento is null or dias_afastamento > 0),
  observacoes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz
);

create index atestados_paciente_idx on atestados (paciente_id);
create index atestados_data_idx on atestados (data desc);
create index atestados_medico_idx on atestados (medico_id);

comment on table atestados is 'Atestados médicos emitidos para pacientes (por médico)';

-- 12. Encaminhamentos
-- --------------------------------------------
create table encaminhamentos (
  id                      uuid primary key default gen_random_uuid(),
  paciente_id             uuid not null references pacientes(id) on delete cascade,
  medico_id               uuid not null references auth.users(id),
  data                    date,
  profissional_destino    text not null,
  especialidade           text not null,
  telefone_profissional   text,
  motivo                  text not null,
  observacoes             text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz
);

create index encaminhamentos_paciente_idx on encaminhamentos (paciente_id);
create index encaminhamentos_data_idx on encaminhamentos (data desc);
create index encaminhamentos_medico_idx on encaminhamentos (medico_id);

comment on table encaminhamentos is 'Encaminhamentos de pacientes para outros profissionais (por médico)';

-- 13. Laudos médicos
-- --------------------------------------------
create table laudos (
  id           uuid primary key default gen_random_uuid(),
  paciente_id  uuid not null references pacientes(id) on delete cascade,
  medico_id    uuid not null references auth.users(id),
  data         date,
  conteudo     text not null,
  observacoes  text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);

create index laudos_paciente_idx on laudos (paciente_id);
create index laudos_data_idx on laudos (data desc);
create index laudos_medico_idx on laudos (medico_id);

comment on table laudos is 'Laudos médicos emitidos para pacientes (por médico)';

-- 15. Internações
-- --------------------------------------------
create table internacoes (
  id                       uuid primary key default gen_random_uuid(),
  paciente_id              uuid not null references pacientes(id) on delete cascade,
  medico_id                uuid not null references auth.users(id),
  data                     date,
  hospital_nome            text,
  data_sugerida_internacao date,
  carater_atendimento      text check (carater_atendimento in ('eletiva','urgencia','emergencia')),
  tipo_internacao          text check (tipo_internacao in ('clinica','cirurgica','obstetrica','psiquiatrica','pediatrica')),
  regime_internacao        text check (regime_internacao in ('hospitalar','hospital_dia')),
  diarias_solicitadas      integer check (diarias_solicitadas is null or diarias_solicitadas > 0),
  previsao_opme            boolean not null default false,
  previsao_quimioterapico  boolean not null default false,
  indicacao_clinica        text not null,
  cid_principal            text,
  cid_2                    text,
  cid_3                    text,
  cid_4                    text,
  indicacao_acidente       text check (indicacao_acidente is null or indicacao_acidente in ('acidente_trabalho','acidente_transito','outros_acidentes','nao')),
  procedimentos            text,
  observacoes              text,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz
);

create index internacoes_paciente_idx on internacoes (paciente_id);
create index internacoes_data_idx on internacoes (data desc);
create index internacoes_medico_idx on internacoes (medico_id);

comment on table internacoes is 'Guias de solicitação de internação (por médico)';

-- 14. Horários por profissional
-- --------------------------------------------
create table horarios_profissional (
  id               uuid primary key default gen_random_uuid(),
  clinica_id       uuid not null references clinicas(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  dia_semana       integer not null check (dia_semana between 0 and 6),
  ativo            boolean not null default false,
  hora_inicio      time,
  hora_fim         time,
  intervalo_inicio time,
  intervalo_fim    time,
  duracao_consulta integer not null default 15 check (duracao_consulta between 5 and 240),
  unique (clinica_id, user_id, dia_semana)
);

create index horarios_prof_clinica_user_idx on horarios_profissional (clinica_id, user_id);

comment on table horarios_profissional is 'Horários de atendimento configurados por profissional, por clínica';

-- 12. Configurações
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
create index configuracoes_clinica_chave_idx on configuracoes (clinica_id, chave) where clinica_id is not null;
create index configuracoes_user_chave_idx on configuracoes (user_id, chave) where user_id is not null;

comment on table configuracoes is 'Configurações por escopo (clínica, usuário ou global)';

-- 14. Auditoria (logs de atividade)
-- --------------------------------------------
create table audit_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id),
  clinica_id uuid references clinicas(id),
  acao       text not null,
  recurso    text not null,
  recurso_id text,
  detalhes   jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_user_idx on audit_logs (user_id);
create index audit_logs_clinica_idx on audit_logs (clinica_id);
create index audit_logs_created_idx on audit_logs (created_at desc);

comment on table audit_logs is 'Logs de auditoria de ações realizadas no sistema';

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
alter table medicamentos enable row level security;
alter table catalogo_exames enable row level security;
alter table catalogo_profissionais enable row level security;
alter table solicitacoes_exames enable row level security;
alter table atestados enable row level security;
alter table encaminhamentos enable row level security;
alter table laudos enable row level security;
alter table internacoes enable row level security;
alter table horarios_profissional enable row level security;
alter table agendamento_status_log enable row level security;
alter table configuracoes enable row level security;
alter table audit_logs enable row level security;

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

-- prontuarios: leitura clinic-wide, escrita pelo autor ou admin
create policy "Acesso prontuarios" on prontuarios for all to authenticated
  using (
    medico_id = auth.uid()
    or medico_id in (select public.get_my_clinic_medico_ids())
    or public.is_admin()
  )
  with check (
    medico_id = auth.uid()
    or public.is_admin()
  );

-- receitas: leitura clinic-wide, escrita pelo autor ou admin
create policy "Acesso receitas" on receitas for all to authenticated
  using (
    medico_id = auth.uid()
    or medico_id in (select public.get_my_clinic_medico_ids())
    or public.is_admin()
  )
  with check (
    medico_id = auth.uid()
    or public.is_admin()
  );

-- agendamentos: por clínica (médico, secretária e admin)
create policy "Acesso agendamentos" on agendamentos for all to authenticated
  using (clinica_id in (select public.get_my_clinica_ids()) or public.is_admin());

-- transacoes: por clínica (superadmin, gestor, financeiro)
create policy "Medico acessa transacoes" on transacoes for all to authenticated
  using (clinica_id in (select public.get_my_clinica_ids()) or public.is_admin());

-- medicamentos: catálogo global — leitura para todos, escrita apenas para admin
create policy "Leitura medicamentos" on medicamentos for select to authenticated
  using (true);
create policy "Admin gerencia medicamentos" on medicamentos for insert to authenticated
  with check (public.is_admin());
create policy "Admin atualiza medicamentos" on medicamentos for update to authenticated
  using (public.is_admin());
create policy "Admin exclui medicamentos" on medicamentos for delete to authenticated
  using (public.is_admin());

-- catalogo_exames: catálogo global — leitura para todos, escrita apenas para admin
create policy "Leitura catalogo_exames" on catalogo_exames for select to authenticated
  using (true);
create policy "Admin gerencia catalogo_exames" on catalogo_exames for insert to authenticated
  with check (public.is_admin());
create policy "Admin atualiza catalogo_exames" on catalogo_exames for update to authenticated
  using (public.is_admin());
create policy "Admin exclui catalogo_exames" on catalogo_exames for delete to authenticated
  using (public.is_admin());

-- catalogo_profissionais: catálogo global — leitura para todos, escrita apenas para admin
create policy "Leitura catalogo_profissionais" on catalogo_profissionais for select to authenticated
  using (true);
create policy "Admin gerencia catalogo_profissionais" on catalogo_profissionais for insert to authenticated
  with check (public.is_admin());
create policy "Admin atualiza catalogo_profissionais" on catalogo_profissionais for update to authenticated
  using (public.is_admin());
create policy "Admin exclui catalogo_profissionais" on catalogo_profissionais for delete to authenticated
  using (public.is_admin());

-- solicitacoes_exames: leitura clinic-wide, escrita pelo autor ou admin
create policy "Acesso exames" on solicitacoes_exames for all to authenticated
  using (
    medico_id = auth.uid()
    or medico_id in (select public.get_my_clinic_medico_ids())
    or public.is_admin()
  )
  with check (
    medico_id = auth.uid()
    or public.is_admin()
  );

-- atestados: leitura clinic-wide, escrita pelo autor ou admin
create policy "Acesso atestados" on atestados for all to authenticated
  using (
    medico_id = auth.uid()
    or medico_id in (select public.get_my_clinic_medico_ids())
    or public.is_admin()
  )
  with check (
    medico_id = auth.uid()
    or public.is_admin()
  );

-- encaminhamentos: leitura clinic-wide, escrita pelo autor ou admin
create policy "Acesso encaminhamentos" on encaminhamentos for all to authenticated
  using (
    medico_id = auth.uid()
    or medico_id in (select public.get_my_clinic_medico_ids())
    or public.is_admin()
  )
  with check (
    medico_id = auth.uid()
    or public.is_admin()
  );

-- laudos: leitura clinic-wide, escrita pelo autor ou admin
create policy "Acesso laudos" on laudos for all to authenticated
  using (
    medico_id = auth.uid()
    or medico_id in (select public.get_my_clinic_medico_ids())
    or public.is_admin()
  )
  with check (
    medico_id = auth.uid()
    or public.is_admin()
  );

create policy "Acesso internacoes" on internacoes for all to authenticated
  using (
    medico_id = auth.uid()
    or medico_id in (select public.get_my_clinic_medico_ids())
    or public.is_admin()
  )
  with check (
    medico_id = auth.uid()
    or public.is_admin()
  );

-- horarios_profissional: profissional edita seus próprios; clínica pode ler
create policy "Acesso horarios_profissional" on horarios_profissional for select to authenticated
  using (clinica_id in (select public.get_my_clinica_ids()) or public.is_admin());

create policy "Profissional gerencia horarios" on horarios_profissional for all to authenticated
  using (
    (user_id = auth.uid() and clinica_id in (select public.get_my_clinica_ids()))
    or clinica_id in (select public.get_my_medico_clinica_ids())
    or public.is_admin()
  )
  with check (
    (user_id = auth.uid() and clinica_id in (select public.get_my_clinica_ids()))
    or clinica_id in (select public.get_my_medico_clinica_ids())
    or public.is_admin()
  );

-- agendamento_status_log: mesma política dos agendamentos (por clínica)
create policy "Acesso agendamento_status_log" on agendamento_status_log for all to authenticated
  using (
    agendamento_id in (
      select id from agendamentos where clinica_id in (select public.get_my_clinica_ids())
    )
    or public.is_admin()
  );

-- configuracoes
create policy "Acesso configuracoes" on configuracoes for all to authenticated
  using (
    user_id = auth.uid()
    or clinica_id in (select public.get_my_clinica_ids())
    or (user_id is null and clinica_id is null)
    or public.is_admin()
  );

-- audit_logs: gestores e superadmin podem ler; qualquer autenticado pode inserir
create policy "Gestor acessa audit_logs" on audit_logs for select to authenticated
  using (
    clinica_id in (select public.get_my_medico_clinica_ids())
    or public.is_admin()
  );

create policy "Usuarios inserem audit_logs" on audit_logs for insert to authenticated
  with check (user_id = auth.uid());

-- ============================================
-- Trigger: updated_at automático
-- ============================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on clinicas for each row execute function public.set_updated_at();
create trigger set_updated_at before update on pacientes for each row execute function public.set_updated_at();
create trigger set_updated_at before update on agendamentos for each row execute function public.set_updated_at();
create trigger set_updated_at before update on prontuarios for each row execute function public.set_updated_at();
create trigger set_updated_at before update on transacoes for each row execute function public.set_updated_at();
create trigger set_updated_at before update on receitas for each row execute function public.set_updated_at();
create trigger set_updated_at before update on solicitacoes_exames for each row execute function public.set_updated_at();
create trigger set_updated_at before update on atestados for each row execute function public.set_updated_at();
create trigger set_updated_at before update on encaminhamentos for each row execute function public.set_updated_at();
create trigger set_updated_at before update on laudos for each row execute function public.set_updated_at();
create trigger set_updated_at before update on internacoes for each row execute function public.set_updated_at();
