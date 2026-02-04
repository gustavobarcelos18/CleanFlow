-- ============================================
-- CLINFLOW MULTI-UNIT ARCHITECTURE
-- ============================================

-- 1. ORGANIZATIONS TABLE (extends concept of tenant for multi-unit)
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_fantasia text NOT NULL,
  razao_social text,
  documento text, -- CNPJ da matriz
  pais text DEFAULT 'BR',
  moeda text DEFAULT 'BRL',
  timezone text DEFAULT 'America/Sao_Paulo',
  logo_url text,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
  plano_base text DEFAULT 'pro',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. ORGANIZATION SETTINGS (global policies, defaults)
CREATE TABLE IF NOT EXISTS public.organization_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- Políticas globais
  politica_cancelamento jsonb DEFAULT '{"antecedencia_horas": 24, "permite_reagendamento": true}'::jsonb,
  politica_lembretes jsonb DEFAULT '{"habilitado": true, "janelas_horas": [72, 24, 3]}'::jsonb,
  politica_no_show jsonb DEFAULT '{"registrar_historico": true, "bloquear_apos_faltas": 3}'::jsonb,
  -- Defaults de agenda
  defaults_agenda jsonb DEFAULT '{"duracao_padrao_min": 30, "intervalo_min": 15, "overbooking": false}'::jsonb,
  -- Defaults de pagamento
  defaults_pagamento jsonb DEFAULT '{"formas_habilitadas": ["dinheiro", "pix", "cartao", "convenio"]}'::jsonb,
  -- Branding
  branding jsonb DEFAULT '{}'::jsonb,
  -- Mensageria
  mensageria_modo text DEFAULT 'central' CHECK (mensageria_modo IN ('central', 'por_unidade')),
  -- WhatsApp central (se modo = central)
  whatsapp_phone_number_id text,
  whatsapp_waba_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id)
);

-- 3. UNITS TABLE (unidades/filiais)
CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  nome_unidade text NOT NULL,
  codigo_interno text, -- Ex: "MATRIZ", "FIL01"
  razao_social text,
  documento text, -- CNPJ da unidade
  -- Endereço
  endereco_logradouro text,
  endereco_numero text,
  endereco_complemento text,
  endereco_bairro text,
  endereco_cidade text,
  endereco_uf text,
  endereco_cep text,
  -- Contato
  telefone text,
  email text,
  -- Configurações
  timezone text, -- NULL herda da organização
  is_matriz boolean DEFAULT false,
  status text DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. UNIT SETTINGS (overrides por unidade)
CREATE TABLE IF NOT EXISTS public.unit_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- Flags de override (true = usa config própria, false = herda da org)
  override_servicos boolean DEFAULT false,
  override_horarios boolean DEFAULT false,
  override_pagamentos boolean DEFAULT false,
  override_mensagens boolean DEFAULT false,
  override_whatsapp boolean DEFAULT false,
  override_pix boolean DEFAULT false,
  -- Configurações próprias (só aplicam se override = true)
  horarios_funcionamento jsonb DEFAULT '[]'::jsonb,
  servicos_customizados jsonb DEFAULT '[]'::jsonb,
  formas_pagamento_habilitadas jsonb DEFAULT '[]'::jsonb,
  -- Mensageria própria
  whatsapp_phone_number_id text,
  whatsapp_waba_id text,
  -- Financeiro
  contas_pix jsonb DEFAULT '[]'::jsonb,
  adquirentes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(unit_id)
);

-- 5. USER UNIT ROLES (RBAC multinível)
CREATE TYPE org_role AS ENUM (
  'org_admin',      -- Admin da organização (tudo)
  'org_finance',    -- Financeiro de toda org
  'unit_admin',     -- Admin de uma unidade específica
  'unit_finance',   -- Financeiro de uma unidade
  'atendimento',    -- Agendas e atendimento
  'leitura'         -- Somente leitura
);

