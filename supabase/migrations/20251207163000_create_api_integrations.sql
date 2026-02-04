-- Create api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) NOT NULL,
    nome text NOT NULL,
    chave_hash text NOT NULL, -- Armazenar hash (ex: sha256) da chave
    prefixo text NOT NULL, -- Para exibir na UI (ex: sk_live_1234...)
    ativo boolean DEFAULT true,
    last_used_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Create webhook_subscriptions table
CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) NOT NULL,
    url text NOT NULL,
    event_types text[] NOT NULL, -- ['appointment.created', 'invoice.paid', etc]
    segredo text NOT NULL, -- Para assinar payload (HMAC)
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create webhook_outbox table (Queue)
CREATE TABLE IF NOT EXISTS public.webhook_outbox (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    subscription_id uuid REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE NOT NULL,
    event_type text NOT NULL,
    payload jsonb NOT NULL,
    status text DEFAULT 'pending', -- pending, sending, sent, failed
    attempts integer DEFAULT 0,
    next_attempt_at timestamp with time zone DEFAULT now(),
    last_error text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_outbox ENABLE ROW LEVEL SECURITY;

-- Policies for api_keys
CREATE POLICY "Tenant admins can manage api keys"
    ON public.api_keys FOR ALL
    USING (auth.uid() IN (
        SELECT user_id FROM public.profile_users WHERE tenant_id = api_keys.tenant_id AND role IN ('admin_tenant', 'org_admin')
    ));

-- Policies for webhook_subscriptions
CREATE POLICY "Tenant admins can manage webhooks"
    ON public.webhook_subscriptions FOR ALL
    USING (auth.uid() IN (
        SELECT user_id FROM public.profile_users WHERE tenant_id = webhook_subscriptions.tenant_id AND role IN ('admin_tenant', 'org_admin')
    ));

-- Policies for webhook_outbox
CREATE POLICY "Tenant admins can view webhook logs"
    ON public.webhook_outbox FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.webhook_subscriptions 
        WHERE id = webhook_outbox.subscription_id 
        AND tenant_id IN (SELECT tenant_id FROM public.profile_users WHERE user_id = auth.uid())
    ));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant ON public.api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_tenant ON public.webhook_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_outbox_status ON public.webhook_outbox(status, next_attempt_at);
