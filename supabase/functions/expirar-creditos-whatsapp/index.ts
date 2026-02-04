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
    // Buscar transações expiradas (90 dias) que ainda não foram processadas
    const { data: expiradas, error: fetchError } = await supabaseClient
      .from("tenant_credit_transactions")
      .select("*, tenant_whatsapp_credits!inner(tenant_id, saldo_creditos)")
      .eq("tipo", "compra")
      .lt("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .is("expirado", false);

    if (fetchError) throw fetchError;

    let totalExpirado = 0;

    for (const transacao of expiradas || []) {
      const tenant_id = transacao.tenant_id;
      
      // Marcar transação como expirada
      await supabaseClient
        .from("tenant_credit_transactions")
        .update({ expirado: true })
        .eq("id", transacao.id);

      // Registrar transação de expiração
      await supabaseClient
        .from("tenant_credit_transactions")
        .insert({
          tenant_id: tenant_id,
          tipo: "expiracao",
          quantidade: transacao.quantidade,
          motivo: `Créditos expirados da transação ${transacao.id}`,
          metadata: { transacao_original: transacao.id },
        });

      totalExpirado++;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalExpirado,
        message: `${totalExpirado} transações expiradas processadas`
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
