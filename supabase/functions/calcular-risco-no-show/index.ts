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
    const { agendamento_id } = await req.json();

    logger.info('Calculando risco de no-show', 'risco', { agendamento_id });

    // Calcular score usando a função do banco
    const { data: score, error: scoreError } = await supabase.rpc(
      'calcular_risco_no_show',
      { p_agendamento_id: agendamento_id }
    );

    if (scoreError) throw scoreError;

    // Buscar agendamento
    const { data: agendamento } = await supabase
      .from('agenda')
      .select('*, pacientes(*), tenants(nome, cidade, uf)')
      .eq('id', agendamento_id)
      .single();

    if (!agendamento) throw new Error('Agendamento não encontrado');

    // Salvar score
    const { data: risco, error: riscoError } = await supabase
      .from('risco_no_show_scores' as any)
      .insert({
        tenant_id: agendamento.tenant_id,
        agendamento_id,
        paciente_id: agendamento.paciente_id,
        score,
        fatores: {
          historico_calculado: true,
          antecedencia_verificada: true
        }
      })
      .select()
      .single();

    if (riscoError) throw riscoError;

    // Ações baseadas no score
    const acoes = [];
    
    if (score > 70) {
      // Enviar lembrete extra
      acoes.push('lembrete_extra');
      
      await supabase.functions.invoke('enviar-whatsapp', {
        body: {
          to: (agendamento.pacientes as any)?.telefone,
          message: `🏥 Olá! Estamos esperando por você amanhã às ${new Date(agendamento.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}. 
          
✅ Confirme com 1 toque: responda SIM
          
Contamos com sua presença! 💙`,
          tipo: 'text'
        }
      });
    }

    if (score > 85) {
      // Oferecer rota/transporte
      acoes.push('oferta_rota');
      
      const endereco = (agendamento.pacientes as any)?.endereco || '';
      const tenant = (agendamento as any).tenants;
      const clinicaEndereco = tenant ? `${tenant.nome}, ${tenant.cidade} - ${tenant.uf}` : 'Clínica';
      
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(endereco)}&destination=${encodeURIComponent(clinicaEndereco)}`;
      
      await supabase.functions.invoke('enviar-whatsapp', {
        body: {
          to: (agendamento.pacientes as any)?.telefone,
          message: `🚗 Quer ajuda para chegar?

Clique aqui para ver a rota: ${googleMapsUrl}

Nos vemos em breve! 🏥`,
          tipo: 'text'
        }
      });
    }

    // Atualizar ações tomadas
    if (acoes.length > 0) {
      await supabase
        .from('risco_no_show_scores' as any)
        .update({ acoes_tomadas: acoes })
        .eq('id', risco.id);
    }

    logger.info('Score calculado', 'risco', { score, acoes });

    return new Response(
      JSON.stringify({ success: true, score, acoes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Erro ao calcular risco', 'risco', { error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
