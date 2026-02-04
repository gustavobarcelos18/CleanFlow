import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { billingService } from '@/domain/billing/billingService';

interface BillingContextType {
    status: string | null;
    planCode: string | null;
    loading: boolean;
    refreshBilling: () => Promise<void>;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export function BillingProvider({ children }: { children: ReactNode }) {
    const { profile } = useAuth();
    const [status, setStatus] = useState<string | null>(null);
    const [planCode, setPlanCode] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchBilling = async () => {
        if (!profile?.tenant_id) {
            setLoading(false);
            return;
        }

        try {
            const overview = await billingService.carregarAssinaturaAtual(profile.tenant_id);
            const sub = overview.subscription;

            if (sub) {
                // Check if status changed from non-active to active to show toast
                if (status && status !== 'active' && sub.status === 'active') {
                    toast.success("Pagamento recebido! Sua assinatura está ativa.");
                }
                setStatus(sub.status);
                setPlanCode(sub.plan_id);
            } else {
                setStatus(null);
                setPlanCode(null);
            }
        } catch (error) {
            console.error('Error fetching billing:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBilling();

        if (!profile?.tenant_id) return;

        const channel = supabase
            .channel('billing-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'subscriptions', // Atualizado para nome em inglês
                    filter: `tenant_id=eq.${profile.tenant_id}`
                },
                (payload) => {
                    console.log('Billing update received:', payload);
                    const newData = payload.new as any;

                    if (status && status !== 'active' && newData.status === 'active') {
                        toast.success("Pagamento recebido! Sua assinatura está ativa.");
                    }

                    setStatus(newData.status);
                    setPlanCode(newData.plan_id);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.tenant_id]);

    return (
        <BillingContext.Provider value={{ status, planCode, loading, refreshBilling: fetchBilling }}>
            {children}
        </BillingContext.Provider>
    );
}

export function useBilling() {
    const context = useContext(BillingContext);
    if (context === undefined) {
        throw new Error('useBilling must be used within a BillingProvider');
    }
    return context;
}
