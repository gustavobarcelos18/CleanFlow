import { supabase } from "@/integrations/supabase/client";

export const settingsService = {
    async getEffectiveSettings(unitId: string, organizationId: string) {
        // 1. Buscar configurações da organização
        const { data: orgSettings } = await supabase
            .from('org_settings')
            .select('*')
            .eq('organization_id', organizationId)
            .single();

        // 2. Buscar configurações da unidade (se houver)
        const { data: unitSettings } = await supabase
            .from('unit_settings')
            .select('*')
            .eq('unit_id', unitId)
            .single();

        // 3. Merge (Unidade sobrescreve Org se override for true)
        const effectiveSettings = {
            horarios: unitSettings?.override_horarios ? unitSettings.horarios_customizados : orgSettings?.horarios_padrao,
            politica: unitSettings?.override_politica ? unitSettings.politica_customizada : orgSettings?.politica_cancelamento,
            templates: unitSettings?.override_templates ? unitSettings.templates_customizados : orgSettings?.templates_padrao
        };

        return effectiveSettings;
    }
};
