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

alter table internacoes enable row level security;

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

create trigger set_updated_at before update on internacoes
  for each row execute function public.set_updated_at();
