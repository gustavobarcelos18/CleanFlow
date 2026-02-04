-- Create tenant_retention_settings table
CREATE TABLE IF NOT EXISTS public.tenant_retention_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE UNIQUE,
    retencao_logs_dias INTEGER DEFAULT 365,
    retencao_mensagens_dias INTEGER DEFAULT 730,
    retencao_dados_sensiveis_dias INTEGER DEFAULT 1825,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.tenant_retention_settings ENABLE ROW LEVEL SECURITY;

-- Policies for tenant_retention_settings
CREATE POLICY "Tenants can view their own retention settings" ON public.tenant_retention_settings
    FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE tenant_id = public.tenant_retention_settings.tenant_id
    ));

CREATE POLICY "Tenants can update their own retention settings" ON public.tenant_retention_settings
    FOR UPDATE
    USING (auth.uid() IN (
        SELECT id FROM public.profiles WHERE tenant_id = public.tenant_retention_settings.tenant_id
    ));

CREATE POLICY "Tenants can insert their own retention settings" ON public.tenant_retention_settings
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT id FROM public.profiles WHERE tenant_id = public.tenant_retention_settings.tenant_id
    ));

-- Ensure system_logs has RLS policy for tenants
DROP POLICY IF EXISTS "Tenants can view their own system logs" ON public.system_logs;
CREATE POLICY "Tenants can view their own system logs" ON public.system_logs
    FOR SELECT
    USING (
        tenant_id = (
            SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.tenant_retention_settings TO authenticated;
GRANT ALL ON public.tenant_retention_settings TO service_role;
