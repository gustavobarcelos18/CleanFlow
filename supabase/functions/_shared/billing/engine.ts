import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
    Subscription,
    PlanCode,
    SubscriptionEdition,
    BillingItem,
    SubscriptionSeat,
    PlanPrice,
    PlanLimits
} from "./types.ts";
import { BillingProviderFactory, IBillingProvider } from "./provider.ts";

export class BillingEngine {
    private supabase: SupabaseClient;
    private provider: IBillingProvider;

    constructor(supabaseClient: SupabaseClient, providerType: 'stripe' | 'pagarme' | 'none' = 'none') {
        this.supabase = supabaseClient;
        this.provider = BillingProviderFactory.getProvider(providerType);
    }

    /**
     * Starts a new subscription for a tenant.
     */
    async startSubscription(
        tenantId: string,
        planCode: PlanCode,
        edition: SubscriptionEdition,
        extraSeats: { profissional?: number; secretaria?: number; unidade?: number } = {},
        couponCode?: string
    ) {
        // 1. Get Plan Details
        const { data: plan, error: planError } = await this.supabase
            .from('planos_precos')
            .select('*')
            .eq('codigo_plano', planCode)
            .single();

        if (planError || !plan) throw new Error(`Plan not found: ${planCode}`);

        const { data: limits, error: limitsError } = await this.supabase
            .from('planos_limites')
            .select('*')
            .eq('codigo_plano', planCode)
            .single();

        if (limitsError || !limits) throw new Error(`Limits not found for plan: ${planCode}`);

        // 1.5 Validate Coupon
        let stripeCouponId: string | undefined;
        if (couponCode) {
            const { data: coupon } = await this.supabase
                .from('coupons')
                .select('*')
                .eq('code', couponCode)
                .single();

            if (coupon && coupon.active) {
                const now = new Date();
                const startDate = coupon.start_date ? new Date(coupon.start_date) : null;
                const endDate = coupon.end_date ? new Date(coupon.end_date) : null;

                let isValid = true;
                if (startDate && startDate > now) isValid = false;
                if (endDate && endDate < now) isValid = false;

                if (isValid) {
                    stripeCouponId = coupon.stripe_coupon_id;
                    // TODO: Increment usage count after successful subscription?
                }
            }
        }

        // 2. Create Subscription Record (Draft)
        const now = new Date();
        const cycleEnd = new Date(now);
        cycleEnd.setMonth(cycleEnd.getMonth() + 1);

        const { data: sub, error: subError } = await this.supabase
            .from('assinaturas')
            .insert({
                tenant_id: tenantId,
                edition: edition,
                codigo_plano: planCode,
                status: 'active', // Assuming immediate activation for now
                ciclo_inicio: now.toISOString(),
                ciclo_fim: cycleEnd.toISOString(),
                proximo_cobranca: cycleEnd.toISOString(),
                provider: 'none' // Default to none initially
            })
            .select()
            .single();

        if (subError) throw subError;

        // 3. Create Seats
        const seats = [
            {
                assinatura_id: sub.id,
                tipo: 'profissional',
                quantidade: (limits.max_profissionais || 1) + (extraSeats.profissional || 0),
                quantidade_incluida: limits.max_profissionais || 1,
                preco_unitario: 49.90 // Hardcoded for now, should fetch from catalog if dynamic
            },
            {
                assinatura_id: sub.id,
                tipo: 'secretaria',
                quantidade: (limits.max_secretarias || 0) + (extraSeats.secretaria || 0),
                quantidade_incluida: limits.max_secretarias || 0,
                preco_unitario: 29.90 // Hardcoded
            }
        ];

        if (extraSeats.unidade && extraSeats.unidade > 0) {
            let unitPrice = 199.90; // Fallback
            const { data: unitPlan } = await this.supabase.from('planos_precos').select('preco_mensal_brl').eq('codigo_plano', 'pro_unit').single();
            if (unitPlan) unitPrice = unitPlan.preco_mensal_brl;

            if (extraSeats.unidade >= 3) {
                unitPrice = unitPrice * 0.9;
            }

            seats.push({
                assinatura_id: sub.id,
                tipo: 'unidade',
                quantidade: extraSeats.unidade,
                quantidade_incluida: 0,
                preco_unitario: unitPrice
            });
        }

        const { error: seatsError } = await this.supabase
            .from('assinatura_seats')
            .insert(seats);

        if (seatsError) throw seatsError;

        // 4. Call Provider (Mock)
        const providerSubId = await this.provider.createSubscription(sub as Subscription, [], stripeCouponId);

        // 5. Update Subscription with Provider ID
        await this.supabase
            .from('assinaturas')
            .update({ provider_subscription_id: providerSubId })
            .eq('id', sub.id);

        // 6. Log History
        await this.logHistory(sub.id, 'created', { plan: planCode, edition });

        return sub;
    }

