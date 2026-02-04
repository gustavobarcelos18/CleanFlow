import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Buscar todas as subscriptions ativas
    const { data: subscriptions, error: subError } = await supabaseClient
      .from("subscriptions")
      .select("*, plans!inner(slug, metadata)")
      .eq("status", "active");

    if (subError) throw subError;

    let totalResetado = 0;

    for (const subscription of subscriptions || []) {
      const plan = subscription.plans;
      const mensagensMensais = (plan.metadata as any)?.mensagens_mensais || 0;

      if (mensagensMensais > 0) {
        const tenant_id = subscription.tenant_id;

        // Buscar créditos atuais
        const { data: credits } = await supabaseClient
          .from("tenant_whatsapp_credits")
          .select("saldo_creditos, creditos_plano_mes_atual")
          .eq("tenant_id", tenant_id)
          .single();

        if (credits) {
          // Remover créditos do plano atual não utilizados
          const creditosNaoUtilizados = credits.creditos_plano_mes_atual || 0;
          const novoSaldo = credits.saldo_creditos - creditosNaoUtilizados + mensagensMensais;

          // Atualizar créditos
          await supabaseClient
            .from("tenant_whatsapp_credits")
            .update({
              saldo_creditos: novoSaldo,
              creditos_plano_mes_atual: mensagensMensais,
              updated_at: new Date().toISOString(),
            })
            .eq("tenant_id", tenant_id);

          // Registrar transação
          await supabaseClient
            .from("tenant_credit_transactions")
            .insert({
              tenant_id: tenant_id,
              tipo: "reset_mensal",
              quantidade: mensagensMensais,
              motivo: `Reset mensal do plano ${plan.slug}`,
              metadata: { 
                plan_id: plan.id,
                creditos_anteriores: creditosNaoUtilizados 
              },
            });

          totalResetado++;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalResetado,
        message: `${totalResetado} planos resetados`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
