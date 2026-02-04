import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    // Autenticar usuário
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData.user;
    if (!user?.email) throw new Error("Usuário não autenticado");

    const { package_id, departamentos } = await req.json();

    // Buscar profile e tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) throw new Error("Tenant não encontrado");
    if (profile.role !== 'admin') throw new Error("Apenas administradores podem contratar números");

    // Buscar pacote
    const { data: pkg } = await supabase
      .from('phone_number_packages')
      .select('*')
      .eq('id', package_id)
      .eq('ativo', true)
      .single();

    if (!pkg) throw new Error("Pacote não encontrado");

    // Verificar plano do tenant
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(slug)')
      .eq('tenant_id', profile.tenant_id)
      .eq('status', 'active')
      .single();

    const planSlug = (subscription?.plan as any)?.slug || 'free';
    if (!pkg.planos_permitidos.includes(planSlug)) {
      throw new Error(`Este pacote requer plano ${pkg.planos_permitidos.join(' ou ')}`);
    }

    // Criar checkout Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27" as any,
    });

    // Buscar ou criar customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data[0]?.id;

    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
    }

    // Criar price se não existir
    let priceId = pkg.stripe_price_id;
    if (!priceId) {
      const product = await stripe.products.create({
        name: `CleanFlow - ${pkg.nome}`,
        description: pkg.descricao || `${pkg.quantidade_numeros} número(s) WhatsApp exclusivo(s)`,
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(pkg.preco_mensal * 100),
        currency: pkg.moeda.toLowerCase(),
        recurring: { interval: 'month' },
      });

      priceId = price.id;

      // Atualizar pacote com price_id
      await supabase
        .from('phone_number_packages')
        .update({ stripe_price_id: priceId })
        .eq('id', package_id);
    }

    // Criar checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${req.headers.get("origin")}/configuracoes-whatsapp?phone_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/configuracoes-whatsapp?phone_cancelled=true`,
      metadata: {
        tenant_id: profile.tenant_id,
        package_id: package_id,
        departamentos: JSON.stringify(departamentos || ['geral']),
        tipo: 'phone_number_subscription'
      },
      subscription_data: {
        metadata: {
          tenant_id: profile.tenant_id,
          package_id: package_id,
        }
      }
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[PROVISION-PHONE] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erro interno'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
