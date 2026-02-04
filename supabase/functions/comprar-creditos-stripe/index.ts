import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { package_id } = await req.json();

    // Buscar informações do pacote
    const { data: creditPackage, error: packageError } = await supabaseClient
      .from("credit_packages")
      .select("*")
      .eq("id", package_id)
      .eq("ativo", true)
      .single();

    if (packageError || !creditPackage) {
      throw new Error("Pacote não encontrado");
    }

    // Mapeamento de pacotes para price IDs do Stripe
    const packagePriceMap: Record<number, string> = {
      1000: 'price_1SWExkGigRe8DsVJV2YT90gJ',
      2000: 'price_1SWF7wGigRe8DsVJgJrSygRt',
      3000: 'price_1SWF8xGigRe8DsVJnVjWSXqR',
      5000: 'price_1SWFBCGigRe8DsVJAh2K94Ga',
    };

    const priceId = packagePriceMap[creditPackage.quantidade_creditos];
    if (!priceId) {
      throw new Error("Price ID não encontrado para este pacote");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil" as any,
    });

    // Verificar se customer existe
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Obter tenant_id do usuário
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("tenant_id")
      .eq("id", user.id)
      .single();

    if (!profile?.tenant_id) {
      throw new Error("Tenant não encontrado");
    }

    // Criar checkout session com price ID do Stripe
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/configuracoes-whatsapp?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/configuracoes-whatsapp?payment=canceled`,
      metadata: {
        user_id: user.id,
        tenant_id: profile.tenant_id,
        package_id: package_id,
        tipo: "creditos_whatsapp",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
