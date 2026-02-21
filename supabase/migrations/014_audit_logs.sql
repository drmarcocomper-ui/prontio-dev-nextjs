-- Tabela de auditoria (logs de atividade)
-- ============================================

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

-- RLS
alter table audit_logs enable row level security;

-- Gestores e superadmin da clínica podem visualizar logs
create policy "Gestor acessa audit_logs" on audit_logs for select to authenticated
  using (
    clinica_id in (select public.get_my_medico_clinica_ids())
    or public.is_admin()
  );

-- Qualquer usuário autenticado pode inserir logs (registrar ações)
create policy "Usuarios inserem audit_logs" on audit_logs for insert to authenticated
  with check (user_id = auth.uid());
