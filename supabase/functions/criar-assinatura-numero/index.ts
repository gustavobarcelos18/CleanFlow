import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CRIAR-ASSINATURA-NUMERO] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Iniciando criação de assinatura");

    // Autenticar usuário
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseAnon.auth.getUser(token);
    const user = userData.user;
    if (!user?.email) throw new Error("Usuário não autenticado");
    logStep("Usuário autenticado", { email: user.email });

    const { package_id, departamentos } = await req.json();
    logStep("Dados recebidos", { package_id, departamentos });

    // Buscar profile e tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role, nome')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) throw new Error("Tenant não encontrado");
    if (profile.role !== 'admin') throw new Error("Apenas administradores podem contratar números");
    logStep("Profile validado", { tenant_id: profile.tenant_id });

    // Verificar se já tem assinatura ativa
    const { data: existingSubscription } = await supabase
      .from('phone_number_subscriptions')
      .select('id, status')
      .eq('tenant_id', profile.tenant_id)
      .in('status', ['active', 'pending', 'cancellation_scheduled'])
      .single();

    if (existingSubscription) {
      throw new Error("Já existe uma assinatura de número ativa. Cancele a atual antes de contratar outra.");
    }

    // Buscar pacote
    const { data: pkg } = await supabase
      .from('phone_number_packages')
      .select('*')
      .eq('id', package_id)
      .eq('ativo', true)
      .single();

    if (!pkg) throw new Error("Pacote não encontrado");
    logStep("Pacote encontrado", { nome: pkg.nome, preco: pkg.preco_mensal });

    // Buscar tenant para dados de faturamento
    const { data: tenant } = await supabase
      .from('tenants')
      .select('nome, email, cnpj')
      .eq('id', profile.tenant_id)
      .single();

    // Verificar plano do tenant (se necessário)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*, plan:plans(slug)')
      .eq('tenant_id', profile.tenant_id)
      .eq('status', 'active')
      .maybeSingle();

    const planSlug = (subscription?.plan as any)?.slug || 'free';
    if (pkg.planos_permitidos && pkg.planos_permitidos.length > 0 && !pkg.planos_permitidos.includes(planSlug)) {
      throw new Error(`Este pacote requer plano ${pkg.planos_permitidos.join(' ou ')}`);
    }

    // Criar checkout Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil" as any,
    });

    // Buscar ou criar customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data[0]?.id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: tenant?.nome || profile.nome,
        metadata: {
          tenant_id: profile.tenant_id,
          cnpj: tenant?.cnpj || ''
        }
      });
      customerId = customer.id;
      logStep("Cliente Stripe criado", { customerId });
    }

    // Criar price se não existir
    let priceId = pkg.stripe_price_id;
    if (!priceId) {
      const product = await stripe.products.create({
        name: `CleanFlow - ${pkg.nome}`,
        description: pkg.descricao || `${pkg.quantidade_numeros} número(s) WhatsApp exclusivo(s)`,
        metadata: { package_id: pkg.id }
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(pkg.preco_mensal * 100),
        currency: (pkg.moeda || 'BRL').toLowerCase(),
        recurring: { interval: 'month' },
      });

      priceId = price.id;
      logStep("Price Stripe criado", { priceId });

      // Atualizar pacote com price_id
      await supabase
        .from('phone_number_packages')
        .update({ stripe_price_id: priceId })
        .eq('id', package_id);
    }

    // Criar registro de assinatura pendente
    const { data: newSubscription, error: subError } = await supabase
      .from('phone_number_subscriptions')
      .insert({
        tenant_id: profile.tenant_id,
        package_id: package_id,
        stripe_customer_id: customerId,
        status: 'pending',
        valor_mensal: pkg.preco_mensal,
        valor_custo: pkg.custo_provedor,
        markup_percentual: pkg.markup_percentual || 30,
        moeda: pkg.moeda || 'BRL',
        numeros_contratados: pkg.quantidade_numeros,
        departamentos: departamentos || ['geral'],
        created_by: user.id
      })
      .select()
      .single();

    if (subError) {
      logStep("Erro ao criar subscription", { error: subError });
      throw new Error("Erro ao criar registro de assinatura");
    }
    logStep("Assinatura pendente criada", { subscription_id: newSubscription.id });

    // Criar checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      payment_method_types: ['card', 'boleto'],
      success_url: `${req.headers.get("origin")}/configuracoes-whatsapp?phone_success=true&subscription_id=${newSubscription.id}`,
      cancel_url: `${req.headers.get("origin")}/configuracoes-whatsapp?phone_cancelled=true`,
      metadata: {
        tenant_id: profile.tenant_id,
        package_id: package_id,
        internal_subscription_id: newSubscription.id,
        departamentos: JSON.stringify(departamentos || ['geral']),
        tipo: 'phone_number_subscription'
      },
      subscription_data: {
        metadata: {
          tenant_id: profile.tenant_id,
          package_id: package_id,
          internal_subscription_id: newSubscription.id
        }
      },
      locale: 'pt-BR',
      custom_text: {
        submit: {
          message: `Ao confirmar, você concorda que o cancelamento só será efetivado após ${pkg.periodo_minimo_dias || 30} dias, sem direito a reembolso proporcional.`
        }
      }
    });

    logStep("Checkout session criada", { session_id: session.id });

    return new Response(JSON.stringify({
      url: session.url,
      subscription_id: newSubscription.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logStep("ERRO", { message: error instanceof Error ? error.message : 'Erro desconhecido' });
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Erro interno'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
