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

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log("Iniciando verificação de créditos próximos de expirar...");

    // Buscar transações que expirarão em 7 dias
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + 7);

    const { data: transactions, error } = await supabaseAdmin
      .from("tenant_credit_transactions")
      .select(`
        *,
        tenant:tenants!tenant_credit_transactions_tenant_id_fkey(
          id,
          nome
        )
      `)
      .eq("tipo", "compra")
      .eq("expirado", false)
      .lte("data_expiracao", dataLimite.toISOString())
      .gte("data_expiracao", new Date().toISOString());

    if (error) {
      console.error("Erro ao buscar transações:", error);
      throw error;
    }

    console.log(`Encontradas ${transactions?.length || 0} transações próximas de expirar`);

    // Criar alarmes para cada tenant
    const alarmesCriados = [];
    
    for (const transaction of transactions || []) {
      const diasRestantes = Math.ceil(
        (new Date(transaction.data_expiracao).getTime() - new Date().getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      const { error: alarmError } = await supabaseAdmin
        .from("whatsapp_alarms")
        .insert({
          tenant_id: transaction.tenant_id,
          alarm_type: "credit_expiration",
          severity: "warning",
          message: `${transaction.quantidade} créditos WhatsApp expirarão em ${diasRestantes} dias`,
          threshold_value: 7,
          current_value: diasRestantes,
          metadata: {
            transaction_id: transaction.id,
            quantidade_creditos: transaction.quantidade,
            data_expiracao: transaction.data_expiracao,
          },
        });

      if (!alarmError) {
        alarmesCriados.push(transaction.id);
        console.log(`Alarme criado para tenant ${transaction.tenant_id}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transacoes_verificadas: transactions?.length || 0,
        alarmes_criados: alarmesCriados.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error) 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
