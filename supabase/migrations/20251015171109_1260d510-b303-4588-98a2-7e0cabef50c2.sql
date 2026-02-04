-- Security Fix: Remove recursive RLS policies on pacientes table
-- The existing policies call security definer functions (get_user_tenant_id, user_has_role) 
-- but then also have redundant EXISTS clauses that query profiles directly, causing recursion

-- Drop existing recursive policies
DROP POLICY IF EXISTS "Admins can view all patients - secure" ON public.pacientes;
DROP POLICY IF EXISTS "Admins can manage all patients - secure" ON public.pacientes;
DROP POLICY IF EXISTS "Professionals can view assigned patients - secure" ON public.pacientes;
DROP POLICY IF EXISTS "Professionals can update assigned patients - secure" ON public.pacientes;
DROP POLICY IF EXISTS "Reception can view all patients - secure" ON public.pacientes;
DROP POLICY IF EXISTS "Reception can manage all patients - secure" ON public.pacientes;

-- Create simplified policies using ONLY security definer functions (no recursion)

-- Admins can view all patients
CREATE POLICY "Admins can view all patients - secure"
ON public.pacientes
FOR SELECT
TO authenticated
USING (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'admin'::user_role)
);

-- Admins can manage all patients
CREATE POLICY "Admins can manage all patients - secure"
ON public.pacientes
FOR ALL
TO authenticated
USING (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'admin'::user_role)
)
WITH CHECK (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'admin'::user_role)
);

-- Professionals can view assigned patients
CREATE POLICY "Professionals can view assigned patients - secure"
ON public.pacientes
FOR SELECT
TO authenticated
USING (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'profissional'::user_role)
  AND professional_can_access_patient(auth.uid(), id)
);

-- Professionals can update assigned patients
CREATE POLICY "Professionals can update assigned patients - secure"
ON public.pacientes
FOR UPDATE
TO authenticated
USING (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'profissional'::user_role)
  AND professional_can_access_patient(auth.uid(), id)
)
WITH CHECK (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'profissional'::user_role)
  AND professional_can_access_patient(auth.uid(), id)
);

-- Reception can view all patients
CREATE POLICY "Reception can view all patients - secure"
ON public.pacientes
FOR SELECT
TO authenticated
USING (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'recepcao'::user_role)
);

-- Reception can manage all patients
CREATE POLICY "Reception can manage all patients - secure"
ON public.pacientes
FOR ALL
TO authenticated
USING (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'recepcao'::user_role)
)
WITH CHECK (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'recepcao'::user_role)
);