-- Simplificar solicitacoes_exames: remover constraint de tipo e NOT NULL
-- Campos tipo, operadora, numero_carteirinha ficam nullable (dados históricos preservados)

-- Remover constraint NOT NULL e CHECK do campo tipo
ALTER TABLE solicitacoes_exames ALTER COLUMN tipo DROP NOT NULL;
ALTER TABLE solicitacoes_exames DROP CONSTRAINT IF EXISTS solicitacoes_exames_tipo_check;
