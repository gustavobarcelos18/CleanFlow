-- Create security definer functions to prevent infinite recursion in RLS policies
-- and ensure proper role-based access control

-- Function to check if a user has a specific role
CREATE OR REPLACE FUNCTION public.user_has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$;

-- Function to check if a user has any of the specified roles
CREATE OR REPLACE FUNCTION public.user_has_any_role(_user_id uuid, _roles user_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = ANY(_roles)
  )
$$;

-- Function to check if a professional is assigned to a patient
CREATE OR REPLACE FUNCTION public.professional_can_access_patient(_professional_id uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check if professional is explicitly assigned to the patient
    SELECT 1
    FROM public.paciente_atribuicoes
    WHERE profissional_id = _professional_id
      AND paciente_id = _patient_id
    
    UNION
    
    -- Check if professional has appointments with the patient
    SELECT 1
    FROM public.agenda
    WHERE profissional_id = _professional_id
      AND paciente_id = _patient_id
  )
$$;

-- Function to get user's tenant_id securely
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Drop all existing policies on pacientes table
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins and reception can manage all patients" ON public.pacientes;
  DROP POLICY IF EXISTS "Admins can view all patients" ON public.pacientes;
  DROP POLICY IF EXISTS "Professionals can update assigned patients" ON public.pacientes;
  DROP POLICY IF EXISTS "Professionals can view assigned patients" ON public.pacientes;
  DROP POLICY IF EXISTS "Reception can view all patients" ON public.pacientes;
  DROP POLICY IF EXISTS "Professionals can view assigned patients only" ON public.pacientes;
  DROP POLICY IF EXISTS "Admins can manage all patients" ON public.pacientes;
  DROP POLICY IF EXISTS "Reception can manage all patients" ON public.pacientes;
  DROP POLICY IF EXISTS "Professionals can update assigned patients only" ON public.pacientes;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create new secure policies for pacientes table

-- Admins can view all patients in their tenant
CREATE POLICY "Admins can view all patients"
ON public.pacientes
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.user_has_role(auth.uid(), 'admin'::user_role)
);

-- Reception can view all patients in their tenant
CREATE POLICY "Reception can view all patients"
ON public.pacientes
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.user_has_role(auth.uid(), 'recepcao'::user_role)
);

-- Professionals can ONLY view patients assigned to them or with appointments
CREATE POLICY "Professionals can view assigned patients only"
ON public.pacientes
FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.user_has_role(auth.uid(), 'profissional'::user_role)
  AND public.professional_can_access_patient(auth.uid(), id)
);

-- Admins can manage all patients in their tenant
CREATE POLICY "Admins can manage all patients"
ON public.pacientes
FOR ALL
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.user_has_role(auth.uid(), 'admin'::user_role)
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.user_has_role(auth.uid(), 'admin'::user_role)
);

-- Reception can manage all patients in their tenant
CREATE POLICY "Reception can manage all patients"
ON public.pacientes
FOR ALL
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.user_has_role(auth.uid(), 'recepcao'::user_role)
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.user_has_role(auth.uid(), 'recepcao'::user_role)
);

-- Professionals can only update patients assigned to them
CREATE POLICY "Professionals can update assigned patients only"
ON public.pacientes
FOR UPDATE
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.user_has_role(auth.uid(), 'profissional'::user_role)
  AND public.professional_can_access_patient(auth.uid(), id)
)
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.user_has_role(auth.uid(), 'profissional'::user_role)
  AND public.professional_can_access_patient(auth.uid(), id)
);