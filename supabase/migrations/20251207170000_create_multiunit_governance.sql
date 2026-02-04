-- Create org_settings table
CREATE TABLE IF NOT EXISTS public.org_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid REFERENCES public.organizations(id) NOT NULL UNIQUE,
    horarios_padrao jsonb DEFAULT '{}'::jsonb,
    politica_cancelamento jsonb DEFAULT '{}'::jsonb,
    templates_padrao jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create unit_settings table (overrides)
CREATE TABLE IF NOT EXISTS public.unit_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    unit_id uuid REFERENCES public.units(id) NOT NULL UNIQUE,
    override_horarios boolean DEFAULT false,
    horarios_customizados jsonb DEFAULT '{}'::jsonb,
    override_politica boolean DEFAULT false,
    politica_customizada jsonb DEFAULT '{}'::jsonb,
    override_templates boolean DEFAULT false,
    templates_customizados jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- View: view_org_analytics
-- Agrega métricas por unidade para a organização
CREATE OR REPLACE VIEW public.view_org_analytics AS
SELECT
    u.organization_id,
    u.id AS unit_id,
    u.nome AS unit_name,
    COUNT(DISTINCT a.id) AS total_agendamentos,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'nao_compareceu') AS total_no_show,
    (COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'nao_compareceu') * 100.0 / NULLIF(COUNT(DISTINCT a.id), 0))::numeric(5,2) AS taxa_no_show,
    -- Ocupação estimada (simplificada)
    (COUNT(DISTINCT a.id) * 100.0 / NULLIF(30 * 8 * COUNT(DISTINCT p.id), 0))::numeric(5,2) AS taxa_ocupacao_mensal_estimada
FROM
    public.units u
LEFT JOIN
    public.profiles p ON p.unidade_id = u.id
LEFT JOIN
    public.agenda a ON a.profissional_id = p.id AND a.inicio >= date_trunc('month', now())
GROUP BY
    1, 2, 3;

-- Enable RLS
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unit_settings ENABLE ROW LEVEL SECURITY;

-- Policies for org_settings
CREATE POLICY "Org admins can manage org settings"
    ON public.org_settings FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.profile_users 
            WHERE user_id = auth.uid() AND role IN ('org_admin', 'org_finance')
        )
    );

CREATE POLICY "Unit members can view org settings"
    ON public.org_settings FOR SELECT
    USING (
        organization_id IN (
            SELECT u.organization_id 
            FROM public.units u
            JOIN public.profile_users pu ON pu.unidade_id = u.id
            WHERE pu.user_id = auth.uid()
        )
    );

-- Policies for unit_settings
CREATE POLICY "Org admins and Unit admins can manage unit settings"
    ON public.unit_settings FOR ALL
    USING (
        unit_id IN (
            SELECT id FROM public.units WHERE organization_id IN (
                SELECT organization_id FROM public.profile_users WHERE user_id = auth.uid() AND role IN ('org_admin', 'org_finance')
            )
        )
        OR
        unit_id IN (
            SELECT unidade_id FROM public.profile_users WHERE user_id = auth.uid() AND role = 'unit_admin'
        )
    );

CREATE POLICY "Unit members can view unit settings"
    ON public.unit_settings FOR SELECT
    USING (
        unit_id IN (
            SELECT unidade_id FROM public.profile_users WHERE user_id = auth.uid()
        )
    );

-- Grant permissions on view
GRANT SELECT ON public.view_org_analytics TO authenticated;
