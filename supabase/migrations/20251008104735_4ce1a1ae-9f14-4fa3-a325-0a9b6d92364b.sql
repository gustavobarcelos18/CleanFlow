-- Fix infinite recursion in system_users RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Master users can manage system users" ON system_users;
DROP POLICY IF EXISTS "Master users can view all system users" ON system_users;
DROP POLICY IF EXISTS "System users can view own record" ON system_users;

-- Recreate policies using the existing security definer function
CREATE POLICY "Master users can manage system users"
ON system_users
FOR ALL
USING (has_support_access(auth.uid()) AND get_support_level(auth.uid()) = 'master')
WITH CHECK (has_support_access(auth.uid()) AND get_support_level(auth.uid()) = 'master');

CREATE POLICY "Support users can view all system users"
ON system_users
FOR SELECT
USING (has_support_access(auth.uid()));

CREATE POLICY "System users can view own record"
ON system_users
FOR SELECT
USING (id = auth.uid());

-- Insert master user barcelos32@gmail.com into system_users
-- First we need to get the user_id from auth.users
-- Insert master user barcelos32@gmail.com into system_users
-- First we need to get the user_id from auth.users
/* 
REMOVIDO POR SEGURANÇA - Use supabase/seeds/dev_seed_master_user.sql em DEV
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Get the user_id for barcelos32@gmail.com
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'barcelos32@gmail.com';
  
  -- Only insert if user exists and not already in system_users
  IF v_user_id IS NOT NULL THEN
    INSERT INTO system_users (id, system_role, active, created_at, updated_at)
    VALUES (v_user_id, 'master', true, now(), now())
    ON CONFLICT (id) DO UPDATE
    SET system_role = 'master', active = true, updated_at = now();
  END IF;
END $$;
*/