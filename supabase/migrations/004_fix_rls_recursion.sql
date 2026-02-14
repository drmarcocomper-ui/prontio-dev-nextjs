-- ============================================
-- 004 — Corrigir recursão infinita no RLS
-- ============================================
-- As políticas de usuarios_clinicas faziam subquery nela mesma,
-- causando "infinite recursion detected in policy".
-- Solução: funções SECURITY DEFINER que bypassam RLS.

CREATE OR REPLACE FUNCTION public.get_my_clinica_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE
AS $$ SELECT clinica_id FROM public.usuarios_clinicas WHERE user_id = auth.uid(); $$;

CREATE OR REPLACE FUNCTION public.get_my_medico_clinica_ids()
RETURNS SETOF uuid
LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE
AS $$ SELECT clinica_id FROM public.usuarios_clinicas WHERE user_id = auth.uid() AND papel = 'medico'; $$;

-- usuarios_clinicas
DROP POLICY IF EXISTS "Acesso vinculos leitura" ON usuarios_clinicas;
CREATE POLICY "Acesso vinculos leitura" ON usuarios_clinicas FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR clinica_id IN (SELECT public.get_my_medico_clinica_ids()));

DROP POLICY IF EXISTS "Medico gerencia vinculos" ON usuarios_clinicas;
CREATE POLICY "Medico gerencia vinculos" ON usuarios_clinicas FOR ALL TO authenticated
  USING (clinica_id IN (SELECT public.get_my_medico_clinica_ids()))
  WITH CHECK (clinica_id IN (SELECT public.get_my_medico_clinica_ids()));

-- clinicas
DROP POLICY IF EXISTS "Acesso clinicas" ON clinicas;
CREATE POLICY "Acesso clinicas" ON clinicas FOR SELECT TO authenticated
  USING (id IN (SELECT public.get_my_clinica_ids()));

DROP POLICY IF EXISTS "Medico gerencia clinicas" ON clinicas;
CREATE POLICY "Medico gerencia clinicas" ON clinicas FOR ALL TO authenticated
  USING (id IN (SELECT public.get_my_medico_clinica_ids()))
  WITH CHECK (id IN (SELECT public.get_my_medico_clinica_ids()));

-- pacientes
DROP POLICY IF EXISTS "Acesso pacientes" ON pacientes;
CREATE POLICY "Acesso pacientes" ON pacientes FOR ALL TO authenticated
  USING (
    medico_id = auth.uid()
    OR medico_id IN (
      SELECT uc.user_id FROM public.usuarios_clinicas uc
      WHERE uc.clinica_id IN (SELECT public.get_my_clinica_ids()) AND uc.papel = 'medico'
    )
  );

-- agendamentos
DROP POLICY IF EXISTS "Acesso agendamentos" ON agendamentos;
CREATE POLICY "Acesso agendamentos" ON agendamentos FOR ALL TO authenticated
  USING (clinica_id IN (SELECT public.get_my_clinica_ids()));

-- transacoes
DROP POLICY IF EXISTS "Medico acessa transacoes" ON transacoes;
CREATE POLICY "Medico acessa transacoes" ON transacoes FOR ALL TO authenticated
  USING (clinica_id IN (SELECT public.get_my_medico_clinica_ids()));

-- configuracoes
DROP POLICY IF EXISTS "Acesso configuracoes" ON configuracoes;
CREATE POLICY "Acesso configuracoes" ON configuracoes FOR ALL TO authenticated
  USING (
    user_id = auth.uid()
    OR clinica_id IN (SELECT public.get_my_clinica_ids())
    OR (user_id IS NULL AND clinica_id IS NULL)
  );
