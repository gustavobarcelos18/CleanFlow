-- Permitir que usuários do sistema (admin/suporte) gerenciem automações de todos os tenants
-- Data: 2025-12-07
-- Descrição: Atualiza RLS para automations_flows, nodes e edges

-- 1. Políticas para automations_flows
DROP POLICY IF EXISTS "Tenant admins can view flows" ON public.automations_flows;
CREATE POLICY "Tenant admins can view flows"
    ON public.automations_flows FOR SELECT
    USING (
        auth.uid() IN (SELECT user_id FROM public.profile_users WHERE tenant_id = automations_flows.tenant_id)
        OR EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true)
    );

DROP POLICY IF EXISTS "Tenant admins can manage flows" ON public.automations_flows;
CREATE POLICY "Tenant admins can manage flows"
    ON public.automations_flows FOR ALL
    USING (
        auth.uid() IN (SELECT user_id FROM public.profile_users WHERE tenant_id = automations_flows.tenant_id)
        OR EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true)
    );

-- 2. Políticas para automations_nodes
DROP POLICY IF EXISTS "Tenant admins can view nodes" ON public.automations_nodes;
CREATE POLICY "Tenant admins can view nodes"
    ON public.automations_nodes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.automations_flows 
            WHERE id = automations_nodes.flow_id 
            AND (
                tenant_id IN (SELECT tenant_id FROM public.profile_users WHERE user_id = auth.uid())
                OR EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true)
            )
        )
    );

DROP POLICY IF EXISTS "Tenant admins can manage nodes" ON public.automations_nodes;
CREATE POLICY "Tenant admins can manage nodes"
    ON public.automations_nodes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.automations_flows 
            WHERE id = automations_nodes.flow_id 
            AND (
                tenant_id IN (SELECT tenant_id FROM public.profile_users WHERE user_id = auth.uid())
                OR EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true)
            )
        )
    );

-- 3. Políticas para automations_edges
DROP POLICY IF EXISTS "Tenant admins can view edges" ON public.automations_edges;
CREATE POLICY "Tenant admins can view edges"
    ON public.automations_edges FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.automations_flows 
            WHERE id = automations_edges.flow_id 
            AND (
                tenant_id IN (SELECT tenant_id FROM public.profile_users WHERE user_id = auth.uid())
                OR EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true)
            )
        )
    );

DROP POLICY IF EXISTS "Tenant admins can manage edges" ON public.automations_edges;
CREATE POLICY "Tenant admins can manage edges"
    ON public.automations_edges FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.automations_flows 
            WHERE id = automations_edges.flow_id 
            AND (
                tenant_id IN (SELECT tenant_id FROM public.profile_users WHERE user_id = auth.uid())
                OR EXISTS (SELECT 1 FROM public.system_users WHERE id = auth.uid() AND active = true)
            )
        )
    );
