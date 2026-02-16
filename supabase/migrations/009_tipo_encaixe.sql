-- Adicionar 'encaixe' ao tipo de agendamento
ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS agendamentos_tipo_check;
ALTER TABLE agendamentos ADD CONSTRAINT agendamentos_tipo_check
  CHECK (tipo IN ('consulta', 'retorno', 'exame', 'procedimento', 'avaliacao', 'encaixe'));
