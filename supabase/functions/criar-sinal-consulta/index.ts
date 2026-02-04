import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EdgeLogger } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = new EdgeLogger();
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("Usuário não autenticado");

    const { agendamento_id, valor } = await req.json();

    logger.info('Criando sinal de consulta', 'payment', { agendamento_id, valor });

    // Buscar agendamento
    const { data: agendamento, error: agendError } = await supabaseClient
      .from('agenda')
      .select('*, pacientes(*)')
      .eq('id', agendamento_id)
      .single();

    if (agendError || !agendamento) throw new Error('Agendamento não encontrado');

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ 
      email: (agendamento.pacientes as any)?.email || user.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Criar sessão de pagamento
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : ((agendamento.pacientes as any)?.email || user.email),
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Sinal - Consulta ${new Date(agendamento.inicio).toLocaleString('pt-BR')}`,
              description: `Sinal para garantir sua consulta`,
            },
            unit_amount: Math.round(valor * 100), // Converter para centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/agenda?sinal_pago=true`,
      cancel_url: `${req.headers.get("origin")}/agenda?sinal_cancelado=true`,
      metadata: {
        agendamento_id,
        tenant_id: agendamento.tenant_id,
        tipo: 'sinal_consulta'
      }
    });

    // Salvar registro do sinal
    const { data: sinal, error: sinalError } = await supabaseClient
      .from('sinais_consulta' as any)
      .insert({
        tenant_id: agendamento.tenant_id,
        agendamento_id,
        paciente_id: agendamento.paciente_id,
        valor,
        metodo: 'cartao',
        status: 'pendente',
        stripe_checkout_session_id: session.id,
        link_pagamento: session.url,
        expira_em: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (sinalError) throw sinalError;

    logger.info('Sinal criado', 'payment', { sinal_id: sinal.id, session_id: session.id });

    return new Response(JSON.stringify({ url: session.url, sinal_id: sinal.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Erro ao criar sinal', 'payment', { error: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
