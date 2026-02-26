import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: any) => {
    const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
    console.log(`[BILLING-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 405,
        });
    }

    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
    );

    try {
        const signature = req.headers.get("stripe-signature");
        const body = await req.text();
        const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

        let event;
        const provider = 'stripe'; // Default to stripe for now

        // Signature Verification
        if (webhookSecret && stripeKey && signature) {
            const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" as any });
            try {
                event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
            } catch (err) {
                logStep("Signature verification failed", err);
                return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
            }
        } else {
            // Fallback for testing or other providers (if implemented)
            // WARNING: IN PRODUCTION, ALWAYS VERIFY SIGNATURE
            logStep("WARNING: Skipping signature verification (missing config)");
            event = JSON.parse(body);
        }

        // Idempotency Check
        const { data: isProcessed } = await supabaseAdmin.rpc('check_billing_event_processed', {
            p_event_id: event.id,
            p_provider: provider
        });

        if (isProcessed) {
            logStep("Event already processed", { id: event.id });
            return new Response(JSON.stringify({ received: true, status: 'already_processed' }), { headers: corsHeaders });
        }

        let processed = false;
        const details = {};

        logStep("Processing event", { type: event.type, id: event.id });

        switch (event.type) {
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                await handleSubscriptionEvent(supabaseAdmin, event.data.object, event.type);
                processed = true;
                break;

            case 'invoice.created':
            case 'invoice.payment_succeeded':
            case 'invoice.payment_failed':
            case 'invoice.voided':
            case 'invoice.marked_uncollectible':
                await handleInvoiceEvent(supabaseAdmin, event.data.object, event.type);
                processed = true;
                break;

            default:
                logStep("Unhandled event type", { type: event.type });
        }

        // Register Event
        await supabaseAdmin.rpc('register_billing_event', {
            p_event_id: event.id,
            p_provider: provider,
            p_event_type: event.type,
            p_payload: event,
            p_processed: processed,
            p_details: details
        });

        return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });

    } catch (error) {
        logStep("Error processing webhook", error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: corsHeaders });
    }
});

async function handleSubscriptionEvent(supabase: any, sub: any, type: string) {
    // Map Stripe status to our status
    // active, past_due, unpaid, canceled, incomplete, incomplete_expired, trialing
    const statusMap: Record<string, string> = {
        'active': 'active',
        'past_due': 'past_due',
        'unpaid': 'past_due',
        'canceled': 'canceled',
        'incomplete': 'incomplete', // or trialing?
        'incomplete_expired': 'canceled',
        'trialing': 'trialing'
    };

    const newStatus = statusMap[sub.status] || 'incomplete';

    // Find subscription by provider_subscription_id
    const { data: existingSub, error } = await supabase
        .from('assinaturas')
        .select('id, status')
        .eq('provider_subscription_id', sub.id)
        .single();

    if (error || !existingSub) {
        logStep("Subscription not found in DB", { providerId: sub.id });
        return;
    }

    if (existingSub.status !== newStatus) {
        await supabase
            .from('assinaturas')
            .update({
                status: newStatus,
                ciclo_inicio: new Date(sub.current_period_start * 1000).toISOString(),
                ciclo_fim: new Date(sub.current_period_end * 1000).toISOString(),
                proximo_cobranca: new Date(sub.current_period_end * 1000).toISOString(),
                atualizado_em: new Date().toISOString()
            })
            .eq('id', existingSub.id);

        await logHistory(supabase, existingSub.id, `subscription_${newStatus}`, {
            previous_status: existingSub.status,
            provider_status: sub.status
        });
    }
}

async function handleInvoiceEvent(supabase: any, invoice: any, type: string) {
    // Find subscription
    const { data: sub } = await supabase
        .from('assinaturas')
        .select('id, tenant_id')
        .eq('provider_subscription_id', invoice.subscription)
        .single();

    if (!sub) {
        logStep("Subscription not found for invoice", { invoiceId: invoice.id });
        return;
    }

    if (type === 'invoice.created') {
        // Create billing_fatura
        await supabase.from('billing_faturas').insert({
            assinatura_id: sub.id,
            provider_invoice_id: invoice.id,
            periodo_inicio: new Date(invoice.period_start * 1000).toISOString(),
            periodo_fim: new Date(invoice.period_end * 1000).toISOString(),
            total: invoice.total / 100, // Stripe uses cents
            status: 'open', // Draft in Stripe, but Open for us?
            criado_em: new Date().toISOString()
        });

        await logHistory(supabase, sub.id, 'invoice_created', { invoice_id: invoice.id, amount: invoice.total });
    } else {
        // Update status
        let status = 'open';
        if (type === 'invoice.payment_succeeded') status = 'paid';
        if (type === 'invoice.payment_failed') status = 'open'; // or past_due logic handled in subscription update
        if (type === 'invoice.voided') status = 'void';
        if (type === 'invoice.marked_uncollectible') status = 'uncollectible';

        await supabase
            .from('billing_faturas')
            .update({
                status: status,
                atualizado_em: new Date().toISOString()
            })
            .eq('provider_invoice_id', invoice.id);

        await logHistory(supabase, sub.id, `invoice_${status}`, { invoice_id: invoice.id });

        // If payment succeeded, ensure subscription is active (handled by subscription.updated usually, but good to double check)
        if (status === 'paid') {
            await supabase
                .from('assinaturas')
                .update({ status: 'active' })
                .eq('id', sub.id)
                .neq('status', 'active');
        }
    }
}

async function logHistory(supabase: any, assinaturaId: string, evento: string, payload: any) {
    await supabase.from('assinatura_historico').insert({
        assinatura_id: assinaturaId,
        evento: evento,
        payload: payload
    });
}
