-- Create plugins_registry table
CREATE TABLE IF NOT EXISTS public.plugins_registry (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id), -- NULL para plugins globais/sistema
    nome text NOT NULL,
    descricao text,
    versao text DEFAULT '1.0.0',
    autor text,
    hooks text[] NOT NULL, -- ['onAppointmentCreated', 'onInvoicePaid', etc]
    config_json jsonb DEFAULT '{}'::jsonb,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plugins_registry ENABLE ROW LEVEL SECURITY;

-- Policies for plugins_registry
-- Admins podem ver plugins globais (tenant_id IS NULL) e seus próprios
CREATE POLICY "Admins can view plugins"
    ON public.plugins_registry FOR SELECT
    USING (
        tenant_id IS NULL OR 
        tenant_id IN (SELECT tenant_id FROM public.profile_users WHERE user_id = auth.uid())
    );

-- Admins podem gerenciar plugins do seu tenant
CREATE POLICY "Admins can manage tenant plugins"
    ON public.plugins_registry FOR ALL
    USING (
        tenant_id IN (SELECT tenant_id FROM public.profile_users WHERE user_id = auth.uid() AND role IN ('admin_tenant', 'org_admin'))
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plugins_tenant ON public.plugins_registry(tenant_id);
CREATE INDEX IF NOT EXISTS idx_plugins_hooks ON public.plugins_registry USING gin(hooks);
