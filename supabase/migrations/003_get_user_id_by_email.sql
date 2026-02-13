-- Function to look up a user ID by email (for secretary invitation flow)
-- Must be SECURITY DEFINER to access auth.users
CREATE OR REPLACE FUNCTION public.get_user_id_by_email(email_input text)
RETURNS TABLE(id uuid)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT au.id
  FROM auth.users au
  WHERE au.email = email_input
  LIMIT 1;
$$;

-- Only authenticated users can call this function
REVOKE ALL ON FUNCTION public.get_user_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(text) TO authenticated;
