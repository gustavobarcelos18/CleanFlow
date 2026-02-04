-- Create user_2fa_settings table
CREATE TABLE IF NOT EXISTS public.user_2fa_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    enabled boolean DEFAULT false,
    method text CHECK (method IN ('totp', 'sms', 'email')),
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_2fa_settings_user_id_key UNIQUE (user_id)
);

-- Enable RLS for user_2fa_settings
ALTER TABLE public.user_2fa_settings ENABLE ROW LEVEL SECURITY;

-- Policies for user_2fa_settings
CREATE POLICY "Users can view their own 2FA settings"
    ON public.user_2fa_settings
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own 2FA settings"
    ON public.user_2fa_settings
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own 2FA settings"
    ON public.user_2fa_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create tenant_retention_settings table
CREATE TABLE IF NOT EXISTS public.tenant_retention_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) NOT NULL,
    retencao_logs_dias integer DEFAULT 365,
    retencao_mensagens_dias integer DEFAULT 730,
    retencao_dados_sensiveis_dias integer DEFAULT 1825,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT tenant_retention_settings_tenant_id_key UNIQUE (tenant_id)
);

-- Enable RLS for tenant_retention_settings
ALTER TABLE public.tenant_retention_settings ENABLE ROW LEVEL SECURITY;

-- Policies for tenant_retention_settings
CREATE POLICY "Tenant admins can view retention settings"
    ON public.tenant_retention_settings
    FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM public.profile_users WHERE tenant_id = tenant_retention_settings.tenant_id
    ));

CREATE POLICY "Tenant admins can update retention settings"
    ON public.tenant_retention_settings
    FOR UPDATE
    USING (auth.uid() IN (
        SELECT user_id FROM public.profile_users WHERE tenant_id = tenant_retention_settings.tenant_id
    ));

CREATE POLICY "Tenant admins can insert retention settings"
    ON public.tenant_retention_settings
    FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT user_id FROM public.profile_users WHERE tenant_id = tenant_retention_settings.tenant_id
    ));