CREATE TABLE IF NOT EXISTS public.user_unit_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE, -- NULL = escopo org
  role org_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id, unit_id, role)
);

-- 6. SERVICES CATALOG (catálogo de serviços org/unit)
CREATE TABLE IF NOT EXISTS public.services_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL, -- NULL = serviço da org
  scope text DEFAULT 'org' CHECK (scope IN ('org', 'unit')),
  nome text NOT NULL,
  descricao text,
  duracao_min integer DEFAULT 30,
  preco_base numeric(10,2) DEFAULT 0,
  categorias text[] DEFAULT '{}',
  ativo boolean DEFAULT true,
  ordem integer DEFAULT 0,
  -- Se é clone de serviço da org
  parent_service_id uuid REFERENCES public.services_catalog(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. APPOINTMENT TRANSFERS LOG
CREATE TABLE IF NOT EXISTS public.appointment_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL,
  from_unit_id uuid NOT NULL REFERENCES public.units(id),
  to_unit_id uuid NOT NULL REFERENCES public.units(id),
  transferred_by uuid REFERENCES auth.users(id),
  motivo text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 8. Add organization_id and unit_id to existing tables
-- PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id);

-- AGENDA
ALTER TABLE public.agenda
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id);

-- PACIENTES
ALTER TABLE public.pacientes
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id);

-- CAIXA_DIARIO
ALTER TABLE public.caixa_diario
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id);

-- CONTAS_RECEBER
ALTER TABLE public.contas_receber
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id);

-- SERVICOS
ALTER TABLE public.servicos
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id);

