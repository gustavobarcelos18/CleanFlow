import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// CORS restrito ao domínio CleanFlow
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://clinflow.lovable.app",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Apenas POST permitido
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
    logStep("Webhook received");

    // Verificar se STRIPE_WEBHOOK_SECRET está configurado
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      logStep("ERROR: STRIPE_WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Obter signature do header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("ERROR: Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Obter body raw para verificação
    const body = await req.text();

    // Inicializar Stripe com apiVersion válida
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      logStep("ERROR: STRIPE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Stripe key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil" as any
    });

    // Verificar assinatura do webhook
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Signature verified", { eventId: event.id, type: event.type });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("ERROR: Signature verification failed", { error: errorMessage });
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${errorMessage}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Verificar idempotência - ignorar eventos já processados
    const { data: existingEvent } = await supabaseAdmin.rpc(
      'check_stripe_event_processed',
      { p_event_id: event.id }
    );

    if (existingEvent === true) {
      logStep("Event already processed, skipping", { eventId: event.id });
      return new Response(
        JSON.stringify({ received: true, status: "already_processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Processar evento baseado no tipo
    let processed = false;
    let processingDetails: any = {};

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Processing checkout.session.completed", { sessionId: session.id });

        const metadata = session.metadata || {};

        // Verificar se é compra de créditos WhatsApp
        if (metadata.tipo === "creditos_whatsapp" && metadata.tenant_id && metadata.package_id) {
          await processWhatsAppCredits(supabaseAdmin, session, metadata);
          processingDetails = { action: "whatsapp_credits", tenantId: metadata.tenant_id };
        }
        // Verificar se é assinatura de plano
        else if (metadata.plan_slug && metadata.user_id) {
          await processSubscription(supabaseAdmin, session, metadata);
          processingDetails = { action: "subscription", userId: metadata.user_id };
        }
        // Verificar se é assinatura de número de telefone
        else if (metadata.type === "phone_subscription" && metadata.tenant_id) {
          await processPhoneSubscription(supabaseAdmin, session, metadata);
          processingDetails = { action: "phone_subscription", tenantId: metadata.tenant_id };
        }

        processed = true;
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep(`Processing ${event.type}`, { subscriptionId: subscription.id });

        await updateSubscriptionStatus(supabaseAdmin, subscription);
        processingDetails = { action: "subscription_update", subscriptionId: subscription.id };
        processed = true;
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing invoice.payment_succeeded", { invoiceId: invoice.id });

        // Renovação de créditos mensais se aplicável
        if (invoice.subscription) {
          await handleInvoicePayment(supabaseAdmin, invoice);
          processingDetails = { action: "invoice_payment", invoiceId: invoice.id };
        }
        processed = true;
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Processing invoice.payment_failed", { invoiceId: invoice.id });

        await handlePaymentFailed(supabaseAdmin, invoice);
        processingDetails = { action: "payment_failed", invoiceId: invoice.id };
        processed = true;
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
        processed = false;
    }

    // Registrar evento como processado (idempotência)
    await supabaseAdmin.rpc('register_stripe_event', {
      p_event_id: event.id,
      p_event_type: event.type,
      p_payload: { processed, ...processingDetails }
    });

    logStep("Event processed and registered", { eventId: event.id, processed });

    return new Response(
      JSON.stringify({ received: true, processed, eventId: event.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in webhook", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// ============= Helper Functions =============

async function processWhatsAppCredits(
  supabase: any,
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  logStep("Processing WhatsApp credits", { tenantId: metadata.tenant_id, packageId: metadata.package_id });

  // Buscar pacote
  const { data: creditPackage, error: packageError } = await supabase
    .from("credit_packages")
    .select("quantidade_creditos, nome")
    .eq("id", metadata.package_id)
    .single();

  if (packageError || !creditPackage) {
    throw new Error("Credit package not found");
  }

  // Creditar usando função do banco
  const { data: result, error } = await supabase.rpc('creditar_whatsapp', {
    p_tenant_id: metadata.tenant_id,
    p_package_id: metadata.package_id,
    p_created_by: metadata.user_id || null
  });

  if (error) {
    throw new Error(`Failed to credit WhatsApp: ${error.message}`);
  }

  logStep("WhatsApp credits added", result);
}

async function processSubscription(
  supabase: any,
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  logStep("Processing subscription", { userId: metadata.user_id, planSlug: metadata.plan_slug });

  // Buscar plano
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("id")
    .eq("slug", metadata.plan_slug)
    .single();

  if (planError || !plan) {
    logStep("Plan not found, will be updated on check-subscription call");
    return;
  }

  // Buscar tenant do usuário
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", metadata.user_id)
    .single();

  if (!profile?.tenant_id) {
    logStep("Tenant not found for user");
    return;
  }

  // Criar/atualizar subscription
  await supabase
    .from("subscriptions")
    .upsert({
      tenant_id: profile.tenant_id,
      plan_id: plan.id,
      stripe_subscription_id: session.subscription as string,
      stripe_customer_id: session.customer as string,
      status: "active",
      billing_cycle: metadata.billing_cycle || "monthly",
    }, {
      onConflict: 'tenant_id'
    });

  logStep("Subscription created/updated in database");
}

async function processPhoneSubscription(
  supabase: any,
  session: Stripe.Checkout.Session,
  metadata: Record<string, string>
) {
  logStep("Processing phone subscription", { tenantId: metadata.tenant_id });

  await supabase
    .from("tenant_phone_subscriptions")
    .update({
      status: "active",
      stripe_subscription_id: session.subscription as string,
      stripe_customer_id: session.customer as string,
      updated_at: new Date().toISOString()
    })
    .eq("tenant_id", metadata.tenant_id)
    .eq("status", "pending");

  logStep("Phone subscription activated");
}

async function updateSubscriptionStatus(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const status = subscription.status === "active" ? "active" :
    subscription.status === "canceled" ? "canceled" : subscription.status;

  await supabase
    .from("subscriptions")
    .update({
      status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString()
    })
    .eq("stripe_subscription_id", subscription.id);

  logStep("Subscription status updated", { subscriptionId: subscription.id, status });
}

async function handleInvoicePayment(
  supabase: any,
  invoice: Stripe.Invoice
) {
  // Atualizar subscription como paga
  await supabase
    .from("subscriptions")
    .update({
      status: "active",
      updated_at: new Date().toISOString()
    })
    .eq("stripe_subscription_id", invoice.subscription as string);

  logStep("Invoice payment processed", { invoiceId: invoice.id });
}

async function handlePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice
) {
  // Marcar subscription como past_due
  await supabase
    .from("subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString()
    })
    .eq("stripe_subscription_id", invoice.subscription as string);

  // Criar alerta
  await supabase.rpc('log_system_event', {
    p_level: 'warning',
    p_message: `Payment failed for invoice ${invoice.id}`,
    p_service: 'stripe_webhook',
    p_metadata: { invoice_id: invoice.id, customer_id: invoice.customer }
  });

  logStep("Payment failure handled", { invoiceId: invoice.id });
}
