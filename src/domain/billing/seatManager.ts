import { supabase } from "@/integrations/supabase/client";
import { billingService } from "./billingService";

export const seatManager = {
    async recalcularSeats(tenantId: string): Promise<void> {
        // 1. Obter uso atual
        const overview = await billingService.carregarAssinaturaAtual(tenantId);

        // 2. Se houver mudança significativa que requer atualização no Stripe (ex: seats extras mudaram)
        // Chamamos uma edge function para sincronizar a quantidade no Stripe
        // A function 'billing-ops' com action 'sync_seats' parece apropriada.

        // Lógica de "debounce" ou verificação se mudou pode ser feita aqui ou na Edge Function.
        // Vou enviar sempre e deixar a Edge Function decidir se chama o Stripe ou não para evitar chamadas desnecessárias.

        const { error } = await supabase.functions.invoke('billing-ops', {
            body: {
                action: 'sync_seats',
                tenant_id: tenantId,
                active_users: overview.seatUsage.active_users,
                extra_seats: overview.seatUsage.extra_seats
            }
        });

        if (error) {
            console.error("Erro ao sincronizar seats:", error);
            // Não lançar erro para não bloquear o fluxo do usuário (ex: criação de profissional)
            // Mas logar erro crítico
        }
    },

    async onProfessionalCreated(tenantId: string) {
        await this.recalcularSeats(tenantId);
    },

    async onProfessionalDeleted(tenantId: string) {
        await this.recalcularSeats(tenantId);
    }
};
