import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { EdgeLogger } from '../_shared/logger.ts';

interface CheckinPayload {
  agendamento_id: string;
  paciente_id: string;
  tenant_id: string;
  etapa: 'convenio' | 'carteirinha' | 'foto_frente' | 'foto_verso' | 'motivo' | 'lgpd';
  valor?: string;
  foto_url?: string;
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

    const payload: CheckinPayload = await req.json();
    logger.info('Processando check-in WhatsApp', 'checkin_whatsapp', { payload });

    const { agendamento_id, paciente_id, tenant_id, etapa, valor, foto_url } = payload;

    // Buscar ou criar registro de check-in
    const checkinResponse = await supabase
      .from('checkin_whatsapp')
      .select('*')
      .eq('agendamento_id', agendamento_id)
      .eq('paciente_id', paciente_id)
      .single();

    let checkin = checkinResponse.data;
    const errorCheckin = checkinResponse.error;

    if (errorCheckin && errorCheckin.code !== 'PGRST116') {
      throw errorCheckin;
    }

    if (!checkin) {
      // Criar novo check-in
      const { data: novoCheckin, error: errorNovo } = await supabase
        .from('checkin_whatsapp')
        .insert({
          tenant_id,
          agendamento_id,
          paciente_id,
          status: 'aguardando_dados',
          etapa_atual: etapa
        })
        .select()
        .single();

      if (errorNovo) throw errorNovo;
      checkin = novoCheckin;
    }

    // Validar dados baseado no tipo de serviço
    const { data: agendamento } = await supabase
      .from('agenda')
      .select('servico_id, servicos(tipo)')
      .eq('id', agendamento_id)
      .single();

    const tipoServico = (agendamento?.servicos as any)?.tipo || 'geral';

    // Processar cada etapa
    const updateData: any = { etapa_atual: etapa };
    let proximaEtapa = '';
    let mensagemResposta = '';

    switch (etapa) {
      case 'convenio':
        if (!valor || valor.trim().length < 2) {
          updateData.tentativas = (checkin.tentativas || 0) + 1;
          updateData.ultimo_erro = 'Convênio inválido';
          mensagemResposta = '❌ Por favor, informe o nome do convênio/seguradora corretamente.';
        } else {
          updateData.convenio = valor;
          proximaEtapa = 'carteirinha';
          mensagemResposta = '✅ Convênio registrado!\n\n📋 Agora, envie o *número da carteirinha*.';
        }
        break;

      case 'carteirinha':
        if (!valor || valor.trim().length < 3) {
          updateData.tentativas = (checkin.tentativas || 0) + 1;
          updateData.ultimo_erro = 'Carteirinha inválida';
          mensagemResposta = '❌ Por favor, informe o número da carteirinha corretamente.';
        } else {
          updateData.numero_carteirinha = valor;
          proximaEtapa = 'foto_frente';
          mensagemResposta = '✅ Carteirinha registrada!\n\n📸 Envie uma *foto da frente* da carteirinha.';
        }
        break;

      case 'foto_frente':
        if (!foto_url) {
          updateData.tentativas = (checkin.tentativas || 0) + 1;
          updateData.ultimo_erro = 'Foto não recebida';
          mensagemResposta = '❌ Não recebemos a foto. Por favor, envie novamente a foto da *frente da carteirinha*.';
        } else {
          updateData.foto_frente_url = foto_url;
          proximaEtapa = 'foto_verso';
          mensagemResposta = '✅ Foto da frente recebida!\n\n📸 Agora envie a *foto do verso* da carteirinha.';
        }
        break;

      case 'foto_verso':
        if (!foto_url) {
          updateData.tentativas = (checkin.tentativas || 0) + 1;
          updateData.ultimo_erro = 'Foto não recebida';
          mensagemResposta = '❌ Não recebemos a foto. Por favor, envie novamente a foto do *verso da carteirinha*.';
        } else {
          updateData.foto_verso_url = foto_url;
          proximaEtapa = 'motivo';
          mensagemResposta = '✅ Foto do verso recebida!\n\n💬 Qual o *motivo da sua consulta*? (descreva brevemente)';
        }
        break;

      case 'motivo':
        if (!valor || valor.trim().length < 5) {
          updateData.tentativas = (checkin.tentativas || 0) + 1;
          updateData.ultimo_erro = 'Motivo muito curto';
          mensagemResposta = '❌ Por favor, descreva o motivo da consulta com mais detalhes.';
        } else {
          updateData.motivo_consulta = valor;
          proximaEtapa = 'lgpd';
          mensagemResposta = '✅ Motivo registrado!\n\n' +
            '📋 *Termos LGPD*\n\n' +
            'Você autoriza o uso dos seus dados para:\n' +
            '1️⃣ - Sim para tudo (lembretes + promoções)\n' +
            '2️⃣ - Apenas lembretes\n' +
            '3️⃣ - Não autorizo';
        }
        break;

      case 'lgpd':
        if (valor === '1') {
          updateData.consentimento_lgpd = true;
          updateData.opt_in_lembretes = true;
          updateData.opt_in_promocoes = true;
        } else if (valor === '2') {
          updateData.consentimento_lgpd = true;
          updateData.opt_in_lembretes = true;
          updateData.opt_in_promocoes = false;
        } else if (valor === '3') {
          updateData.consentimento_lgpd = false;
          updateData.opt_in_lembretes = false;
          updateData.opt_in_promocoes = false;
        } else {
          mensagemResposta = '❌ Resposta inválida. Responda:\n1️⃣ - Sim para tudo\n2️⃣ - Apenas lembretes\n3️⃣ - Não autorizo';
          break;
        }

        updateData.status = 'completo';
        updateData.pronto_atendimento = true;
        proximaEtapa = 'concluido';

        mensagemResposta = '✅ *Check-in concluído!*\n\n' +
          '🎉 Você está pronto para o atendimento!\n\n' +
          'Seus dados foram registrados com sucesso. Aguarde sua consulta.';

        // Registrar consentimento LGPD
        if (updateData.consentimento_lgpd) {
          await supabase.from('consent_records').insert({
            tenant_id,
            contact_id: paciente_id,
            consent_type: 'whatsapp',
            status: 'opted_in',
            channel: 'whatsapp',
            ip_address: 'whatsapp',
            metadata: {
              opt_in_lembretes: updateData.opt_in_lembretes,
              opt_in_promocoes: updateData.opt_in_promocoes,
              checkin_id: checkin.id
            }
          });
        }

        // Log de auditoria
        await supabase.rpc('log_system_event', {
          p_level: 'info',
          p_message: 'Check-in WhatsApp concluído',
          p_service: 'checkin_whatsapp',
          p_tenant_id: tenant_id,
          p_user_id: paciente_id,
          p_metadata: {
            checkin_id: checkin.id,
            agendamento_id,
            consentimento_lgpd: updateData.consentimento_lgpd
          }
        });
        break;
    }

    // Atualizar check-in
    updateData.etapa_atual = proximaEtapa || etapa;

    const { error: errorUpdate } = await supabase
      .from('checkin_whatsapp')
      .update(updateData)
      .eq('id', checkin.id);

    if (errorUpdate) throw errorUpdate;

    logger.info('Check-in processado', 'checkin_whatsapp', {
      checkin_id: checkin.id,
      etapa,
      proxima_etapa: proximaEtapa
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: mensagemResposta,
        proxima_etapa: proximaEtapa,
        concluido: proximaEtapa === 'concluido'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Erro ao processar check-in', 'checkin_whatsapp', { error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
