-- ============================================
-- Prontio — Schema SQL para Supabase
-- ============================================

-- Extensão pg_trgm (necessária para busca por nome)
create extension if not exists pg_trgm;

-- 1. Pacientes
-- --------------------------------------------
create table pacientes (
  id          uuid primary key default gen_random_uuid(),
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
  created_at  timestamptz not null default now()
);

create unique index pacientes_cpf_unique on pacientes (cpf) where cpf is not null;
create index pacientes_nome_idx on pacientes using gin (nome gin_trgm_ops);

comment on table pacientes is 'Cadastro de pacientes do consultório';

-- 2. Agendamentos
-- --------------------------------------------
create table agendamentos (
  id           uuid primary key default gen_random_uuid(),
  paciente_id  uuid not null references pacientes (id) on delete cascade,
  data         date not null,
  hora_inicio  time not null,
  hora_fim     time not null,
  tipo         text check (tipo in ('consulta', 'retorno', 'exame', 'procedimento', 'avaliacao')),
  status       text not null default 'agendado'
               check (status in ('agendado', 'confirmado', 'em_atendimento', 'atendido', 'cancelado', 'faltou')),
  observacoes  text,
  created_at   timestamptz not null default now(),

  constraint agendamentos_hora_check check (hora_fim > hora_inicio)
);

create index agendamentos_data_idx on agendamentos (data);
create index agendamentos_paciente_idx on agendamentos (paciente_id);

comment on table agendamentos is 'Agenda de consultas e procedimentos';

-- 3. Prontuários
-- --------------------------------------------
create table prontuarios (
  id                    uuid primary key default gen_random_uuid(),
  paciente_id           uuid not null references pacientes (id) on delete cascade,
  data                  date not null,
  tipo                  text check (tipo in ('consulta', 'retorno', 'exame', 'procedimento', 'avaliacao')),
  cid                   text,
  queixa_principal      text,
  historia_doenca       text,
  exame_fisico          text,
  hipotese_diagnostica  text,
  conduta               text,
  observacoes           text,
  created_at            timestamptz not null default now()
);

create index prontuarios_paciente_idx on prontuarios (paciente_id);
create index prontuarios_data_idx on prontuarios (data desc);

comment on table prontuarios is 'Evoluções clínicas / prontuário do paciente';

-- 4. Transações financeiras
-- --------------------------------------------
create table transacoes (
  id               uuid primary key default gen_random_uuid(),
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
  created_at       timestamptz not null default now()
);

create index transacoes_data_idx on transacoes (data desc);
create index transacoes_tipo_idx on transacoes (tipo);
create index transacoes_paciente_idx on transacoes (paciente_id);

comment on table transacoes is 'Receitas e despesas do consultório';

-- 5. Configurações
-- --------------------------------------------
create table configuracoes (
  chave  text primary key,
  valor  text not null default ''
);

comment on table configuracoes is 'Configurações do consultório (chave-valor)';

-- ============================================
-- Row Level Security (RLS)
-- ============================================

alter table pacientes enable row level security;
alter table agendamentos enable row level security;
alter table prontuarios enable row level security;
alter table transacoes enable row level security;
alter table configuracoes enable row level security;

-- Política: usuários autenticados têm acesso total
-- (adequado para sistema single-tenant / consultório único)

create policy "Acesso autenticado" on pacientes
  for all to authenticated
  using (true) with check (true);

create policy "Acesso autenticado" on agendamentos
  for all to authenticated
  using (true) with check (true);

create policy "Acesso autenticado" on prontuarios
  for all to authenticated
  using (true) with check (true);

create policy "Acesso autenticado" on transacoes
  for all to authenticated
  using (true) with check (true);

create policy "Acesso autenticado" on configuracoes
  for all to authenticated
  using (true) with check (true);
