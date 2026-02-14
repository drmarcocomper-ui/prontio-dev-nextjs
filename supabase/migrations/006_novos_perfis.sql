-- Migração: Expandir papéis de 3 (medico/secretaria/admin) para 5
-- (superadmin/gestor/profissional_saude/financeiro/secretaria)

BEGIN;

-- 1. Remover constraint antiga
ALTER TABLE usuarios_clinicas DROP CONSTRAINT IF EXISTS usuarios_clinicas_papel_check;

-- 2. Migrar dados existentes
UPDATE usuarios_clinicas SET papel = 'superadmin' WHERE papel = 'admin';
UPDATE usuarios_clinicas SET papel = 'profissional_saude' WHERE papel = 'medico';

-- 3. Adicionar nova constraint
ALTER TABLE usuarios_clinicas ADD CONSTRAINT usuarios_clinicas_papel_check
  CHECK (papel IN ('superadmin', 'gestor', 'profissional_saude', 'financeiro', 'secretaria'));

-- 4. Atualizar funções RLS
CREATE OR REPLACE FUNCTION public.get_my_medico_clinica_ids()
RETURNS setof uuid LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE
AS $$ SELECT clinica_id FROM public.usuarios_clinicas WHERE user_id = auth.uid() AND papel IN ('superadmin', 'gestor', 'profissional_saude'); $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE
AS $$ SELECT EXISTS (SELECT 1 FROM public.usuarios_clinicas WHERE user_id = auth.uid() AND papel = 'superadmin'); $$;

CREATE OR REPLACE FUNCTION public.get_my_clinic_medico_ids()
RETURNS setof uuid LANGUAGE sql SECURITY DEFINER SET search_path = '' STABLE
AS $$
  SELECT uc.user_id FROM public.usuarios_clinicas uc
  WHERE uc.clinica_id IN (SELECT public.get_my_clinica_ids())
  AND uc.papel IN ('superadmin', 'profissional_saude');
$$;

-- 5. Atualizar policy de transacoes (financeiro precisa acessar)
DROP POLICY IF EXISTS "Medico acessa transacoes" ON transacoes;
CREATE POLICY "Medico acessa transacoes" ON transacoes FOR ALL TO authenticated
  USING (clinica_id IN (SELECT public.get_my_clinica_ids()) OR public.is_admin());

COMMIT;
