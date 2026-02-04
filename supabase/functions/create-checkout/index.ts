import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { EdgeLogger } from "../_shared/logger.ts";

// Validation schemas
const checkoutRequestSchema = z.object({
  priceId: z.string().startsWith("price_").max(100),
  billingCycle: z.enum(["monthly", "annual"]).optional(),
  planSlug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  quantity: z.number().min(1).optional().default(1)
});

const authHeaderSchema = z.string().startsWith("Bearer ").max(1000);

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = new EdgeLogger();
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    await logger.info("Checkout session requested", "checkout");

    // Validate request body
    const body = await req.json();
    const { priceId, billingCycle, planSlug, quantity } = checkoutRequestSchema.parse(body);

    await logger.info("Request data validated", "checkout", { priceId, billingCycle, planSlug, quantity });

    // Validate authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const validatedAuthHeader = authHeaderSchema.parse(authHeader);
    const token = validatedAuthHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    await logger.info("User authenticated", "checkout", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil" as any
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      await logger.info("Existing customer found", "checkout", { customerId });
    } else {
      await logger.info("No existing customer, will create on checkout", "checkout");
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: quantity,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/dashboard?subscription=success`,
      cancel_url: `${req.headers.get("origin")}/?subscription=canceled`,
      metadata: {
        user_id: user.id,
        plan_slug: planSlug,
        billing_cycle: billingCycle || 'monthly',
      },
    });

    await logger.info("Checkout session created", "checkout", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error("Checkout error", "checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
