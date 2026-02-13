-- Adiciona coluna updated_at em todas as tabelas principais
-- Execute este script no SQL Editor do Supabase se o banco já existir

ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE prontuarios ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE receitas ADD COLUMN IF NOT EXISTS updated_at timestamptz;

-- Trigger para atualizar updated_at automaticamente em UPDATE
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['pacientes', 'agendamentos', 'prontuarios', 'transacoes', 'receitas'])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t
    );
  END LOOP;
EXCEPTION WHEN duplicate_object THEN
  NULL; -- triggers already exist
END;
$$;
