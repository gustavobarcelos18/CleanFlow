import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCELAR-ASSINATURA-NUMERO] ${step}${detailsStr}`);
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
    logStep("Iniciando cancelamento de assinatura");

    // Autenticar usuário
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseAnon.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("Usuário não autenticado");
    logStep("Usuário autenticado", { userId: user.id });

    const { subscription_id, motivo, confirma_termos } = await req.json();

    if (!confirma_termos) {
      throw new Error("Você deve confirmar que entende os termos de cancelamento");
    }

    // Buscar profile e tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.tenant_id) throw new Error("Tenant não encontrado");
    if (profile.role !== 'admin') throw new Error("Apenas administradores podem cancelar números");

    // Buscar assinatura
    const { data: subscription } = await supabase
      .from('phone_number_subscriptions')
      .select('*')
      .eq('id', subscription_id)
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (!subscription) {
      throw new Error("Assinatura não encontrada");
    }

    if (subscription.status === 'cancellation_scheduled') {
      throw new Error("Esta assinatura já está agendada para cancelamento");
    }

    if (subscription.status === 'cancelled' || subscription.status === 'expired') {
      throw new Error("Esta assinatura já foi cancelada");
    }

    logStep("Assinatura encontrada", { 
      subscription_id: subscription.id,
      status: subscription.status,
      stripe_subscription_id: subscription.stripe_subscription_id
    });

    // Calcular data de cancelamento efetivo
    const dataInicio = subscription.data_inicio ? new Date(subscription.data_inicio) : new Date();
    const proximoFaturamento = subscription.data_proximo_faturamento 
      ? new Date(subscription.data_proximo_faturamento) 
      : new Date(dataInicio.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const periodoMinimo = new Date(dataInicio.getTime() + 30 * 24 * 60 * 60 * 1000);
    const dataCancelamentoEfetivo = proximoFaturamento > periodoMinimo ? proximoFaturamento : periodoMinimo;
    
    logStep("Data de cancelamento calculada", { 
      dataCancelamentoEfetivo: dataCancelamentoEfetivo.toISOString() 
    });

    // Cancelar assinatura no Stripe (ao final do período)
    if (subscription.stripe_subscription_id) {
      const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
        apiVersion: "2025-08-27.basil" as any,
      });

      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        cancel_at_period_end: true,
        metadata: {
          cancellation_reason: motivo || 'Solicitado pelo cliente',
          cancelled_by: user.id,
          cancelled_at: new Date().toISOString()
        }
      });
      logStep("Assinatura Stripe marcada para cancelamento");
    }

    // Atualizar assinatura no banco
    const { error: updateError } = await supabase
      .from('phone_number_subscriptions')
      .update({
        status: 'cancellation_scheduled',
        data_cancelamento_solicitado: new Date().toISOString(),
        data_cancelamento_efetivo: dataCancelamentoEfetivo.toISOString().split('T')[0],
        aceite_termos_cancelamento: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription_id);

    if (updateError) {
      logStep("Erro ao atualizar assinatura", { error: updateError });
      throw new Error("Erro ao processar cancelamento");
    }

    // Registrar log de cancelamento
    await supabase
      .from('phone_subscription_cancellation_logs')
      .insert({
        subscription_id: subscription_id,
        tenant_id: profile.tenant_id,
        tipo: 'solicitacao',
        motivo: motivo,
        usuario_id: user.id,
        data_efetivacao_prevista: dataCancelamentoEfetivo.toISOString().split('T')[0],
        metadata: {
          valor_pago: subscription.valor_mensal,
          dias_restantes: Math.ceil((dataCancelamentoEfetivo.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
        }
      });

    logStep("Cancelamento processado com sucesso");

    const diasRestantes = Math.ceil((dataCancelamentoEfetivo.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

    return new Response(JSON.stringify({
      sucesso: true,
      data_cancelamento_efetivo: dataCancelamentoEfetivo.toISOString().split('T')[0],
      dias_restantes: diasRestantes,
      mensagem: `Cancelamento agendado. Seu número permanecerá ativo até ${dataCancelamentoEfetivo.toLocaleDateString('pt-BR')}. Você continuará tendo acesso completo durante este período.`
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
