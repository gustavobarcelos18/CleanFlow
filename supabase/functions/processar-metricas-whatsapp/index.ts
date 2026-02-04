import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetricEvent {
  tenant_id: string;
  event_type: 'sent' | 'delivered' | 'read' | 'failed';
  error_category?: 'network' | 'template' | 'invalid_number' | 'blocked' | 'other';
  latency_ms?: number;
  quality_rating?: 'green' | 'yellow' | 'red';
  phone_number?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { events } = await req.json() as { events: MetricEvent[] };

    if (!events || !Array.isArray(events)) {
      throw new Error('Events array is required');
    }

    console.log(`Processing ${events.length} metric events`);

    // Agrupar eventos por tenant e período (hora)
    const metricsByTenantHour = new Map<string, any>();

    for (const event of events) {
      const hourKey = `${event.tenant_id}_${new Date().toISOString().slice(0, 13)}`;
      
      if (!metricsByTenantHour.has(hourKey)) {
        metricsByTenantHour.set(hourKey, {
          tenant_id: event.tenant_id,
          periodo: new Date(new Date().setMinutes(0, 0, 0)),
          mensagens_enviadas: 0,
          mensagens_entregues: 0,
          mensagens_lidas: 0,
          mensagens_falhadas: 0,
          erros_rede: 0,
          erros_template: 0,
          erros_numero_invalido: 0,
          erros_bloqueio: 0,
          erros_outros: 0,
          latencies: [] as number[],
          tps_count: 0,
          quality_rating: event.quality_rating || 'unknown',
        });
      }

      const metrics = metricsByTenantHour.get(hourKey);

      // Atualizar contadores
      if (event.event_type === 'sent') metrics.mensagens_enviadas++;
      if (event.event_type === 'delivered') metrics.mensagens_entregues++;
      if (event.event_type === 'read') metrics.mensagens_lidas++;
      if (event.event_type === 'failed') {
        metrics.mensagens_falhadas++;
        if (event.error_category === 'network') metrics.erros_rede++;
        if (event.error_category === 'template') metrics.erros_template++;
        if (event.error_category === 'invalid_number') metrics.erros_numero_invalido++;
        if (event.error_category === 'blocked') metrics.erros_bloqueio++;
        if (event.error_category === 'other') metrics.erros_outros++;
      }

      if (event.latency_ms) {
        metrics.latencies.push(event.latency_ms);
      }

      metrics.tps_count++;

      // Verificar rate limit se fornecido
      if (event.phone_number) {
        const { data: canSend } = await supabase.rpc('check_rate_limit', {
          p_tenant_id: event.tenant_id,
          p_phone_number: event.phone_number
        });

        if (!canSend) {
          console.log(`Rate limit exceeded for ${event.phone_number}`);
        }
      }
    }

    // Calcular e salvar métricas agregadas
    const results = [];
    for (const [_, metrics] of metricsByTenantHour) {
      // Calcular percentis de latência
      const sortedLatencies = metrics.latencies.sort((a: number, b: number) => a - b);
      const p50 = sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] || 0;
      const p95 = sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0;
      const p99 = sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] || 0;

      // Calcular TPS
      const tpsMedio = metrics.tps_count / 3600; // média por segundo na hora

      // Taxa de erro
      const totalMessages = metrics.mensagens_enviadas || 1;
      const errorRate = (metrics.mensagens_falhadas / totalMessages) * 100;

      // Inserir/atualizar métricas
      const { data, error } = await supabase
        .from('whatsapp_metrics')
        .upsert({
          tenant_id: metrics.tenant_id,
          periodo: metrics.periodo,
          mensagens_enviadas: metrics.mensagens_enviadas,
          mensagens_entregues: metrics.mensagens_entregues,
          mensagens_lidas: metrics.mensagens_lidas,
          mensagens_falhadas: metrics.mensagens_falhadas,
          erros_rede: metrics.erros_rede,
          erros_template: metrics.erros_template,
          erros_numero_invalido: metrics.erros_numero_invalido,
          erros_bloqueio: metrics.erros_bloqueio,
          erros_outros: metrics.erros_outros,
          latencia_p50: Math.round(p50),
          latencia_p95: Math.round(p95),
          latencia_p99: Math.round(p99),
          tps_medio: tpsMedio,
          quality_rating: metrics.quality_rating,
        }, { onConflict: 'tenant_id,periodo' });

      if (error) {
        console.error('Error saving metrics:', error);
        continue;
      }

      // Verificar alarmes
      if (errorRate > 2) {
        await supabase.rpc('create_alarm', {
          p_tenant_id: metrics.tenant_id,
          p_alarm_type: 'error_rate',
          p_threshold_value: 2,
          p_current_value: errorRate,
          p_message: `Taxa de erro está em ${errorRate.toFixed(2)}% (limite: 2%)`,
          p_severity: errorRate > 5 ? 'critical' : 'error',
          p_metadata: { periodo: metrics.periodo }
        });
      }

      if (metrics.erros_template > 0) {
        await supabase.rpc('create_alarm', {
          p_tenant_id: metrics.tenant_id,
          p_alarm_type: 'template_rejection',
          p_threshold_value: 0,
          p_current_value: metrics.erros_template,
          p_message: `${metrics.erros_template} templates foram rejeitados`,
          p_severity: 'error',
          p_metadata: { periodo: metrics.periodo }
        });
      }

      if (metrics.quality_rating === 'red' || metrics.quality_rating === 'yellow') {
        await supabase.rpc('create_alarm', {
          p_tenant_id: metrics.tenant_id,
          p_alarm_type: 'quality_rating',
          p_threshold_value: 0,
          p_current_value: 0,
          p_message: `Quality rating está ${metrics.quality_rating}`,
          p_severity: metrics.quality_rating === 'red' ? 'critical' : 'warning',
          p_metadata: { periodo: metrics.periodo }
        });
      }

      results.push(data);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: events.length,
      metrics_updated: results.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing metrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
