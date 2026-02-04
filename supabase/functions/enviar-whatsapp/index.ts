import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EdgeLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = new EdgeLogger();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', userData.user.id)
      .single();

    if (!profile?.tenant_id) throw new Error('Tenant não encontrado');

    const payload = await req.json();
    const { to, template_name, template_params, tipo = 'template' } = payload;

    logger.info('Iniciando envio WhatsApp', 'whatsapp', {
      tenant_id: profile.tenant_id,
      to,
      tipo
    });

    // 0. Verificar Permissão do Plano
    const { data: activeSub } = await supabase
      .from('assinaturas')
      .select('codigo_plano')
      .eq('tenant_id', profile.tenant_id)
      .in('status', ['active', 'trialing', 'past_due'])
      .single();

    if (activeSub) {
      const { data: limits } = await supabase
        .from('planos_limites')
        .select('flags')
        .eq('codigo_plano', activeSub.codigo_plano)
        .single();

      if (limits?.flags?.whatsapp_automation === false) {
        logger.warn('Bloqueio de plano', 'whatsapp', { tenant_id: profile.tenant_id, plan: activeSub.codigo_plano });
        return new Response(
          JSON.stringify({
            sucesso: false,
            erro: 'Seu plano atual não inclui automação de WhatsApp.',
            codigo: 'PLAN_RESTRICTION_WHATSAPP'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
        );
      }
    }

    // 1. Verificar créditos disponíveis
    const { data: credits } = await supabase
      .from('tenant_whatsapp_credits')
      .select('saldo_creditos')
      .eq('tenant_id', profile.tenant_id)
      .single();

    if (!credits || credits.saldo_creditos < 1) {
      logger.warn('Créditos insuficientes', 'whatsapp', {
        tenant_id: profile.tenant_id,
        saldo: credits?.saldo_creditos || 0
      });

      return new Response(
        JSON.stringify({
          sucesso: false,
          erro: 'Créditos insuficientes',
          codigo: 'INSUFFICIENT_CREDITS',
          saldo_atual: credits?.saldo_creditos || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
      );
    }

    // 2. Obter configuração WhatsApp do tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('whatsapp_phone_number_id, whatsapp_business_account_id, whatsapp_configurado')
      .eq('id', profile.tenant_id)
      .single();

    if (!tenant?.whatsapp_configurado) {
      return new Response(
        JSON.stringify({
          sucesso: false,
          erro: 'WhatsApp não configurado',
          codigo: 'WHATSAPP_NOT_CONFIGURED'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // 3. Obter token do Clinflow (usa token único para todas requisições)
    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    if (!WHATSAPP_ACCESS_TOKEN) {
      throw new Error('Token WhatsApp do Clinflow não configurado');
    }

    // 4. Enviar mensagem via WhatsApp Business API
    const whatsappUrl = `https://graph.facebook.com/v18.0/${tenant.whatsapp_phone_number_id}/messages`;

    const messageBody = tipo === 'template' ? {
      messaging_product: "whatsapp",
      to: to,
      type: "template",
      template: {
        name: template_name,
        language: { code: "pt_BR" },
        components: template_params ? [
          {
            type: "body",
            parameters: template_params
          }
        ] : []
      }
    } : {
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: { body: template_params }
    };

    const whatsappResponse = await fetch(whatsappUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageBody)
    });

    const whatsappResult = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      logger.error('Erro ao enviar WhatsApp', 'whatsapp', {
        error: whatsappResult,
        status: whatsappResponse.status
      });

      // Salvar na DLQ
      await supabase.from('whatsapp_dlq').insert({
        tenant_id: profile.tenant_id,
        payload: messageBody,
        error_message: JSON.stringify(whatsappResult),
        retry_count: 0
      });

      return new Response(
        JSON.stringify({
          sucesso: false,
          erro: whatsappResult.error?.message || 'Erro ao enviar mensagem',
          codigo: 'WHATSAPP_API_ERROR'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // 5. Debitar crédito
    const { data: debitResult, error: debitError } = await supabase.rpc('debitar_credito_whatsapp', {
      p_tenant_id: profile.tenant_id,
      p_quantidade: 1,
      p_motivo: `Mensagem enviada para ${to}`,
      p_metadata: {
        whatsapp_message_id: whatsappResult.messages?.[0]?.id,
        to,
        tipo,
        template_name
      }
    });

    if (debitError) {
      logger.error('Erro ao debitar crédito', 'whatsapp', { error: debitError });
    }

    logger.info('Mensagem enviada com sucesso', 'whatsapp', {
      message_id: whatsappResult.messages?.[0]?.id,
      saldo_novo: debitResult?.saldo_novo
    });

    return new Response(
      JSON.stringify({
        sucesso: true,
        message_id: whatsappResult.messages?.[0]?.id,
        saldo_novo: debitResult?.saldo_novo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Erro no envio WhatsApp', 'whatsapp', { error: errorMessage });
    return new Response(
      JSON.stringify({ erro: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});