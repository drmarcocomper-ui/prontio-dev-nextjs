-- Log de auditoria para mudanças de status de agendamentos
CREATE TABLE agendamento_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id uuid NOT NULL REFERENCES agendamentos(id) ON DELETE CASCADE,
  status_anterior text NOT NULL,
  status_novo text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX agendamento_status_log_agendamento_idx ON agendamento_status_log(agendamento_id);

ALTER TABLE agendamento_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura log status autenticado" ON agendamento_status_log
  FOR SELECT TO authenticated
  USING (
    agendamento_id IN (
      SELECT id FROM agendamentos WHERE clinica_id IN (SELECT public.get_my_clinica_ids())
    ) OR public.is_admin()
  );

CREATE POLICY "Insert log status autenticado" ON agendamento_status_log
  FOR INSERT TO authenticated
  WITH CHECK (true);