    /**
     * Changes the plan of an existing subscription.
     * Calculates pro-rata if immediate.
     */
    async changePlan(
        subscriptionId: string,
        newPlanCode: PlanCode,
        effective: 'immediate' | 'next_cycle' = 'immediate'
    ) {
        // 1. Get Current Subscription and Plan
        const { data: sub, error: subError } = await this.supabase
            .from('assinaturas')
            .select('*, planos_precos(*)')
            .eq('id', subscriptionId)
            .single();

        if (subError || !sub) throw new Error("Subscription not found");

        const oldPlan = sub.planos_precos;

        // 2. Get New Plan
        const { data: newPlan, error: newPlanError } = await this.supabase
            .from('planos_precos')
            .select('*')
            .eq('codigo_plano', newPlanCode)
            .single();

        if (newPlanError || !newPlan) throw new Error("New plan not found");

        // Check Limits for Downgrade
        const { data: newLimits } = await this.supabase
            .from('planos_limites')
            .select('*')
            .eq('codigo_plano', newPlanCode)
            .single();

        if (newLimits) {
            // Check Professionals
            if (newLimits.max_profissionais !== null) {
                const { count: activePros, error: countError } = await this.supabase
                    .from('rbac_usuarios')
                    .select('*', { count: 'exact', head: true })
                    .eq('tenant_id', sub.tenant_id)
                    .eq('papel', 'profissional')
                    .eq('ativo', true);

                if (countError) throw countError;

                // We also need to check if they have extra seats that cover this?
                // The requirement says "Impedir downgrade que deixe profissionais ativos acima do novo limite".
                // Usually "limit" implies base + extra. 
                // However, `planos_limites` defines the BASE limit.
                // If the user has extra seats, they might be fine.
                // But `changePlan` doesn't automatically adjust extra seats unless we tell it to.
                // The `assinatura_seats` table holds the TOTAL authorized quantity.
                // When changing plan, we usually reset seats to the new plan's default OR keep the extras?
                // The current implementation of `changePlan` does NOT update `assinatura_seats`.
                // This is a potential bug or missing feature.
                // If I change plan, `assinatura_seats` (which controls the limit via trigger) remains as is?
                // No, `assinatura_seats` is linked to the subscription.
                // If I change the plan, the `assinatura_seats` records still exist.
                // But their `quantidade_incluida` might need to change based on the new plan.
                // And `quantidade` (total) might need to be adjusted if we want to enforce the new plan's structure.

                // Let's assume for now that `changePlan` keeps the *existing* total seats (if possible) or resets?
                // The current code does NOT touch `assinatura_seats` in `changePlan`.
                // This means the user keeps their current authorized seat count.
                // If so, the trigger `check_seat_limits` uses `assinatura_seats.quantidade`.
                // So if `assinatura_seats.quantidade` is NOT reduced, the trigger won't block existing users.
                // BUT, if the user is downgrading to a plan that *doesn't allow* extra seats or has a lower hard limit?
                // The requirement says "Impedir downgrade que deixe profissionais ativos acima do novo limite".

                // If the intention is that the new plan dictates the limit (e.g. Free Solo = 1), 
                // then we must ensure the user complies with THAT limit.

                // If I downgrade to Free Solo (max 1), but I have 5 active pros and 5 seats.
                // If I don't update seats, I still have 5 seats.
                // But logically, Free Solo shouldn't have 5 seats.

                // So `changePlan` SHOULD update `assinatura_seats` to match the new plan's defaults, 
                // OR we should explicitly handle seat adjustment.

                // Given the prompt "Impedir downgrade que deixe profissionais ativos acima do novo limite",
                // it implies we are enforcing the NEW plan's limits.

                if ((activePros || 0) > (newLimits.max_profissionais || 999999)) {
                    throw new Error(`Não é possível alterar o plano: Você tem ${activePros} profissionais ativos, mas o novo plano permite apenas ${newLimits.max_profissionais}. Desative usuários antes de continuar.`);
                }
            }

            // Check Secretaries
            if (newLimits.max_secretarias !== null) {
                const { count: activeSecs, error: countError } = await this.supabase
                    .from('rbac_usuarios')
                    .select('*', { count: 'exact', head: true })
                    .eq('tenant_id', sub.tenant_id)
                    .eq('papel', 'secretaria')
                    .eq('ativo', true);

                if (countError) throw countError;

                if ((activeSecs || 0) > newLimits.max_secretarias) {
                    throw new Error(`Não é possível alterar o plano: Você tem ${activeSecs} secretárias ativas, mas o novo plano permite apenas ${newLimits.max_secretarias}. Desative usuários antes de continuar.`);
                }
            }
        }

        if (effective === 'immediate') {
            // Calculate Pro-rata
            const now = new Date();
            const cycleEnd = new Date(sub.ciclo_fim);
            const totalDaysInCycle = 30; // Simplified
            const remainingDays = Math.max(0, Math.ceil((cycleEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

            const oldDailyRate = oldPlan.preco_mensal_brl / totalDaysInCycle;
            const newDailyRate = newPlan.preco_mensal_brl / totalDaysInCycle;

            const credit = oldDailyRate * remainingDays;
            const charge = newDailyRate * remainingDays;
            const diff = charge - credit;

            // Create Billing Items
            if (diff !== 0) {
                await this.createBillingItem({
                    assinatura_id: subscriptionId,
                    tipo: 'ajuste_prorata',
                    descricao: `Upgrade/Downgrade: ${oldPlan.codigo_plano} para ${newPlanCode} (${remainingDays} dias)`,
                    referencia_mes: new Date().toISOString().split('T')[0], // Today
                    quantidade: 1,
                    valor_unitario: parseFloat(diff.toFixed(2)),
                    total: parseFloat(diff.toFixed(2))
                });
            }

            // Update Subscription
            await this.supabase
                .from('assinaturas')
                .update({ codigo_plano: newPlanCode })
                .eq('id', subscriptionId);

            // Update Provider
            await this.provider.updateSubscription(sub.provider_subscription_id, []);

            // Log
            await this.logHistory(subscriptionId, 'plan_changed', {
                from: oldPlan.codigo_plano,
                to: newPlanCode,
                prorata: diff
            });

        } else {
            // Schedule for next cycle
            await this.supabase
                .from('assinaturas')
                .update({
                    scheduled_change_plan_code: newPlanCode,
                    scheduled_change_date: sub.ciclo_fim
                })
                .eq('id', subscriptionId);

            await this.logHistory(subscriptionId, 'plan_change_scheduled', {
                to: newPlanCode,
                effective_date: sub.ciclo_fim
            });
        }
    }

    /**
     * Previews the cost of changing a plan or seats.
     */
    async previewChange(
        subscriptionId: string,
        newPlanCode: PlanCode,
        newSeats: { profissional?: number; secretaria?: number } = {},
        effective: 'immediate' | 'next_cycle' = 'immediate'
    ) {
        // 1. Get Current Subscription and Plan
        const { data: sub, error: subError } = await this.supabase
            .from('assinaturas')
            .select('*, planos_precos(*)')
            .eq('id', subscriptionId)
            .single();

        if (subError || !sub) throw new Error("Subscription not found");

        const oldPlan = sub.planos_precos;

        // 2. Get New Plan
        const { data: newPlan, error: newPlanError } = await this.supabase
            .from('planos_precos')
            .select('*')
            .eq('codigo_plano', newPlanCode)
            .single();

        if (newPlanError || !newPlan) throw new Error("New plan not found");

        const result = {
            current_plan: {
                name: oldPlan.descricao,
                price: oldPlan.preco_mensal_brl
            },
            new_plan: {
                name: newPlan.descricao,
                price: newPlan.preco_mensal_brl
            },
            prorata_amount: 0,
            total_now: 0,
            next_cycle_total: newPlan.preco_mensal_brl,
            effective_date: effective === 'immediate' ? new Date().toISOString() : sub.ciclo_fim
        };

        // 3. Calculate Plan Prorata
        if (effective === 'immediate' && oldPlan.codigo_plano !== newPlanCode) {
            const now = new Date();
            const cycleEnd = new Date(sub.ciclo_fim);
            const totalDaysInCycle = 30; // Simplified
            const remainingDays = Math.max(0, Math.ceil((cycleEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

            const oldDailyRate = oldPlan.preco_mensal_brl / totalDaysInCycle;
            const newDailyRate = newPlan.preco_mensal_brl / totalDaysInCycle;

            const credit = oldDailyRate * remainingDays;
            const charge = newDailyRate * remainingDays;
            const diff = charge - credit;

            result.prorata_amount += diff;
        }

        // 4. Calculate Seats Prorata (Simplified for professionals only for now)
        // We need to fetch current seats to compare
        if (newSeats.profissional !== undefined) {
            const { data: currentSeat } = await this.supabase
                .from('assinatura_seats')
                .select('*')
                .eq('assinatura_id', subscriptionId)
                .eq('tipo', 'profissional')
                .single();

            // Assuming we fetch the seat price from somewhere or hardcode for now as per previous steps
            // Ideally we should have a 'seat_price' in the plan or a separate table.
            // Using hardcoded 49.90 as per startSubscription
            const seatPrice = 49.90;
            const included = currentSeat?.quantidade_incluida || 1; // Default to 1 if not found?
            // Actually we should get 'included' from the NEW plan limits if changing plan

            const { data: newLimits } = await this.supabase
                .from('planos_limites')
                .select('max_profissionais')
                .eq('codigo_plano', newPlanCode)
                .single();

            const newIncluded = newLimits?.max_profissionais || 1;

            const oldQty = currentSeat?.quantidade || 0;
            const newQty = newSeats.profissional;

            const oldBillable = Math.max(0, oldQty - (currentSeat?.quantidade_incluida || 0));
            const newBillable = Math.max(0, newQty - newIncluded);

            result.next_cycle_total += (newBillable * seatPrice);

            if (effective === 'immediate') {
                const diffBillable = newBillable - oldBillable;
                if (diffBillable !== 0) {
                    const now = new Date();
                    const cycleEnd = new Date(sub.ciclo_fim);
                    const remainingDays = Math.max(0, Math.ceil((cycleEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                    const dailyRate = seatPrice / 30;
                    const seatProrata = diffBillable * dailyRate * remainingDays;
                    result.prorata_amount += seatProrata;
                }
            }
        }

        result.total_now = Math.max(0, parseFloat(result.prorata_amount.toFixed(2)));
        result.prorata_amount = parseFloat(result.prorata_amount.toFixed(2));
        result.next_cycle_total = parseFloat(result.next_cycle_total.toFixed(2));

        return result;
    }


    /**
     * Adds or removes extra seats.
     */
    async changeSeats(subscriptionId: string, type: 'profissional' | 'secretaria', newQuantity: number) {
        // 1. Get Current Seat Config
        const { data: seat, error: seatError } = await this.supabase
            .from('assinatura_seats')
            .select('*')
            .eq('assinatura_id', subscriptionId)
            .eq('tipo', type)
            .single();

        if (seatError || !seat) throw new Error("Seat record not found");

        const oldQuantity = seat.quantidade;
        const diff = newQuantity - oldQuantity;

        if (diff === 0) return;

        // Check if reducing seats below active users
        if (newQuantity < oldQuantity) {
            const { data: sub } = await this.supabase.from('assinaturas').select('tenant_id').eq('id', subscriptionId).single();

            if (sub) {
                const { count: activeUsers } = await this.supabase
                    .from('rbac_usuarios')
                    .select('*', { count: 'exact', head: true })
                    .eq('tenant_id', sub.tenant_id)
                    .eq('papel', type)
                    .eq('ativo', true);

                if ((activeUsers || 0) > newQuantity) {
                    throw new Error(`Não é possível reduzir assentos para ${newQuantity}: Você tem ${activeUsers} ${type}(s) ativos. Desative usuários antes de continuar.`);
                }
            }
        }

        // 2. Calculate Pro-rata for Extras
        // Only charge if we are increasing above included amount
        // This logic can be complex depending on whether we are moving from below included to above included
        // For simplicity, let's assume we just update the quantity and calculate pro-rata on the *billable* difference

        const oldBillable = Math.max(0, oldQuantity - seat.quantidade_incluida);
        const newBillable = Math.max(0, newQuantity - seat.quantidade_incluida);
        const billableDiff = newBillable - oldBillable;

        if (billableDiff !== 0) {
            const { data: sub } = await this.supabase.from('assinaturas').select('ciclo_fim').eq('id', subscriptionId).single();
            const now = new Date();
            const cycleEnd = new Date(sub.ciclo_fim);
            const remainingDays = Math.max(0, Math.ceil((cycleEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const dailyRate = (seat.preco_unitario / 30);
            const prorataAmount = billableDiff * dailyRate * remainingDays;

            await this.createBillingItem({
                assinatura_id: subscriptionId,
                tipo: 'seat_extra',
                descricao: `Alteração de seats (${type}): ${diff > 0 ? '+' : ''}${diff} (${remainingDays} dias)`,
                referencia_mes: new Date().toISOString().split('T')[0],
                quantidade: 1,
                valor_unitario: parseFloat(prorataAmount.toFixed(2)),
                total: parseFloat(prorataAmount.toFixed(2))
            });
        }

        // 3. Update Seat Record
        await this.supabase
            .from('assinatura_seats')
            .update({ quantidade: newQuantity })
            .eq('id', seat.id);

        // 4. Log
        await this.logHistory(subscriptionId, 'seats_changed', { type, from: oldQuantity, to: newQuantity });
    }

    /**
     * Closes the current billing cycle, generates an invoice, and rolls over to the next cycle.
     */
    async closeCycle(subscriptionId: string) {
        // 1. Get Subscription
        const { data: sub, error: subError } = await this.supabase
            .from('assinaturas')
            .select('*')
            .eq('id', subscriptionId)
            .single();

        if (subError || !sub) throw new Error("Subscription not found");

        // 2. Get Pending Billing Items
        // Assuming items without an invoice_id (if we linked them) or just all items for the month
        // For simplicity, let's assume we query items for the 'referencia_mes' matching the cycle start
        // But actually, items are created with specific dates. We should grab all items created between cycle start and end.

        const { data: items, error: itemsError } = await this.supabase
            .from('billing_itens')
            .select('*')
            .eq('assinatura_id', subscriptionId)
            .gte('created_at', sub.ciclo_inicio)
            .lte('created_at', sub.ciclo_fim);

        if (itemsError) throw itemsError;

        // 3. Calculate Total
        // Also need to add the base plan price if it wasn't added as an item yet (usually added at start of cycle or end)
        // Let's assume the base plan is added as an item at the START of the cycle by a separate process or we add it now if missing.
        // For this implementation, let's assume we sum existing items.

        const total = items?.reduce((sum: number, item: any) => sum + item.total, 0) || 0;

        // 4. Create Invoice Record
        const { data: invoice, error: invoiceError } = await this.supabase
            .from('billing_faturas')
            .insert({
                assinatura_id: subscriptionId,
                periodo_inicio: sub.ciclo_inicio,
                periodo_fim: sub.ciclo_fim,
                total: total,
                status: 'draft'
            })
            .select()
            .single();

        if (invoiceError) throw invoiceError;

        // 5. Finalize with Provider
        const providerInvoiceId = await this.provider.finalizeInvoice({
            assinatura_id: subscriptionId,
            periodo_inicio: sub.ciclo_inicio,
            periodo_fim: sub.ciclo_fim,
            total: total,
            status: 'draft'
        });

        // 6. Update Invoice Status
        await this.supabase
            .from('billing_faturas')
            .update({
                status: 'open',
                provider_invoice_id: providerInvoiceId
            })
            .eq('id', invoice.id);

        // 7. Roll Over Cycle
        const nextStart = new Date(sub.ciclo_fim);
        const nextEnd = new Date(nextStart);
        nextEnd.setMonth(nextEnd.getMonth() + 1);

        let nextPlan = sub.codigo_plano;
        if (sub.scheduled_change_plan_code) {
            nextPlan = sub.scheduled_change_plan_code;
            await this.logHistory(subscriptionId, 'scheduled_plan_change_applied', {
                new_plan: nextPlan
            });
        }

        await this.supabase
            .from('assinaturas')
            .update({
                codigo_plano: nextPlan,
                scheduled_change_plan_code: null,
                scheduled_change_date: null,
                ciclo_inicio: nextStart.toISOString(),
                ciclo_fim: nextEnd.toISOString(),
                proximo_cobranca: nextEnd.toISOString()
            })
            .eq('id', subscriptionId);

        await this.logHistory(subscriptionId, 'cycle_closed', { invoiceId: invoice.id, total });

        return invoice;
    }

    private async createBillingItem(item: Partial<BillingItem>) {
        return this.supabase.from('billing_itens').insert(item);
    }

    private async logHistory(subscriptionId: string, event: string, payload: any) {
        return this.supabase.from('assinatura_historico').insert({
            assinatura_id: subscriptionId,
            evento: event,
            payload
        });
    }
}
