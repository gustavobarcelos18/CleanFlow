
-- ========================================
-- ClinFlow RLS Phase 1: Tenant & Role Isolation
-- ========================================

-- 1. REMOVER POLÍTICAS ANTIGAS PRIMEIRO
-- ========================================

-- Profiles
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view professionals in same tenant" ON public.profiles;
DROP POLICY IF EXISTS "View profiles in same tenant" ON public.profiles;

-- Pacientes
DROP POLICY IF EXISTS "Admins can manage all patients - secure" ON public.pacientes;
DROP POLICY IF EXISTS "Admins can view all patients - secure" ON public.pacientes;
DROP POLICY IF EXISTS "Professionals can update assigned patients - secure" ON public.pacientes;
DROP POLICY IF EXISTS "Professionals can view assigned patients - secure" ON public.pacientes;
DROP POLICY IF EXISTS "Reception can manage all patients - secure" ON public.pacientes;
DROP POLICY IF EXISTS "Reception can view all patients - secure" ON public.pacientes;
DROP POLICY IF EXISTS "Users can view patients in same tenant" ON public.pacientes;

-- Agenda
DROP POLICY IF EXISTS "Medical staff can view appointments" ON public.agenda;
DROP POLICY IF EXISTS "Staff can manage appointments" ON public.agenda;

-- Prontuarios
DROP POLICY IF EXISTS "Admins podem ver todos prontuários" ON public.prontuarios;
DROP POLICY IF EXISTS "Profissionais podem atualizar seus prontuários" ON public.prontuarios;
DROP POLICY IF EXISTS "Profissionais podem criar prontuários" ON public.prontuarios;
DROP POLICY IF EXISTS "Profissionais podem ver seus prontuários" ON public.prontuarios;

-- Servicos
DROP POLICY IF EXISTS "Admins can manage services" ON public.servicos;
DROP POLICY IF EXISTS "Users can view services" ON public.servicos;

-- 2. AGORA PODEMOS RECRIAR FUNÇÕES
-- ========================================

DROP FUNCTION IF EXISTS public.get_user_tenant_id_safe(uuid) CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id_safe(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(_user_id uuid, _tenant_id uuid)
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
      AND tenant_id = _tenant_id
  )
$$;

CREATE OR REPLACE FUNCTION public.user_is_tenant_admin(_user_id uuid)
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
      AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.user_is_tenant_staff(_user_id uuid)
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
      AND role IN ('admin', 'profissional', 'recepcao')
  )
$$;

-- 3. POLÍTICAS PROFILES
-- ========================================

CREATE POLICY "profiles_view_own"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "profiles_tenant_select"
ON public.profiles FOR SELECT
TO authenticated
USING (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
);

CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_manage"
ON public.profiles FOR ALL
TO authenticated
USING (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND user_is_tenant_admin(auth.uid())
)
WITH CHECK (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND user_is_tenant_admin(auth.uid())
);

-- 4. POLÍTICAS PACIENTES
-- ========================================

CREATE POLICY "pacientes_tenant_select"
ON public.pacientes FOR SELECT
TO authenticated
USING (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
);

CREATE POLICY "pacientes_tenant_insert"
ON public.pacientes FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND user_is_tenant_staff(auth.uid())
);

CREATE POLICY "pacientes_tenant_update"
ON public.pacientes FOR UPDATE
TO authenticated
USING (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND user_is_tenant_staff(auth.uid())
)
WITH CHECK (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND user_is_tenant_staff(auth.uid())
);

CREATE POLICY "pacientes_tenant_delete"
ON public.pacientes FOR DELETE
TO authenticated
USING (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND user_is_tenant_admin(auth.uid())
);

-- 5. POLÍTICAS AGENDA
-- ========================================

CREATE POLICY "agenda_tenant_select"
ON public.agenda FOR SELECT
TO authenticated
USING (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
);

CREATE POLICY "agenda_tenant_insert"
ON public.agenda FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND user_is_tenant_staff(auth.uid())
);

CREATE POLICY "agenda_tenant_update"
ON public.agenda FOR UPDATE
TO authenticated
USING (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND user_is_tenant_staff(auth.uid())
)
WITH CHECK (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND user_is_tenant_staff(auth.uid())
);

CREATE POLICY "agenda_tenant_delete"
ON public.agenda FOR DELETE
TO authenticated
USING (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND user_is_tenant_admin(auth.uid())
);

-- 6. POLÍTICAS PRONTUARIOS
-- ========================================

CREATE POLICY "prontuarios_tenant_select"
ON public.prontuarios FOR SELECT
TO authenticated
USING (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND (
    user_is_tenant_admin(auth.uid())
    OR profissional_id = auth.uid()
  )
);

CREATE POLICY "prontuarios_tenant_insert"
ON public.prontuarios FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND (
    user_is_tenant_admin(auth.uid())
    OR (user_has_role(auth.uid(), 'profissional') AND profissional_id = auth.uid())
  )
);

CREATE POLICY "prontuarios_tenant_update"
ON public.prontuarios FOR UPDATE
TO authenticated
USING (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND (
    user_is_tenant_admin(auth.uid())
    OR (user_has_role(auth.uid(), 'profissional') AND profissional_id = auth.uid())
  )
)
WITH CHECK (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
);

CREATE POLICY "prontuarios_tenant_delete"
ON public.prontuarios FOR DELETE
TO authenticated
USING (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND user_is_tenant_admin(auth.uid())
);

-- 7. POLÍTICAS SERVICOS
-- ========================================

CREATE POLICY "servicos_tenant_select"
ON public.servicos FOR SELECT
TO authenticated
USING (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
);

CREATE POLICY "servicos_tenant_insert"
ON public.servicos FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND user_is_tenant_admin(auth.uid())
);

CREATE POLICY "servicos_tenant_update"
ON public.servicos FOR UPDATE
TO authenticated
USING (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND user_is_tenant_admin(auth.uid())
)
WITH CHECK (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
);

CREATE POLICY "servicos_tenant_delete"
ON public.servicos FOR DELETE
TO authenticated
USING (
  tenant_id IS NOT NULL 
  AND user_belongs_to_tenant(auth.uid(), tenant_id)
  AND user_is_tenant_admin(auth.uid())
);

-- 8. GARANTIR RLS HABILITADO
-- ========================================

ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prontuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 9. ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_pacientes_tenant_id ON public.pacientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agenda_tenant_id ON public.agenda(tenant_id);
CREATE INDEX IF NOT EXISTS idx_prontuarios_tenant_id ON public.prontuarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_servicos_tenant_id ON public.servicos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
