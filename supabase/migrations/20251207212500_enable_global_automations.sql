-- Permitir automações globais (sem tenant_id)
-- Data: 2025-12-07
-- Descrição: Torna tenant_id opcional e adiciona flag is_global

-- 1. Alterar tabela automations_flows
ALTER TABLE public.automations_flows ALTER COLUMN tenant_id DROP NOT NULL;
ALTER TABLE public.automations_flows ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

-- 2. Atualizar RLS para permitir acesso a automações globais
DROP POLICY IF EXISTS "Tenant admins can view flows" ON public.automations_flows;
CREATE POLICY "Tenant admins can view flows"
    ON public.automations_flows FOR SELECT
    USING (
        (tenant_id IS NOT NULL AND auth.uid() IN (SELECT id FROM public.profiles WHERE tenant_id = automations_flows.tenant_id))
        OR 
        (is_global = true) -- Todos podem ver globais (ou restringir se necessário)
        OR
        (EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true)) -- Admins veem tudo
    );

-- Apenas admins do sistema podem gerenciar globais
DROP POLICY IF EXISTS "Tenant admins can manage flows" ON public.automations_flows;
CREATE POLICY "Tenant admins can manage flows"
    ON public.automations_flows FOR ALL
    USING (
        (tenant_id IS NOT NULL AND auth.uid() IN (SELECT id FROM public.profiles WHERE tenant_id = automations_flows.tenant_id))
        OR 
        (EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true))
    );

-- Atualizar policies dos nodes e edges para suportar fluxos globais (tenant_id do flow será null)
-- Nodes
DROP POLICY IF EXISTS "Tenant admins can view nodes" ON public.automations_nodes;
CREATE POLICY "Tenant admins can view nodes"
    ON public.automations_nodes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.automations_flows f
        WHERE f.id = automations_nodes.flow_id 
        AND (
            (f.tenant_id IS NOT NULL AND f.tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
            OR f.is_global = true
            OR EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true)
        )
    ));

DROP POLICY IF EXISTS "Tenant admins can manage nodes" ON public.automations_nodes;
CREATE POLICY "Tenant admins can manage nodes"
    ON public.automations_nodes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.automations_flows f
        WHERE f.id = automations_nodes.flow_id 
        AND (
            (f.tenant_id IS NOT NULL AND f.tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
            OR EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true)
        )
    ));

-- Edges
DROP POLICY IF EXISTS "Tenant admins can view edges" ON public.automations_edges;
CREATE POLICY "Tenant admins can view edges"
    ON public.automations_edges FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.automations_flows f
        WHERE f.id = automations_edges.flow_id 
        AND (
            (f.tenant_id IS NOT NULL AND f.tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
            OR f.is_global = true
            OR EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true)
        )
    ));

DROP POLICY IF EXISTS "Tenant admins can manage edges" ON public.automations_edges;
CREATE POLICY "Tenant admins can manage edges"
    ON public.automations_edges FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.automations_flows f
        WHERE f.id = automations_edges.flow_id 
        AND (
            (f.tenant_id IS NOT NULL AND f.tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
            OR EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true)
        )
    ));
