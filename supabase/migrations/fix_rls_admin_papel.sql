-- Fix: incluir papel 'admin' nas funções e policies de RLS
-- O papel 'admin' deve ter os mesmos acessos que 'medico'

-- 1. Atualizar função get_my_medico_clinica_ids para incluir admin
create or replace function public.get_my_medico_clinica_ids()
returns setof uuid language sql security definer set search_path = '' stable
as $$ select clinica_id from public.usuarios_clinicas where user_id = auth.uid() and papel in ('medico', 'admin'); $$;

-- 2. Criar função SECURITY DEFINER para retornar medico/admin ids das clínicas do usuário
-- (necessária porque a subquery inline seria bloqueada pelo RLS de usuarios_clinicas)
create or replace function public.get_my_clinic_medico_ids()
returns setof uuid language sql security definer set search_path = '' stable
as $$
  select uc.user_id from public.usuarios_clinicas uc
  where uc.clinica_id in (select public.get_my_clinica_ids())
  and uc.papel in ('medico', 'admin');
$$;

-- 3. Atualizar policy de pacientes usando a nova função
drop policy if exists "Acesso pacientes" on pacientes;
create policy "Acesso pacientes" on pacientes for all to authenticated
  using (
    medico_id = auth.uid()
    or medico_id in (select public.get_my_clinic_medico_ids())
    or public.is_admin()
  );
