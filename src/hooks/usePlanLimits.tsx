import { useState, useEffect, useCallback } from 'react';
import { useBilling } from '@/hooks/useBilling';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ResourceType = 'clients' | 'professionals' | 'messages';

interface LimitCheckResult {
    allowed: boolean;
    limit: number;
    usage: number;
    message?: string;
}

export function usePlanLimits() {
    const { planCode } = useBilling();
    const [usage, setUsage] = useState({
        clients: 0,
        professionals: 0,
        messages: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchUsage = useCallback(async () => {
        try {
            const { count: clientCount } = await supabase.from('pacientes').select('*', { count: 'exact', head: true });
            const { count: profCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'profissional');

            // Mock message usage for now
            const messageCount = 120;

            setUsage({
                clients: clientCount || 0,
                professionals: profCount || 1, // At least 1 (the owner)
                messages: messageCount
            });
        } catch (error) {
            console.error("Error fetching usage:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsage();
    }, [fetchUsage]);

    const getLimits = useCallback(() => {
        // Default to permissive limits for unknown plans to avoid breaking legacy tenants
        let limits = { clients: Infinity, professionals: Infinity, messages: 0 };

        if (planCode === 'free_solo') {
            limits = { clients: 50, professionals: 1, messages: 0 };
        } else if (planCode === 'pro_solo') {
            limits = { clients: Infinity, professionals: 1, messages: 500 };
        } else if (planCode === 'clinic') {
            limits = { clients: Infinity, professionals: 5, messages: 2000 };
        } else if (planCode === 'multi_unit') {
            limits = { clients: Infinity, professionals: Infinity, messages: Infinity };
        }

        return limits;
    }, [planCode]);

    const checkLimit = useCallback((resource: ResourceType): LimitCheckResult => {
        const limits = getLimits();
        const limit = limits[resource];
        const currentUsage = usage[resource];

        if (limit === Infinity) {
            return { allowed: true, limit, usage: currentUsage };
        }

        if (currentUsage >= limit) {
            return {
                allowed: false,
                limit,
                usage: currentUsage,
                message: `Você atingiu o limite de ${resource === 'clients' ? 'clientes' : resource === 'professionals' ? 'profissionais' : 'mensagens'} do seu plano.`
            };
        }

        return { allowed: true, limit, usage: currentUsage };
    }, [getLimits, usage]);

    const checkLimitAndToast = useCallback((resource: ResourceType): boolean => {
        const result = checkLimit(resource);
        if (!result.allowed) {
            toast.error("Limite Atingido", {
                description: result.message,
                action: {
                    label: "Upgrade",
                    onClick: () => window.location.href = '/admin/planos'
                }
            });
            return false;
        }
        return true;
    }, [checkLimit]);

    return {
        checkLimit,
        checkLimitAndToast,
        usage,
        limits: getLimits(),
        loading,
        refreshUsage: fetchUsage
    };
}
