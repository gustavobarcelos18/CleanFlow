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
    logger.info('Iniciando orquestração de lembretes', 'lembretes', {});

    // Buscar agendamentos que precisam de lembretes
    const horaAtual = new Date();
    const janelas = [72, 24, 1]; // horas antes do agendamento

    let totalEnviados = 0;

    for (const janela of janelas) {
      const dataAlvo = new Date(horaAtual.getTime() + janela * 60 * 60 * 1000);
      const dataMin = new Date(dataAlvo.getTime() - 30 * 60 * 1000); // -30min
      const dataMax = new Date(dataAlvo.getTime() + 30 * 60 * 1000); // +30min

      const { data: agendamentos, error: agendError } = await supabase
        .from('agenda')
        .select('*, servicos(*), pacientes(*), tenants(*)')
        .gte('inicio', dataMin.toISOString())
        .lte('inicio', dataMax.toISOString())
        .eq('status', 'agendado')
        .eq('confirmado', false);

      if (agendError || !agendamentos || agendamentos.length === 0) continue;

      logger.info(`Processando ${agendamentos.length} agendamentos para janela ${janela}h`, 'lembretes', {});

      for (const agendamento of agendamentos) {
        try {
          // Verificar se já foi enviado lembrete nesta janela
          const { data: jaEnviado } = await supabase
            .from('lembrete_historico' as any)
            .select('id')
            .eq('agendamento_id', agendamento.id)
            .eq('janela_horas', janela)
            .single();

          if (jaEnviado) continue;

          // Buscar configuração de lembretes para este tipo de serviço
          const tipoServico = (agendamento.servicos as any)?.tipo || 'geral';
          const { data: config } = await supabase
            .from('lembrete_configs' as any)
            .select('*')
            .eq('tenant_id', agendamento.tenant_id)
            .eq('tipo_servico', tipoServico)
            .single();

          // Buscar templates disponíveis para esta janela
          const { data: templates } = await supabase
            .from('lembrete_templates' as any)
            .select('*')
            .eq('tenant_id', agendamento.tenant_id)
            .eq('janela_horas', janela)
            .eq('ativo', true)
            .order('score', { ascending: false });

          if (!templates || templates.length === 0) continue;

          // A/B Testing: selecionar template randomicamente entre os top 2
          const templateSelecionado = config?.ab_testing_ativo && templates.length > 1
            ? templates[Math.floor(Math.random() * Math.min(2, templates.length))]
            : templates[0];

          // Preparar mensagem
          const mensagem = templateSelecionado.corpo_mensagem
            .replace('{{nome_paciente}}', (agendamento.pacientes as any)?.nome || 'Paciente')
            .replace('{{data}}', new Date(agendamento.inicio).toLocaleDateString('pt-BR'))
            .replace('{{hora}}', new Date(agendamento.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
            .replace('{{servico}}', (agendamento.servicos as any)?.nome || 'Consulta');

          // Enviar lembrete via WhatsApp
          const { error: sendError } = await supabase.functions.invoke('enviar-whatsapp', {
            body: {
              to: (agendamento.pacientes as any)?.telefone,
              template_name: 'lembrete_agendamento',
              template_params: [
                { type: "text", text: (agendamento.pacientes as any)?.nome || 'Paciente' },
                { type: "text", text: new Date(agendamento.inicio).toLocaleDateString('pt-BR') },
                { type: "text", text: new Date(agendamento.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
              ],
              tipo: 'template'
            }
          });

          if (!sendError) {
            // Registrar no histórico
            await supabase.from('lembrete_historico' as any).insert({
              tenant_id: agendamento.tenant_id,
              agendamento_id: agendamento.id,
              template_id: templateSelecionado.id,
              janela_horas: janela,
              variante: templateSelecionado.variante
            });

            // Atualizar contador do template
            await supabase.from('lembrete_templates' as any)
              .update({ total_envios: (templateSelecionado.total_envios || 0) + 1 })
              .eq('id', templateSelecionado.id);

            totalEnviados++;
          }

        } catch (agendError) {
          logger.error('Erro ao processar agendamento', 'lembretes', {
            agendamento_id: agendamento.id,
            error: agendError instanceof Error ? agendError.message : String(agendError)
          });
        }
      }
    }

    // Atualizar scores dos templates
    await supabase.rpc('atualizar_scores_templates');

    logger.info('Orquestração concluída', 'lembretes', { total_enviados: totalEnviados });

    return new Response(
      JSON.stringify({
        success: true,
        total_enviados: totalEnviados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Erro na orquestração de lembretes', 'lembretes', { error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});