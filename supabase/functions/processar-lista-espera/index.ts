import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { EdgeLogger } from '../_shared/logger.ts';

interface CancelamentoPayload {
  agendamento_id: string;
  tenant_id: string;
  data_hora: string;
  servico_id?: string;
  profissional_id?: string;
  max_ofertas?: number;
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const logger = new EdgeLogger();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: CancelamentoPayload = await req.json();
    logger.info('Processando cancelamento para lista de espera', 'lista_espera', { payload });

    const { agendamento_id, tenant_id, data_hora, servico_id, profissional_id, max_ofertas = 5 } = payload;

    // Buscar pacientes elegíveis na lista de espera
    let query = supabase
      .from('lista_espera')
      .select('*, pacientes(nome, telefone, email)')
      .eq('tenant_id', tenant_id)
      .eq('status', 'ativo')
      .eq('consentimento_ofertas', true)
      .order('score_total', { ascending: false })
      .limit(max_ofertas);

    if (servico_id) {
      query = query.eq('servico_id', servico_id);
    }
    if (profissional_id) {
      query = query.eq('profissional_id', profissional_id);
    }

    const { data: pacientesEspera, error: errorEspera } = await query;

    if (errorEspera) {
      logger.error('Erro ao buscar pacientes na lista de espera', 'lista_espera', { error: errorEspera });
      throw errorEspera;
    }

    if (!pacientesEspera || pacientesEspera.length === 0) {
      logger.info('Nenhum paciente elegível na lista de espera', 'lista_espera');
      return new Response(
        JSON.stringify({ success: true, message: 'Nenhum paciente elegível' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar ofertas para cada paciente
    const ofertas = [];
    for (const paciente of pacientesEspera) {
      const oferta = {
        tenant_id,
        vaga_agendamento_id: agendamento_id,
        paciente_lista_espera_id: paciente.id,
        paciente_id: paciente.paciente_id,
        data_hora_oferecida: data_hora,
        status: 'pendente',
        expira_em: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutos
      };

      ofertas.push(oferta);
    }

    const { data: ofertasCriadas, error: errorOfertas } = await supabase
      .from('ofertas_vaga')
      .insert(ofertas)
      .select();

    if (errorOfertas) {
      logger.error('Erro ao criar ofertas', 'lista_espera', { error: errorOfertas });
      throw errorOfertas;
    }

    // Enviar mensagens WhatsApp para cada paciente
    for (let i = 0; i < pacientesEspera.length; i++) {
      const paciente = pacientesEspera[i];
      const oferta = ofertasCriadas![i];

      const dataFormatada = new Date(data_hora).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const mensagem = `🏥 *CleanFlow - Vaga Disponível!*\n\n` +
        `Olá! Uma vaga foi liberada para *${dataFormatada}*.\n\n` +
        `Você deseja adiantar sua consulta?\n\n` +
        `Responda:\n*1* - Sim, aceito\n*2* - Não, manter como está\n\n` +
        `⏰ Esta oferta expira em 15 minutos!`;

      // Enviar via WhatsApp
      await supabase.functions.invoke('enviar-whatsapp', {
        body: {
          to: paciente.pacientes?.telefone,
          message: mensagem,
          tipo: 'text',
          tenant_id: tenant_id
        }
      });

      logger.info('Mensagem WhatsApp enviada', 'lista_espera', {
        paciente_id: paciente.paciente_id,
        telefone: paciente.pacientes?.telefone,
        oferta_id: oferta.id
      });

      // Registrar consentimento e auditoria (LGPD)
      await supabase.rpc('log_system_event', {
        p_level: 'info',
        p_message: 'Oferta de vaga enviada via WhatsApp',
        p_service: 'lista_espera',
        p_tenant_id: tenant_id,
        p_metadata: {
          oferta_id: oferta.id,
          paciente_id: paciente.paciente_id,
          agendamento_id,
          consentimento_registrado: true
        }
      });
    }

    // Atualizar métricas
    const hoje = new Date().toISOString().split('T')[0];
    await supabase.rpc('log_system_event', {
      p_level: 'info',
      p_message: `${ofertas.length} ofertas enviadas`,
      p_service: 'lista_espera_metricas',
      p_tenant_id: tenant_id,
      p_metadata: { data: hoje, ofertas_enviadas: ofertas.length }
    });

    logger.info('Processamento concluído', 'lista_espera', {
      ofertas_criadas: ofertas.length
    });

    return new Response(
      JSON.stringify({
        success: true,
        ofertas_criadas: ofertas.length,
        pacientes: pacientesEspera.map(p => p.pacientes?.nome)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Erro ao processar lista de espera', 'lista_espera', { error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
