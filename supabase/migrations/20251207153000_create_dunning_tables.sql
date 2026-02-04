-- Create dunning_configs table
CREATE TABLE IF NOT EXISTS public.dunning_configs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    dias_atraso integer NOT NULL,
    acao text NOT NULL,
    canal_notificacao text[] DEFAULT ARRAY['email'],
    template_mensagem text,
    ativo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create restricoes_tenant table
CREATE TABLE IF NOT EXISTS public.restricoes_tenant (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) NOT NULL,
    tipo_restricao text NOT NULL,
    motivo text,
    iniciado_em timestamp with time zone DEFAULT now(),
    ativo boolean DEFAULT true,
    removido_em timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create historico_dunning table
CREATE TABLE IF NOT EXISTS public.historico_dunning (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) NOT NULL,
    dias_atraso integer NOT NULL,
    acao_tomada text NOT NULL,
    canal text NOT NULL,
    sucesso boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Create support_actions_log table
CREATE TABLE IF NOT EXISTS public.support_actions_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    support_user_id uuid REFERENCES auth.users(id),
    action_type text NOT NULL,
    target_type text NOT NULL,
    target_id uuid,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dunning_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restricoes_tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_dunning ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_actions_log ENABLE ROW LEVEL SECURITY;

-- Policies for dunning_configs (Admins/Support can view and edit)
CREATE POLICY "Support can view dunning configs"
    ON public.dunning_configs FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND system_role IN ('master', 'support', 'financial')));

CREATE POLICY "Support can manage dunning configs"
    ON public.dunning_configs FOR ALL
    USING (EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND system_role IN ('master', 'support', 'financial')));

-- Policies for restricoes_tenant
CREATE POLICY "Support can view restrictions"
    ON public.restricoes_tenant FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND system_role IN ('master', 'support', 'financial')));

CREATE POLICY "Support can manage restrictions"
    ON public.restricoes_tenant FOR ALL
    USING (EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND system_role IN ('master', 'support', 'financial')));

-- Policies for historico_dunning
CREATE POLICY "Support can view dunning history"
    ON public.historico_dunning FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND system_role IN ('master', 'support', 'financial')));

-- Policies for support_actions_log
CREATE POLICY "Support can view action logs"
    ON public.support_actions_log FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND system_role IN ('master', 'support')));

CREATE POLICY "Support can insert action logs"
    ON public.support_actions_log FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND system_role IN ('master', 'support')));
