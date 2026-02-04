-- Function to get effective settings for a unit (merging org and unit settings)
CREATE OR REPLACE FUNCTION public.get_effective_unit_settings(target_unit_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_org_id uuid;
    v_org_settings public.org_settings%ROWTYPE;
    v_unit_settings public.unit_settings%ROWTYPE;
    v_result jsonb;
BEGIN
    -- Get organization_id for the unit
    SELECT organization_id INTO v_org_id FROM public.units WHERE id = target_unit_id;
    
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Unit not found';
    END IF;

    -- Get Org Settings
    SELECT * INTO v_org_settings FROM public.org_settings WHERE organization_id = v_org_id;
    
    -- Get Unit Settings
    SELECT * INTO v_unit_settings FROM public.unit_settings WHERE unit_id = target_unit_id;

    -- Initialize result
    v_result := '{}'::jsonb;

    -- Resolve Horarios
    IF v_unit_settings.override_horarios THEN
        v_result := jsonb_set(v_result, '{horarios}', COALESCE(v_unit_settings.horarios_customizados, '{}'::jsonb));
    ELSE
        v_result := jsonb_set(v_result, '{horarios}', COALESCE(v_org_settings.horarios_padrao, '{}'::jsonb));
    END IF;

    -- Resolve Politica Cancelamento
    IF v_unit_settings.override_politica THEN
        v_result := jsonb_set(v_result, '{politica_cancelamento}', COALESCE(v_unit_settings.politica_customizada, '{}'::jsonb));
    ELSE
        v_result := jsonb_set(v_result, '{politica_cancelamento}', COALESCE(v_org_settings.politica_cancelamento, '{}'::jsonb));
    END IF;

    -- Resolve Templates
    IF v_unit_settings.override_templates THEN
        v_result := jsonb_set(v_result, '{templates}', COALESCE(v_unit_settings.templates_customizados, '{}'::jsonb));
    ELSE
        v_result := jsonb_set(v_result, '{templates}', COALESCE(v_org_settings.templates_padrao, '{}'::jsonb));
    END IF;

    RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_effective_unit_settings(uuid) TO authenticated;