-- PROFISSIONAIS (via profiles já tem)

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated at triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unit_settings_updated_at
  BEFORE UPDATE ON public.unit_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_catalog_updated_at
  BEFORE UPDATE ON public.services_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_organization_id(p_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = p_user_id LIMIT 1;
$$;

-- Check if user has org-level role
CREATE OR REPLACE FUNCTION public.has_org_role(p_user_id uuid, p_org_id uuid, p_roles org_role[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_unit_roles
    WHERE user_id = p_user_id
      AND organization_id = p_org_id
      AND role = ANY(p_roles)
  );
$$;

-- Check if user has access to specific unit
CREATE OR REPLACE FUNCTION public.has_unit_access(p_user_id uuid, p_unit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_unit_roles uur
    JOIN public.units u ON u.id = p_unit_id
    WHERE uur.user_id = p_user_id
      AND uur.organization_id = u.organization_id
      AND (
        uur.unit_id IS NULL -- Org-level access
        OR uur.unit_id = p_unit_id -- Unit-specific access
      )
  );
$$;

-- Get effective setting (unit override or org default)
CREATE OR REPLACE FUNCTION public.get_effective_setting(p_unit_id uuid, p_setting_name text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_unit_settings record;
  v_org_settings record;
  v_override_flag boolean;
BEGIN
  -- Get unit settings
  SELECT * INTO v_unit_settings
  FROM public.unit_settings
  WHERE unit_id = p_unit_id;

  -- Get org settings
  SELECT os.* INTO v_org_settings
  FROM public.organization_settings os
  JOIN public.units u ON u.organization_id = os.organization_id
  WHERE u.id = p_unit_id;

  -- Check override flag
  EXECUTE format('SELECT %I FROM public.unit_settings WHERE unit_id = $1', 'override_' || p_setting_name)
  INTO v_override_flag
  USING p_unit_id;

  -- Return appropriate value based on override
  IF v_override_flag = true THEN
    EXECUTE format('SELECT %I::jsonb FROM public.unit_settings WHERE unit_id = $1', p_setting_name || '_customizados')
    INTO v_unit_settings
    USING p_unit_id;
    RETURN v_unit_settings;
  ELSE
    EXECUTE format('SELECT %I::jsonb FROM public.organization_settings WHERE organization_id = $1', 'defaults_' || p_setting_name)
    INTO v_org_settings
    USING (SELECT organization_id FROM public.units WHERE id = p_unit_id);
    RETURN v_org_settings;
  END IF;
END;
$$;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_unit_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_transfers ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organization"
  ON public.organizations FOR SELECT
  USING (id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org admins can update organization"
  ON public.organizations FOR UPDATE
  USING (has_org_role(auth.uid(), id, ARRAY['org_admin']::org_role[]));

-- Organization settings policies  
CREATE POLICY "Users can view org settings"
  ON public.organization_settings FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org admins can manage org settings"
  ON public.organization_settings FOR ALL
  USING (has_org_role(auth.uid(), organization_id, ARRAY['org_admin']::org_role[]));

-- Units policies
CREATE POLICY "Users can view units in their org"
  ON public.units FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org admins can manage units"
  ON public.units FOR ALL
  USING (has_org_role(auth.uid(), organization_id, ARRAY['org_admin']::org_role[]));

-- Unit settings policies
CREATE POLICY "Users can view unit settings"
  ON public.unit_settings FOR SELECT
  USING (has_unit_access(auth.uid(), unit_id));

CREATE POLICY "Unit admins can manage unit settings"
  ON public.unit_settings FOR ALL
  USING (
    has_org_role(auth.uid(), organization_id, ARRAY['org_admin']::org_role[])
    OR (
      has_unit_access(auth.uid(), unit_id) 
      AND has_org_role(auth.uid(), organization_id, ARRAY['unit_admin']::org_role[])
    )
  );

-- User unit roles policies
CREATE POLICY "Users can view roles in their org"
  ON public.user_unit_roles FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Org admins can manage roles"
  ON public.user_unit_roles FOR ALL
  USING (has_org_role(auth.uid(), organization_id, ARRAY['org_admin']::org_role[]));

-- Services catalog policies
CREATE POLICY "Users can view services in their org"
  ON public.services_catalog FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can manage services"
  ON public.services_catalog FOR ALL
  USING (
    has_org_role(auth.uid(), organization_id, ARRAY['org_admin']::org_role[])
    OR (
      unit_id IS NOT NULL 
      AND has_unit_access(auth.uid(), unit_id)
      AND has_org_role(auth.uid(), organization_id, ARRAY['unit_admin']::org_role[])
    )
  );

-- Appointment transfers policies
CREATE POLICY "Users can view transfers in their org"
  ON public.appointment_transfers FOR SELECT
  USING (
    from_unit_id IN (SELECT id FROM public.units WHERE organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Admins can create transfers"
  ON public.appointment_transfers FOR INSERT
  WITH CHECK (
    has_unit_access(auth.uid(), from_unit_id)
    AND has_unit_access(auth.uid(), to_unit_id)
  );

-- Support access policies
CREATE POLICY "Support can view all organizations"
  ON public.organizations FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Support can manage all organizations"
  ON public.organizations FOR ALL
  USING (has_support_access(auth.uid()));

CREATE POLICY "Support can view all units"
  ON public.units FOR SELECT
  USING (has_support_access(auth.uid()));

CREATE POLICY "Support can manage all units"
  ON public.units FOR ALL
  USING (has_support_access(auth.uid()));

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_units_organization_id ON public.units(organization_id);
CREATE INDEX IF NOT EXISTS idx_unit_settings_unit_id ON public.unit_settings(unit_id);
CREATE INDEX IF NOT EXISTS idx_user_unit_roles_user_id ON public.user_unit_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_unit_roles_org_id ON public.user_unit_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_catalog_org_id ON public.services_catalog(organization_id);
CREATE INDEX IF NOT EXISTS idx_agenda_org_unit ON public.agenda(organization_id, unit_id);
CREATE INDEX IF NOT EXISTS idx_caixa_diario_org_unit ON public.caixa_diario(organization_id, unit_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_org_unit ON public.pacientes(organization_id, unit_id);