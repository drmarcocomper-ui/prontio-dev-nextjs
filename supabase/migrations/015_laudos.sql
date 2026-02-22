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

alter table laudos enable row level security;

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

create trigger set_updated_at before update on laudos
  for each row execute function public.set_updated_at();
