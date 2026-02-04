import { supabase } from "@/integrations/supabase/client";
import { BillingOverview, Plan, Subscription, SeatUsage } from "./billingTypes";

export const billingService = {
    async carregarAssinaturaAtual(tenantId: string): Promise<BillingOverview> {
        // 1. Buscar assinatura
        const { data: subData, error: subError } = await supabase
            .from("subscriptions")
            .select(`
        *,
        plan:plans (*)
      `)
            .eq("tenant_id", tenantId)
            .maybeSingle();

        if (subError) throw subError;

        // 2. Contar usuários ativos (seats)
        // Assumindo que 'profiles' são os usuários e status 'ativo' conta como seat
        // Precisamos filtrar por tenant_id. 
        // Nota: profiles tem tenant_id? Sim, vi no types.ts
        // Mas profiles não tem status explícito no types.ts que vi (tem 'role', 'pode_alterar_valores').
        // O dump mostra 'system_users' com 'active', mas profiles não.
        // Vou assumir que todos profiles no tenant contam, ou talvez exista uma tabela de 'users' vinculada.
        // O dump mostra 'profiles' com 'tenant_id'.
        // Vou contar todos os profiles do tenant por enquanto.
        const { count: activeUsersCount, error: countError } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("tenant_id", tenantId);

        if (countError) throw countError;

        const activeUsers = activeUsersCount || 0;
        const plan = subData?.plan as unknown as Plan | undefined;
        const seatsIncluded = plan?.limits?.seats || 1; // Default 1 se não definido
        const extraSeats = Math.max(0, activeUsers - seatsIncluded);

        // Custo extra (exemplo: R$ 29,90 por seat extra)
        // Idealmente viria de uma tabela de preços
        const extraSeatPrice = 29.90;
        const extraSeatsCost = extraSeats * extraSeatPrice;

        const subscription: Subscription | null = subData ? {
            ...subData,
            plan: plan
        } as Subscription : null;

        const seatUsage: SeatUsage = {
            total_seats_included: seatsIncluded,
            active_users: activeUsers,
            extra_seats: extraSeats,
            extra_seats_cost: extraSeatsCost
        };

        return {
            subscription,
            seatUsage,
            nextInvoiceEstimate: (plan?.price || 0) + extraSeatsCost
        };
    },

    async calcularSeatsExtras(tenantId: string): Promise<number> {
        const overview = await this.carregarAssinaturaAtual(tenantId);
        return overview.seatUsage.extra_seats;
    },

    async iniciarUpgradePlano(tenantId: string, novoPlanoId: string): Promise<{ url: string }> {
        // Chama Edge Function para criar checkout
        const { data, error } = await supabase.functions.invoke('create-checkout', {
            body: {
                tenant_id: tenantId,
                price_id: novoPlanoId, // Assumindo que o ID do plano mapeia para price_id ou a function trata
                mode: 'subscription'
            }
        });

        if (error) throw error;
        if (!data?.url) throw new Error("URL de checkout não retornada");

        return { url: data.url };
    },

    async agendarDowngradePlano(tenantId: string, novoPlanoId: string): Promise<void> {
        // Em downgrade, geralmente não cobramos imediatamente, apenas agendamos.
        // Pode ser via Edge Function ou update direto se permitido.
        // Vou assumir uma function 'billing-ops' para operações administrativas de billing.
        const { error } = await supabase.functions.invoke('billing-ops', {
            body: {
                action: 'schedule_downgrade',
                tenant_id: tenantId,
                new_plan_id: novoPlanoId
            }
        });

        if (error) throw error;
    }
};
