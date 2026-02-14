-- ============================================
-- 005 — Adicionar papel 'admin' (desenvolvedor)
-- ============================================
-- Admin tem acesso total a todas as tabelas e clínicas.

-- 1. Alterar CHECK constraint para incluir 'admin'
ALTER TABLE usuarios_clinicas DROP CONSTRAINT IF EXISTS usuarios_clinicas_papel_check;
ALTER TABLE usuarios_clinicas ADD CONSTRAINT usuarios_clinicas_papel_check
  CHECK (papel IN ('medico', 'secretaria', 'admin'));

-- 2. Função para retornar clinica_ids de admins
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM public.usuarios_clinicas WHERE user_id = auth.uid() AND papel = 'admin'); $$;

-- 3. Atualizar políticas RLS para incluir admin

-- clinicas: admin vê todas
DROP POLICY IF EXISTS "Acesso clinicas" ON clinicas;
CREATE POLICY "Acesso clinicas" ON clinicas FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_my_clinica_ids()) OR public.is_admin());

DROP POLICY IF EXISTS "Medico gerencia clinicas" ON clinicas;
CREATE POLICY "Medico gerencia clinicas" ON clinicas FOR ALL TO authenticated
  USING (id IN (SELECT public.get_my_medico_clinica_ids()) OR public.is_admin())
  WITH CHECK (id IN (SELECT public.get_my_medico_clinica_ids()) OR public.is_admin());

-- usuarios_clinicas: admin vê e gerencia todos
DROP POLICY IF EXISTS "Acesso vinculos leitura" ON usuarios_clinicas;
CREATE POLICY "Acesso vinculos leitura" ON usuarios_clinicas FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR clinica_id IN (SELECT public.get_my_medico_clinica_ids()) OR public.is_admin());

DROP POLICY IF EXISTS "Medico gerencia vinculos" ON usuarios_clinicas;
CREATE POLICY "Medico gerencia vinculos" ON usuarios_clinicas FOR ALL TO authenticated
  USING (clinica_id IN (SELECT public.get_my_medico_clinica_ids()) OR public.is_admin())
  WITH CHECK (clinica_id IN (SELECT public.get_my_medico_clinica_ids()) OR public.is_admin());

-- pacientes: admin acessa todos
DROP POLICY IF EXISTS "Acesso pacientes" ON pacientes;
CREATE POLICY "Acesso pacientes" ON pacientes FOR ALL TO authenticated
  USING (
    medico_id = auth.uid()
    OR medico_id IN (
      SELECT uc.user_id FROM public.usuarios_clinicas uc
      WHERE uc.clinica_id IN (SELECT public.get_my_clinica_ids()) AND uc.papel = 'medico'
    )
    OR public.is_admin()
  );

-- prontuarios: admin acessa todos
DROP POLICY IF EXISTS "Medico acessa prontuarios" ON prontuarios;
CREATE POLICY "Medico acessa prontuarios" ON prontuarios FOR ALL TO authenticated
  USING (medico_id = auth.uid() OR public.is_admin())
  WITH CHECK (medico_id = auth.uid() OR public.is_admin());

-- receitas: admin acessa todas
DROP POLICY IF EXISTS "Medico acessa receitas" ON receitas;
CREATE POLICY "Medico acessa receitas" ON receitas FOR ALL TO authenticated
  USING (medico_id = auth.uid() OR public.is_admin())
  WITH CHECK (medico_id = auth.uid() OR public.is_admin());

-- agendamentos: admin acessa todos
DROP POLICY IF EXISTS "Acesso agendamentos" ON agendamentos;
CREATE POLICY "Acesso agendamentos" ON agendamentos FOR ALL TO authenticated
  USING (clinica_id IN (SELECT public.get_my_clinica_ids()) OR public.is_admin());

-- transacoes: admin acessa todas
DROP POLICY IF EXISTS "Medico acessa transacoes" ON transacoes;
CREATE POLICY "Medico acessa transacoes" ON transacoes FOR ALL TO authenticated
  USING (clinica_id IN (SELECT public.get_my_medico_clinica_ids()) OR public.is_admin());

-- configuracoes: admin acessa todas
DROP POLICY IF EXISTS "Acesso configuracoes" ON configuracoes;
CREATE POLICY "Acesso configuracoes" ON configuracoes FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR clinica_id IN (SELECT public.get_my_clinica_ids())
    OR (user_id IS NULL AND clinica_id IS NULL)
    OR public.is_admin()
  );
