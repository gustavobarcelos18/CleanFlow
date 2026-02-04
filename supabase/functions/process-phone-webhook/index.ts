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

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27" as any,
  });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    // Em produção, verificar signature com webhook secret
    const event = JSON.parse(body);
    
    console.log(`[PHONE-WEBHOOK] Received event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      if (session.metadata?.tipo !== 'phone_number_subscription') {
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const tenantId = session.metadata.tenant_id;
      const packageId = session.metadata.package_id;
      const departamentos = JSON.parse(session.metadata.departamentos || '["geral"]');

      // Buscar pacote
      const { data: pkg } = await supabase
        .from('phone_number_packages')
        .select('*')
        .eq('id', packageId)
        .single();

      if (!pkg) throw new Error('Pacote não encontrado');

      // Provisionar números para cada departamento
      const { data: provider } = await supabase
        .from('whatsapp_providers')
        .select('*')
        .eq('nome', '360dialog')
        .single();

      for (let i = 0; i < pkg.quantidade_numeros; i++) {
        const departamento = departamentos[i] || `dept_${i + 1}`;
        
        // Criar número (em produção, chamar API do 360dialog)
        const phoneNumber = `+5511${Date.now().toString().slice(-9)}`;
        
        const { data: newPhone } = await supabase
          .from('whatsapp_phone_numbers')
          .insert({
            provider_id: provider?.id,
            phone_number: phoneNumber,
            display_name: `${departamento} - ${tenantId.slice(0, 8)}`,
            is_shared: false,
            status: 'pending',
            custo_mensal: provider?.custo_mensal_numero || 15,
            moeda: 'EUR'
          })
          .select()
          .single();

        if (newPhone) {
          // Criar alocação
          const { data: allocation } = await supabase
            .from('tenant_phone_allocations')
            .insert({
              tenant_id: tenantId,
              phone_number_id: newPhone.id,
              departamento,
              is_primary: i === 0
            })
            .select()
            .single();

          // Criar assinatura
          if (allocation) {
            await supabase.from('phone_number_subscriptions').insert({
              tenant_id: tenantId,
              allocation_id: allocation.id,
              preco_mensal: pkg.preco_mensal / pkg.quantidade_numeros,
              moeda: pkg.moeda,
              stripe_subscription_id: session.subscription,
              status: 'active',
              periodo_atual_inicio: new Date().toISOString(),
              periodo_atual_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            });

            // Criar departamento
            await supabase.from('tenant_whatsapp_departments').insert({
              tenant_id: tenantId,
              nome: departamento.charAt(0).toUpperCase() + departamento.slice(1),
              codigo: departamento,
              phone_allocation_id: allocation.id
            });
          }
        }
      }

      // Atualizar roteamento para não usar número compartilhado
      await supabase
        .from('tenant_whatsapp_routing')
        .upsert({
          tenant_id: tenantId,
          usa_numero_compartilhado: false,
          ai_routing_enabled: true
        }, { onConflict: 'tenant_id' });

      // Adicionar créditos inclusos
      if (pkg.inclui_creditos > 0) {
        const { data: credits } = await supabase
          .from('tenant_whatsapp_credits')
          .select('saldo_creditos')
          .eq('tenant_id', tenantId)
          .single();

        const saldoAtual = credits?.saldo_creditos || 0;

        await supabase.from('tenant_whatsapp_credits').upsert({
          tenant_id: tenantId,
          saldo_creditos: saldoAtual + pkg.inclui_creditos
        }, { onConflict: 'tenant_id' });

        await supabase.from('tenant_credit_transactions').insert({
          tenant_id: tenantId,
          tipo: 'bonus',
          quantidade: pkg.inclui_creditos,
          saldo_anterior: saldoAtual,
          saldo_novo: saldoAtual + pkg.inclui_creditos,
          motivo: `Créditos inclusos no pacote ${pkg.nome}`
        });
      }

      console.log(`[PHONE-WEBHOOK] Provisioned ${pkg.quantidade_numeros} numbers for tenant ${tenantId}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[PHONE-WEBHOOK] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro interno' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
