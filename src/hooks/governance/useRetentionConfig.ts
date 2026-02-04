import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface RetentionConfig {
    id?: string;
    retencao_logs_dias: number;
    retencao_mensagens_dias: number;
    retencao_dados_sensiveis_dias: number;
}

export function useRetentionConfig() {
    const { profile } = useAuth();
    const [config, setConfig] = useState<RetentionConfig>({
        retencao_logs_dias: 365,
        retencao_mensagens_dias: 730,
        retencao_dados_sensiveis_dias: 1825
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile?.tenant_id) return;

        const fetchConfig = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('tenant_retention_settings')
                    .select('*')
                    .eq('tenant_id', profile.tenant_id)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    setConfig(data);
                }
            } catch (err) {
                console.error('Error fetching retention config:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, [profile?.tenant_id]);

    const updateConfig = async (newConfig: Partial<RetentionConfig>) => {
        if (!profile?.tenant_id) return;

        try {
            const { error: upsertError } = await supabase
                .from('tenant_retention_settings')
                .upsert({
                    tenant_id: profile.tenant_id,
                    ...config,
                    ...newConfig
                }, { onConflict: 'tenant_id' });

            error = upsertError;

            if (error) throw error;

            setConfig(prev => ({ ...prev, ...newConfig }));
            toast.success('Configurações de retenção atualizadas');
        } catch (err) {
            console.error('Error updating retention config:', err);
            toast.error('Erro ao atualizar configurações');
        }
    };

    return { config, loading, updateConfig };
}
