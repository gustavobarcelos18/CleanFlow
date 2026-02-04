-- Create automations_flows table
CREATE TABLE IF NOT EXISTS public.automations_flows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) NOT NULL,
    nome text NOT NULL,
    descricao text,
    ativo boolean DEFAULT false,
    segmento text, -- e.g., 'saude', 'beleza', 'geral'
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create automations_nodes table
CREATE TABLE IF NOT EXISTS public.automations_nodes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    flow_id uuid REFERENCES public.automations_flows(id) ON DELETE CASCADE NOT NULL,
    tipo text NOT NULL, -- 'trigger', 'condition', 'action'
    config_json jsonb DEFAULT '{}'::jsonb,
    ordem integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Create automations_edges table
CREATE TABLE IF NOT EXISTS public.automations_edges (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    flow_id uuid REFERENCES public.automations_flows(id) ON DELETE CASCADE NOT NULL,
    from_node_id uuid REFERENCES public.automations_nodes(id) ON DELETE CASCADE NOT NULL,
    to_node_id uuid REFERENCES public.automations_nodes(id) ON DELETE CASCADE NOT NULL,
    condicao_json jsonb DEFAULT '{}'::jsonb, -- e.g., { "result": true } for branch
    created_at timestamp with time zone DEFAULT now()
);

-- Create automation_logs table for audit
CREATE TABLE IF NOT EXISTS public.automation_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid REFERENCES public.tenants(id) NOT NULL,
    flow_id uuid REFERENCES public.automations_flows(id) ON DELETE SET NULL,
    node_id uuid REFERENCES public.automations_nodes(id) ON DELETE SET NULL,
    event_type text NOT NULL,
    action_type text,
    status text NOT NULL, -- 'success', 'error', 'skipped'
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automations_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Policies for automations_flows
DROP POLICY IF EXISTS "Tenant admins can view flows" ON public.automations_flows;
CREATE POLICY "Tenant admins can view flows"
    ON public.automations_flows FOR SELECT
    USING (
        (auth.uid() IN (SELECT id FROM public.profiles WHERE tenant_id = automations_flows.tenant_id))
        OR 
        (EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true))
    );

DROP POLICY IF EXISTS "Tenant admins can manage flows" ON public.automations_flows;
CREATE POLICY "Tenant admins can manage flows"
    ON public.automations_flows FOR ALL
    USING (
        (auth.uid() IN (SELECT id FROM public.profiles WHERE tenant_id = automations_flows.tenant_id))
        OR 
        (EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true))
    );

-- Policies for automations_nodes
DROP POLICY IF EXISTS "Tenant admins can view nodes" ON public.automations_nodes;
CREATE POLICY "Tenant admins can view nodes"
    ON public.automations_nodes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.automations_flows 
        WHERE id = automations_nodes.flow_id 
        AND (
            (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
            OR 
            (EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true))
        )
    ));

DROP POLICY IF EXISTS "Tenant admins can manage nodes" ON public.automations_nodes;
CREATE POLICY "Tenant admins can manage nodes"
    ON public.automations_nodes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.automations_flows 
        WHERE id = automations_nodes.flow_id 
        AND (
            (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
            OR 
            (EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true))
        )
    ));

-- Policies for automations_edges
DROP POLICY IF EXISTS "Tenant admins can view edges" ON public.automations_edges;
CREATE POLICY "Tenant admins can view edges"
    ON public.automations_edges FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.automations_flows 
        WHERE id = automations_edges.flow_id 
        AND (
            (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
            OR 
            (EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true))
        )
    ));

DROP POLICY IF EXISTS "Tenant admins can manage edges" ON public.automations_edges;
CREATE POLICY "Tenant admins can manage edges"
    ON public.automations_edges FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.automations_flows 
        WHERE id = automations_edges.flow_id 
        AND (
            (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
            OR 
            (EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true))
        )
    ));

-- Policies for automation_logs
DROP POLICY IF EXISTS "Tenant admins can view logs" ON public.automation_logs;
CREATE POLICY "Tenant admins can view logs"
    ON public.automation_logs FOR SELECT
    USING (
        (auth.uid() IN (SELECT id FROM public.profiles WHERE tenant_id = automation_logs.tenant_id))
        OR 
        (EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true))
    );

DROP POLICY IF EXISTS "System can insert logs" ON public.automation_logs;
CREATE POLICY "System can insert logs"
    ON public.automation_logs FOR INSERT
    WITH CHECK (true);
