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
    const { agendamento_id, limite = 5 } = await req.json();

    logger.info('Gerando sugestões de remarcação', 'remarcacao', { agendamento_id });

    // Obter detalhes do agendamento
    const { data: agendamento, error: agendError } = await supabase
      .from('agenda')
      .select('*, servicos(*), paciente:pacientes(*)')
      .eq('id', agendamento_id)
      .single();

    if (agendError || !agendamento) {
      throw new Error('Agendamento não encontrado');
    }

    // Obter preferências do paciente
    const { data: preferencias } = await supabase
      .from('paciente_preferencias_horario' as any)
      .select('*')
      .eq('tenant_id', agendamento.tenant_id)
      .eq('paciente_id', agendamento.paciente_id)
      .single();

    // Gerar sugestões usando a function do banco
    const { data: sugestoesData, error: sugError } = await supabase.rpc(
      'gerar_sugestoes_remarcacao',
      {
        p_tenant_id: agendamento.tenant_id,
        p_agendamento_id: agendamento_id,
        p_limite: limite
      }
    );

    if (sugError) throw sugError;

    // Salvar as sugestões geradas
    const { data: remarcacao, error: remError } = await supabase
      .from('remarcacao_sugestoes' as any)
      .insert({
        tenant_id: agendamento.tenant_id,
        agendamento_original_id: agendamento_id,
        paciente_id: agendamento.paciente_id,
        sugestoes: sugestoesData,
        metodo_geracao: 'automatico'
      })
      .select()
      .single();

    if (remError) throw remError;

    // Enviar via WhatsApp
    if (agendamento.paciente?.telefone && sugestoesData && (sugestoesData as any[]).length > 0) {
      const sugestoesTexto = (sugestoesData as any[]).map((s: any, i: number) =>
        `${i + 1}. ${new Date(s.inicio).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`
      ).join('\n');

      await supabase.functions.invoke('enviar-whatsapp', {
        body: {
          to: agendamento.paciente.telefone,
          message: `Olá ${agendamento.paciente.nome}, temos algumas sugestões para remarcar sua consulta:\n\n${sugestoesTexto}\n\nResponda com o número da opção desejada.`,
          tipo: 'text',
          tenant_id: agendamento.tenant_id
        }
      });

      logger.info('Sugestões enviadas via WhatsApp', 'remarcacao', {
        remarcacao_id: remarcacao.id,
        total_sugestoes: (sugestoesData as any).length
      });
    } else {
      logger.info('Sugestões geradas mas não enviadas (sem telefone ou sem sugestões)', 'remarcacao', {
        remarcacao_id: remarcacao.id,
        total_sugestoes: (sugestoesData as any).length
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        remarcacao_id: remarcacao.id,
        sugestoes: sugestoesData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Erro ao gerar sugestões', 'remarcacao', { error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});