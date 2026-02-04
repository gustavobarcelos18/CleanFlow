-- Corrigir recursão infinita nas políticas RLS
-- Remover políticas problemáticas e recriá-las usando função security definer

-- Remover as políticas que causam recursão
DROP POLICY IF EXISTS "Users can view professionals in same tenant" ON public.profiles;
DROP POLICY IF EXISTS "Users can view specialties in same tenant" ON public.especialidades;
DROP POLICY IF EXISTS "Users can view services in same tenant" ON public.servicos;
DROP POLICY IF EXISTS "Users can view exams in same tenant" ON public.exames_procedimentos;
DROP POLICY IF EXISTS "Users can view packages in same tenant" ON public.pacotes;
DROP POLICY IF EXISTS "Users can view patients in same tenant" ON public.pacientes;

-- PROFILES: Permitir visualizar profissionais do mesmo tenant usando função security definer
CREATE POLICY "Users can view professionals in same tenant"
ON public.profiles
FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
  AND role = 'profissional'
);

-- ESPECIALIDADES: Permitir visualizar especialidades do mesmo tenant
CREATE POLICY "Users can view specialties in same tenant"
ON public.especialidades
FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
);

-- SERVICOS: Permitir visualizar serviços do mesmo tenant
CREATE POLICY "Users can view services in same tenant"
ON public.servicos
FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
);

-- EXAMES_PROCEDIMENTOS: Permitir visualizar exames do mesmo tenant
CREATE POLICY "Users can view exams in same tenant"
ON public.exames_procedimentos
FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
);

-- PACOTES: Permitir visualizar pacotes do mesmo tenant
CREATE POLICY "Users can view packages in same tenant"
ON public.pacotes
FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
);

-- PACIENTES: Permitir visualizar pacientes do mesmo tenant
CREATE POLICY "Users can view patients in same tenant"
ON public.pacientes
FOR SELECT
USING (
  tenant_id = get_user_tenant_id(auth.uid())
);