import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Validation schema for Authorization header
const authHeaderSchema = z.string().startsWith("Bearer ").max(1000);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    // Validate authorization header format
    const validatedAuthHeader = authHeaderSchema.parse(authHeader);
    const token = validatedAuthHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" as any });
    
    // Get Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan_slug: null,
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription found");
      return new Response(JSON.stringify({ 
        subscribed: false,
        plan_slug: null,
        subscription_end: null 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    const stripeProductId = subscription.items.data[0].price.product as string;
    const stripePriceId = subscription.items.data[0].price.id;
    
    logStep("Active subscription found", { 
      subscriptionId: subscription.id, 
      productId: stripeProductId,
      priceId: stripePriceId,
      endDate: subscriptionEnd 
    });

    // Get plan from database by stripe product ID
    const { data: plan, error: planError } = await supabaseClient
      .from('plans')
      .select('id, slug, name')
      .eq('stripe_product_id', stripeProductId)
      .single();

    if (planError) {
      logStep("Error finding plan", { error: planError });
    }

    // Update subscription in database
    if (plan) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (profile?.tenant_id) {
        await supabaseClient
          .from('subscriptions')
          .upsert({
            tenant_id: profile.tenant_id,
            plan_id: plan.id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: customerId,
            status: subscription.status,
            billing_cycle: subscription.items.data[0].price.recurring?.interval || 'month',
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: subscriptionEnd,
            cancel_at_period_end: subscription.cancel_at_period_end,
          }, {
            onConflict: 'tenant_id'
          });
        
        logStep("Subscription updated in database");
      }
    }

    return new Response(JSON.stringify({
      subscribed: true,
      plan_slug: plan?.slug || null,
      plan_name: plan?.name || null,
      subscription_end: subscriptionEnd,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
