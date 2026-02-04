-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view profiles in same tenant" ON public.profiles;

-- Drop duplicate policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create or replace function to get user tenant_id safely (without recursion)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id_safe(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = user_id;
$$;

-- Create new safe policy for viewing profiles in same tenant
CREATE POLICY "View profiles in same tenant" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id 
    OR tenant_id = get_user_tenant_id_safe(auth.uid())
  );