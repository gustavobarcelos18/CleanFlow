-- Security Fix: Add explicit tenant_id safeguards to pacientes table RLS policies
-- and improve security definer functions to prevent potential bypasses

-- Drop existing policies on pacientes table
DROP POLICY IF EXISTS "Admins can view all patients" ON public.pacientes;
DROP POLICY IF EXISTS "Admins can manage all patients" ON public.pacientes;
DROP POLICY IF EXISTS "Professionals can view assigned patients only" ON public.pacientes;
DROP POLICY IF EXISTS "Professionals can update assigned patients only" ON public.pacientes;
DROP POLICY IF EXISTS "Reception can view all patients" ON public.pacientes;
DROP POLICY IF EXISTS "Reception can manage all patients" ON public.pacientes;

-- Improve get_user_tenant_id function to be more secure
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT tenant_id
  FROM public.profiles
  WHERE id = _user_id
    AND tenant_id IS NOT NULL
  LIMIT 1
$$;

-- Improve professional_can_access_patient to include tenant_id check
CREATE OR REPLACE FUNCTION public.professional_can_access_patient(_professional_id uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prof_tenant_id uuid;
  v_patient_tenant_id uuid;
BEGIN
  -- Get professional's tenant_id
  SELECT tenant_id INTO v_prof_tenant_id
  FROM public.profiles
  WHERE id = _professional_id
  LIMIT 1;
  
  -- Get patient's tenant_id
  SELECT tenant_id INTO v_patient_tenant_id
  FROM public.pacientes
  WHERE id = _patient_id
  LIMIT 1;
  
  -- Must be in same tenant
  IF v_prof_tenant_id IS NULL OR v_patient_tenant_id IS NULL OR v_prof_tenant_id != v_patient_tenant_id THEN
    RETURN false;
  END IF;
  
  -- Check if professional is explicitly assigned or has appointments
  RETURN EXISTS (
    SELECT 1
    FROM public.paciente_atribuicoes
    WHERE profissional_id = _professional_id
      AND paciente_id = _patient_id
      AND tenant_id = v_prof_tenant_id
    
    UNION
    
    SELECT 1
    FROM public.agenda
    WHERE profissional_id = _professional_id
      AND paciente_id = _patient_id
      AND tenant_id = v_prof_tenant_id
  );
END;
$$;

-- Create new secure RLS policies with explicit tenant_id checks

-- Admins can view all patients (explicit tenant_id check)
CREATE POLICY "Admins can view all patients - secure"
ON public.pacientes
FOR SELECT
TO authenticated
USING (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'admin'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND tenant_id = pacientes.tenant_id
      AND role = 'admin'::user_role
  )
);

-- Admins can manage all patients (explicit tenant_id check)
CREATE POLICY "Admins can manage all patients - secure"
ON public.pacientes
FOR ALL
TO authenticated
USING (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'admin'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND tenant_id = pacientes.tenant_id
      AND role = 'admin'::user_role
  )
)
WITH CHECK (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'admin'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND tenant_id = pacientes.tenant_id
      AND role = 'admin'::user_role
  )
);

-- Professionals can view assigned patients only (explicit tenant_id check)
CREATE POLICY "Professionals can view assigned patients - secure"
ON public.pacientes
FOR SELECT
TO authenticated
USING (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'profissional'::user_role)
  AND professional_can_access_patient(auth.uid(), id)
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND tenant_id = pacientes.tenant_id
      AND role = 'profissional'::user_role
  )
);

-- Professionals can update assigned patients only (explicit tenant_id check)
CREATE POLICY "Professionals can update assigned patients - secure"
ON public.pacientes
FOR UPDATE
TO authenticated
USING (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'profissional'::user_role)
  AND professional_can_access_patient(auth.uid(), id)
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND tenant_id = pacientes.tenant_id
      AND role = 'profissional'::user_role
  )
)
WITH CHECK (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'profissional'::user_role)
  AND professional_can_access_patient(auth.uid(), id)
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND tenant_id = pacientes.tenant_id
      AND role = 'profissional'::user_role
  )
);

-- Reception can view all patients (explicit tenant_id check)
CREATE POLICY "Reception can view all patients - secure"
ON public.pacientes
FOR SELECT
TO authenticated
USING (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'recepcao'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND tenant_id = pacientes.tenant_id
      AND role = 'recepcao'::user_role
  )
);

-- Reception can manage all patients (explicit tenant_id check)
CREATE POLICY "Reception can manage all patients - secure"
ON public.pacientes
FOR ALL
TO authenticated
USING (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'recepcao'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND tenant_id = pacientes.tenant_id
      AND role = 'recepcao'::user_role
  )
)
WITH CHECK (
  tenant_id IS NOT NULL
  AND tenant_id = get_user_tenant_id(auth.uid())
  AND user_has_role(auth.uid(), 'recepcao'::user_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND tenant_id = pacientes.tenant_id
      AND role = 'recepcao'::user_role
  )
);