-- 1. Catálogo de exames (catálogo global do sistema)
CREATE TABLE IF NOT EXISTS catalogo_exames (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL,
  codigo_tuss text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS catalogo_exames_nome_idx ON catalogo_exames USING gin (nome gin_trgm_ops);

COMMENT ON TABLE catalogo_exames IS 'Catálogo global de exames do sistema';

-- 2. Solicitações de exames
CREATE TABLE IF NOT EXISTS solicitacoes_exames (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id         uuid NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id           uuid NOT NULL REFERENCES auth.users(id),
  data                date NOT NULL,
  tipo                text NOT NULL CHECK (tipo IN ('convenio', 'particular')),
  exames              text NOT NULL,
  indicacao_clinica   text,
  operadora           text,
  numero_carteirinha  text,
  observacoes         text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz
);

CREATE INDEX IF NOT EXISTS solicitacoes_exames_paciente_idx ON solicitacoes_exames (paciente_id);
CREATE INDEX IF NOT EXISTS solicitacoes_exames_data_idx ON solicitacoes_exames (data DESC);
CREATE INDEX IF NOT EXISTS solicitacoes_exames_medico_idx ON solicitacoes_exames (medico_id);

COMMENT ON TABLE solicitacoes_exames IS 'Solicitações de exames prescritas aos pacientes (por médico)';

-- 3. RLS
ALTER TABLE catalogo_exames ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitacoes_exames ENABLE ROW LEVEL SECURITY;

-- catalogo_exames: catálogo global, todos autenticados podem ler
CREATE POLICY "Acesso catalogo_exames" ON catalogo_exames FOR ALL TO authenticated
  USING (true);

-- solicitacoes_exames: médico e admin
CREATE POLICY "Medico acessa solicitacoes_exames" ON solicitacoes_exames FOR ALL TO authenticated
  USING (medico_id = auth.uid() OR public.is_admin())
  WITH CHECK (medico_id = auth.uid() OR public.is_admin());
