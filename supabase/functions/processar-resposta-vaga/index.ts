import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { EdgeLogger } from '../_shared/logger.ts';

interface RespostaPayload {
  oferta_id: string;
  resposta: '1' | '2';
  paciente_id: string;
  tenant_id: string;
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

    const payload: RespostaPayload = await req.json();
    logger.info('Processando resposta de oferta', 'lista_espera', { payload });

    const { oferta_id, resposta, paciente_id, tenant_id } = payload;

    // Buscar oferta
    const { data: oferta, error: errorOferta } = await supabase
      .from('ofertas_vaga')
      .select('*, lista_espera(*), pacientes(nome, telefone)')
      .eq('id', oferta_id)
      .single();

    if (errorOferta || !oferta) {
      logger.error('Oferta não encontrada', 'lista_espera', { oferta_id });
      throw new Error('Oferta não encontrada');
    }

    // Verificar se oferta ainda está pendente
    if (oferta.status !== 'pendente') {
      const mensagem = oferta.status === 'aceito' || oferta.status === 'preenchido_outro'
        ? '❌ Esta vaga já foi preenchida por outro paciente.'
        : '⏰ Esta oferta expirou.';

      return new Response(
        JSON.stringify({ success: false, message: mensagem }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se expirou
    if (new Date(oferta.expira_em) < new Date()) {
      await supabase
        .from('ofertas_vaga')
        .update({ status: 'expirado', updated_at: new Date().toISOString() })
        .eq('id', oferta_id);

      return new Response(
        JSON.stringify({ success: false, message: '⏰ Esta oferta expirou.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (resposta === '1') {
      // ACEITO - Primeiro que aceitar ganha!

      // Verificar se alguma outra oferta já foi aceita para esta vaga
      const { data: ofertasVaga, error: errorCheck } = await supabase
        .from('ofertas_vaga')
        .select('id, status')
        .eq('vaga_agendamento_id', oferta.vaga_agendamento_id)
        .eq('status', 'aceito');

      if (errorCheck) throw errorCheck;

      if (ofertasVaga && ofertasVaga.length > 0) {
        // Vaga já foi preenchida
        await supabase
          .from('ofertas_vaga')
          .update({
            status: 'preenchido_outro',
            respondido_em: new Date().toISOString(),
            resposta_paciente: resposta
          })
          .eq('id', oferta_id);

        return new Response(
          JSON.stringify({
            success: false,
            message: '❌ Esta vaga já foi preenchida por outro paciente.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Aceitar oferta
      await supabase
        .from('ofertas_vaga')
        .update({
          status: 'aceito',
          respondido_em: new Date().toISOString(),
          resposta_paciente: resposta
        })
        .eq('id', oferta_id);

      // Atualizar agendamento
      await supabase
        .from('agenda')
        .update({
          paciente_id: paciente_id,
          status: 'agendado',
          confirmado: true
        })
        .eq('id', oferta.vaga_agendamento_id);

      // Remover paciente da lista de espera
      await supabase
        .from('lista_espera')
        .update({ status: 'atendido' })
        .eq('id', oferta.paciente_lista_espera_id);

      // Marcar outras ofertas desta vaga como preenchido_outro
      await supabase
        .from('ofertas_vaga')
        .update({ status: 'preenchido_outro' })
        .eq('vaga_agendamento_id', oferta.vaga_agendamento_id)
        .neq('id', oferta_id)
        .eq('status', 'pendente');

      // Enviar mensagem "vaga preenchida" para outros pacientes
      const { data: outrasOfertas } = await supabase
        .from('ofertas_vaga')
        .select('*, pacientes(nome, telefone)')
        .eq('vaga_agendamento_id', oferta.vaga_agendamento_id)
        .eq('status', 'preenchido_outro')
        .neq('id', oferta_id);

      if (outrasOfertas) {
        for (const outraOferta of outrasOfertas) {
          const msg = '❌ A vaga que oferecemos foi preenchida por outro paciente. Você continua na lista de espera!';

          await supabase.functions.invoke('enviar-whatsapp', {
            body: {
              to: outraOferta.pacientes?.telefone,
              message: msg,
              tipo: 'text',
              tenant_id: tenant_id
            }
          });

          logger.info('Enviando notificação de vaga preenchida', 'lista_espera', {
            paciente_id: outraOferta.paciente_id,
            telefone: outraOferta.pacientes?.telefone
          });
        }
      }

      // Atualizar métricas
      await supabase.rpc('log_system_event', {
        p_level: 'info',
        p_message: 'Oferta aceita - vaga salva',
        p_service: 'lista_espera_metricas',
        p_tenant_id: tenant_id,
        p_metadata: { oferta_id, vaga_salva: true }
      });

      logger.info('Oferta aceita com sucesso', 'lista_espera', { oferta_id, paciente_id });

      return new Response(
        JSON.stringify({
          success: true,
          message: '✅ Vaga confirmada! Sua consulta foi reagendada.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (resposta === '2') {
      // RECUSADO
      await supabase
        .from('ofertas_vaga')
        .update({
          status: 'recusado',
          respondido_em: new Date().toISOString(),
          resposta_paciente: resposta
        })
        .eq('id', oferta_id);

      logger.info('Oferta recusada', 'lista_espera', { oferta_id, paciente_id });

      return new Response(
        JSON.stringify({
          success: true,
          message: '✅ Ok! Você continua na lista de espera.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Resposta inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Erro ao processar resposta', 'lista_espera', { error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
