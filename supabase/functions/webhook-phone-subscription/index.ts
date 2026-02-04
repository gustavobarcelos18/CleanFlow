import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WEBHOOK-PHONE-SUB] ${step}${detailsStr}`);
};

serve(async (req) => {
  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil" as any,
  });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    // Verificar assinatura do webhook (se configurado)
    const webhookSecret = Deno.env.get("STRIPE_PHONE_WEBHOOK_SECRET");
    let event: Stripe.Event;
    
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    logStep("Evento recebido", { type: event.type, id: event.id });

    const eventData = event.data.object as any;

    switch (event.type) {
      case 'checkout.session.completed': {
        // Pagamento confirmado - ativar assinatura
        if (eventData.metadata?.tipo === 'phone_number_subscription') {
          const internalSubscriptionId = eventData.metadata.internal_subscription_id;
          const stripeSubscriptionId = eventData.subscription;
          const tenantId = eventData.metadata.tenant_id;
          const packageId = eventData.metadata.package_id;

          logStep("Checkout completado", { internalSubscriptionId, stripeSubscriptionId });

          // Buscar subscription do Stripe para pegar datas
          const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
          
          // Atualizar assinatura interna
          const { error: updateError } = await supabase
            .from('phone_number_subscriptions')
            .update({
              status: 'active',
              stripe_subscription_id: stripeSubscriptionId,
              data_inicio: new Date(stripeSub.current_period_start * 1000).toISOString().split('T')[0],
              data_proximo_faturamento: new Date(stripeSub.current_period_end * 1000).toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            })
            .eq('id', internalSubscriptionId);

          if (updateError) {
            logStep("Erro ao atualizar subscription", { error: updateError });
          } else {
            logStep("Assinatura ativada com sucesso");

            // Buscar pacote para ver quantos números provisionar
            const { data: pkg } = await supabase
              .from('phone_number_packages')
              .select('quantidade_numeros')
              .eq('id', packageId)
              .single();

            // Iniciar provisionamento de número
            // Por enquanto, alocar número compartilhado ou criar placeholder
            const { data: sharedNumber } = await supabase
              .from('whatsapp_phone_numbers')
              .select('id')
              .eq('is_shared', true)
              .eq('status', 'active')
              .limit(1)
              .single();

            const departamentos = JSON.parse(eventData.metadata.departamentos || '["geral"]');
            
            for (let i = 0; i < (pkg?.quantidade_numeros || 1); i++) {
              const dept = departamentos[i] || 'geral';
              
              // Criar placeholder de alocação (número será provisionado pelo provedor depois)
              await supabase
                .from('tenant_phone_allocations')
                .insert({
                  tenant_id: tenantId,
                  phone_number_id: sharedNumber?.id, // Temporário até provisionar número exclusivo
                  subscription_id: internalSubscriptionId,
                  departamento: dept,
                  is_primary: i === 0,
                  status: 'provisioning',
                  metadata: { 
                    awaiting_provisioning: true,
                    provisioning_started_at: new Date().toISOString()
                  }
                });
            }

            logStep("Alocações criadas, aguardando provisionamento");

            // TODO: Chamar API do provedor para provisionar número
            // Isso seria feito de forma assíncrona via outra edge function ou job
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        // Pagamento de renovação bem-sucedido
        const subscriptionId = eventData.subscription;
        
        if (subscriptionId) {
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
          
          const { data: internalSub } = await supabase
            .from('phone_number_subscriptions')
            .select('id, tenant_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (internalSub) {
            await supabase
              .from('phone_number_subscriptions')
              .update({
                data_proximo_faturamento: new Date(stripeSub.current_period_end * 1000).toISOString().split('T')[0],
                notificacao_renovacao_enviada: false,
                updated_at: new Date().toISOString()
              })
              .eq('id', internalSub.id);

            logStep("Renovação processada", { subscription_id: internalSub.id });
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Falha no pagamento
        const subscriptionId = eventData.subscription;
        
        if (subscriptionId) {
          const { data: internalSub } = await supabase
            .from('phone_number_subscriptions')
            .select('id, tenant_id')
            .eq('stripe_subscription_id', subscriptionId)
            .single();

          if (internalSub) {
            // Criar alarme
            await supabase.from('whatsapp_alarms').insert({
              tenant_id: internalSub.tenant_id,
              alarm_type: 'payment_failed',
              severity: 'error',
              message: 'Falha no pagamento da assinatura do número WhatsApp',
              metadata: {
                subscription_id: internalSub.id,
                invoice_id: eventData.id
              }
            });

            logStep("Alarme de falha de pagamento criado");
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        // Assinatura cancelada (efetivação do cancelamento)
        const stripeSubId = eventData.id;
        
        const { data: internalSub } = await supabase
          .from('phone_number_subscriptions')
          .select('id, tenant_id')
          .eq('stripe_subscription_id', stripeSubId)
          .single();

        if (internalSub) {
          // Atualizar status para cancelado
          await supabase
            .from('phone_number_subscriptions')
            .update({
              status: 'cancelled',
              data_fim: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            })
            .eq('id', internalSub.id);

          // Desativar alocações de número
          await supabase
            .from('tenant_phone_allocations')
            .update({
              status: 'cancelled',
              cancelado_em: new Date().toISOString()
            })
            .eq('subscription_id', internalSub.id);

          // Registrar log
          await supabase.from('phone_subscription_cancellation_logs').insert({
            subscription_id: internalSub.id,
            tenant_id: internalSub.tenant_id,
            tipo: 'efetivacao',
            metadata: { stripe_event_id: event.id }
          });

          logStep("Cancelamento efetivado", { subscription_id: internalSub.id });
        }
        break;
      }

      default:
        logStep("Evento não tratado", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logStep("ERRO", { message: error instanceof Error ? error.message : 'Erro desconhecido' });
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
