import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetaReportData {
  tenant_id: string;
  period_start: string;
  period_end: string;
  total_messages: number;
  total_cost: number;
  breakdown: {
    conversation_type: string;
    count: number;
    cost: number;
  }[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verificar permissão master
    const { data: supportUser } = await supabaseAdmin
      .from('usuarios_suporte')
      .select('funcoes')
      .eq('auth_user_id', user.id)
      .single();

    if (!supportUser || !supportUser.funcoes.includes('master')) {
      throw new Error('Only master users can perform reconciliation');
    }

    const { meta_report } = await req.json() as { meta_report: MetaReportData };

    if (!meta_report) {
      throw new Error('Meta report data is required');
    }

    console.log(`Starting reconciliation for tenant ${meta_report.tenant_id}`);
    console.log(`Period: ${meta_report.period_start} to ${meta_report.period_end}`);

    // Buscar dados internos do período
    const { data: internalMessages, error: messagesError } = await supabaseAdmin
      .from('log_mensagens')
      .select('tipo, custo_unitario')
      .eq('tenant_id', meta_report.tenant_id)
      .gte('created_at', meta_report.period_start)
      .lte('created_at', meta_report.period_end)
      .eq('status', 'enviada');

    if (messagesError) {
      throw messagesError;
    }

    // Calcular totais internos
    const internalTotalMessages = internalMessages?.length || 0;
    const internalTotalCost = internalMessages?.reduce((sum, msg) => 
      sum + (parseFloat(msg.custo_unitario?.toString() || '0')), 0
    ) || 0;

    console.log(`Internal data: ${internalTotalMessages} messages, cost: ${internalTotalCost}`);
    console.log(`Meta data: ${meta_report.total_messages} messages, cost: ${meta_report.total_cost}`);

    // Criar registro de reconciliação
    const { data: reconciliation, error: reconciliationError } = await supabaseAdmin
      .from('whatsapp_reconciliation')
      .insert({
        tenant_id: meta_report.tenant_id,
        period_start: meta_report.period_start,
        period_end: meta_report.period_end,
        meta_report_data: meta_report,
        meta_total_messages: meta_report.total_messages,
        meta_total_cost: meta_report.total_cost,
        internal_total_messages: internalTotalMessages,
        internal_total_cost: internalTotalCost,
        status: 'pending',
      })
      .select()
      .single();

    if (reconciliationError) {
      throw reconciliationError;
    }

    const hasDivergence = reconciliation.has_divergence;

    if (hasDivergence) {
      console.log('Divergence detected!');
      console.log(`Message difference: ${reconciliation.message_difference}`);
      console.log(`Cost difference: ${reconciliation.cost_difference}`);

      // Criar evento de auditoria
      await supabaseAdmin
        .from('auditoria_admin')
        .insert({
          tipo_evento: 'reconciliation_divergence',
          descricao: `Divergência encontrada na reconciliação: ${Math.abs(reconciliation.message_difference)} mensagens, ${Math.abs(reconciliation.cost_difference).toFixed(2)} de diferença no custo`,
          metadata: {
            reconciliation_id: reconciliation.id,
            tenant_id: meta_report.tenant_id,
            period_start: meta_report.period_start,
            period_end: meta_report.period_end,
            message_difference: reconciliation.message_difference,
            cost_difference: reconciliation.cost_difference,
          },
        });

      // Criar alarme
      await supabaseAdmin.rpc('create_alarm', {
        p_tenant_id: meta_report.tenant_id,
        p_alarm_type: 'delivery_failure',
        p_threshold_value: 0,
        p_current_value: Math.abs(reconciliation.message_difference),
        p_message: `Divergência de ${Math.abs(reconciliation.message_difference)} mensagens encontrada na reconciliação`,
        p_severity: Math.abs(reconciliation.message_difference) > 100 ? 'critical' : 'warning',
        p_metadata: { reconciliation_id: reconciliation.id }
      });

      // Se a diferença for significativa, corrigir consumo_mensal
      if (Math.abs(reconciliation.cost_difference) > 10) {
        console.log('Applying correction to consumo_mensal...');

        const periodMonth = new Date(meta_report.period_start).toISOString().slice(0, 7) + '-01';

        await supabaseAdmin
          .from('consumo_mensal')
          .upsert({
            tenant_id: meta_report.tenant_id,
            mes_referencia: periodMonth,
            categoria: 'whatsapp',
            quantidade: meta_report.total_messages,
            preco_unitario: meta_report.total_cost / meta_report.total_messages,
            total: meta_report.total_cost,
          }, { onConflict: 'tenant_id,mes_referencia,categoria' });

        // Marcar como corrigido
        await supabaseAdmin
          .from('whatsapp_reconciliation')
          .update({ 
            correction_applied: true,
            notes: 'Correção aplicada automaticamente no consumo_mensal'
          })
          .eq('id', reconciliation.id);

        console.log('Correction applied successfully');
      }
    } else {
      console.log('No divergence found - data matches!');
    }

    return new Response(JSON.stringify({ 
      success: true,
      reconciliation: {
        id: reconciliation.id,
        has_divergence: hasDivergence,
        message_difference: reconciliation.message_difference,
        cost_difference: reconciliation.cost_difference,
        correction_applied: reconciliation.correction_applied,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error during reconciliation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
