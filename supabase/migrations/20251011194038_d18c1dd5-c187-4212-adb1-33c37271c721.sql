-- Fix RLS policies for usuarios_suporte to avoid recursive checks and restrictive AND behavior
-- 1) Drop existing restrictive policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usuarios_suporte' AND policyname = 'Master and admin can manage support users'
  ) THEN
    DROP POLICY "Master and admin can manage support users" ON public.usuarios_suporte;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usuarios_suporte' AND policyname = 'Master and admin can view all support users'
  ) THEN
    DROP POLICY "Master and admin can view all support users" ON public.usuarios_suporte;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usuarios_suporte' AND policyname = 'Users can update own profile'
  ) THEN
    DROP POLICY "Users can update own profile" ON public.usuarios_suporte;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'usuarios_suporte' AND policyname = 'Users can view own profile'
  ) THEN
    DROP POLICY "Users can view own profile" ON public.usuarios_suporte;
  END IF;
END $$;

-- 2) Recreate permissive policies using security-definer helpers to avoid recursion
-- Allow users to view their own support profile
CREATE POLICY support_view_self
ON public.usuarios_suporte
FOR SELECT
USING (auth.uid() = auth_user_id);

-- Allow master/admin to view everyone
CREATE POLICY support_admin_view_all
ON public.usuarios_suporte
FOR SELECT
USING (public.has_support_role(auth.uid(), 'master') OR public.has_support_role(auth.uid(), 'admin'));

-- Allow users to update their own support profile
CREATE POLICY support_update_self
ON public.usuarios_suporte
FOR UPDATE
USING (auth.uid() = auth_user_id);

-- Allow master/admin to fully manage support users (insert/update/delete/select)
CREATE POLICY support_admin_manage_all
ON public.usuarios_suporte
FOR ALL
USING (public.has_support_role(auth.uid(), 'master') OR public.has_support_role(auth.uid(), 'admin'))
WITH CHECK (public.has_support_role(auth.uid(), 'master') OR public.has_support_role(auth.uid(), 'admin'));
