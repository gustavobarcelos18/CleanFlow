
-- Tabela de políticas de autonomia por unidade
CREATE TABLE IF NOT EXISTS public.unit_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  
  -- Nível de autonomia geral
  autonomy_level TEXT NOT NULL DEFAULT 'limited' CHECK (autonomy_level IN ('full', 'limited', 'readonly')),
  
  -- Permissões de configuração
  can_edit_settings BOOLEAN DEFAULT false,
  can_edit_services BOOLEAN DEFAULT false,
  can_edit_prices BOOLEAN DEFAULT false,
  can_edit_schedules BOOLEAN DEFAULT false,
  can_edit_messaging BOOLEAN DEFAULT false,
  can_edit_payment_methods BOOLEAN DEFAULT false,
  
  -- Permissões de dados
  can_create_patients BOOLEAN DEFAULT true,
  can_edit_patients BOOLEAN DEFAULT true,
  can_delete_patients BOOLEAN DEFAULT false,
  can_create_appointments BOOLEAN DEFAULT true,
  can_edit_appointments BOOLEAN DEFAULT true,
  can_delete_appointments BOOLEAN DEFAULT false,
  can_create_professionals BOOLEAN DEFAULT false,
  can_edit_professionals BOOLEAN DEFAULT false,
  can_delete_professionals BOOLEAN DEFAULT false,
  
  -- Permissões financeiras
  can_view_financials BOOLEAN DEFAULT true,
  can_create_transactions BOOLEAN DEFAULT true,
  can_edit_transactions BOOLEAN DEFAULT false,
  can_close_cash_register BOOLEAN DEFAULT true,
  can_view_reports BOOLEAN DEFAULT true,
  can_export_data BOOLEAN DEFAULT false,
  
  -- Permissões de comunicação
  can_send_messages BOOLEAN DEFAULT true,
  can_edit_templates BOOLEAN DEFAULT false,
  can_view_all_conversations BOOLEAN DEFAULT true,
  
  -- Herança de configurações
  inherit_services BOOLEAN DEFAULT true,
  inherit_prices BOOLEAN DEFAULT true,
  inherit_schedules BOOLEAN DEFAULT true,
  inherit_messaging BOOLEAN DEFAULT true,
  inherit_payment_methods BOOLEAN DEFAULT true,
  
  -- Notas do gestor
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(organization_id, unit_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_unit_policies_org ON public.unit_policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_unit_policies_unit ON public.unit_policies(unit_id);

-- Trigger para updated_at
CREATE TRIGGER update_unit_policies_updated_at
  BEFORE UPDATE ON public.unit_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.unit_policies ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Org admins can manage unit policies" ON public.unit_policies
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_unit_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = unit_policies.organization_id
        AND ur.role = 'org_admin'
    )
  );

CREATE POLICY "Unit admins can view their unit policies" ON public.unit_policies
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_unit_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.unit_id = unit_policies.unit_id
        AND ur.role IN ('unit_admin', 'unit_finance')
    )
  );

-- Tabela de log de ações do gestor
CREATE TABLE IF NOT EXISTS public.organization_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para audit log
CREATE INDEX IF NOT EXISTS idx_org_audit_log_org ON public.organization_audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_audit_log_created ON public.organization_audit_log(created_at DESC);

-- RLS para audit log
ALTER TABLE public.organization_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins can view audit logs" ON public.organization_audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_unit_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.organization_id = organization_audit_log.organization_id
        AND ur.role = 'org_admin'
    )
  );

-- Função para criar políticas padrão ao criar unidade
CREATE OR REPLACE FUNCTION public.create_default_unit_policy()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.unit_policies (organization_id, unit_id, autonomy_level)
  VALUES (NEW.organization_id, NEW.id, 'limited');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER create_unit_policy_on_insert
  AFTER INSERT ON public.units
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_unit_policy();
