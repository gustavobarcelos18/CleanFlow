import { supabase } from '@/integrations/supabase/client';
import { ListaEspera, EncaixeOferta, ProximoListaEspera } from './types';

export class EncaixeAutomaticoService {
    /**
     * Adiciona paciente à lista de espera
     */
    static async adicionarListaEspera(data: Partial<ListaEspera>): Promise<ListaEspera> {
        const { data: result, error } = await supabase
            .from('lista_espera')
            .insert(data)
            .select()
            .single();

        if (error) throw error;
        return result;
    }

    /**
     * Busca próximo paciente elegível da lista de espera
     */
    static async buscarProximoListaEspera(
        tenantId: string,
        horarioInicio: string,
        horarioFim: string,
        profissionalId?: string,
        unidadeId?: string
    ): Promise<ProximoListaEspera | null> {
        const { data, error } = await supabase.rpc('buscar_proximo_lista_espera', {
            p_tenant_id: tenantId,
            p_horario_inicio: horarioInicio,
            p_horario_fim: horarioFim,
            p_profissional_id: profissionalId,
            p_unidade_id: unidadeId
        });

        if (error) throw error;
        return data?.[0] || null;
    }

    /**
     * Cria oferta de encaixe
     */
    static async criarOfertaEncaixe(
        tenantId: string,
        listaEsperaId: string,
        horarioInicio: string,
        horarioFim: string,
        profissionalId: string,
        unidadeId: string,
        expiraMinutos: number = 30
    ): Promise<string> {
        const { data, error } = await supabase.rpc('criar_oferta_encaixe', {
            p_tenant_id: tenantId,
            p_lista_espera_id: listaEsperaId,
            p_horario_inicio: horarioInicio,
            p_horario_fim: horarioFim,
            p_profissional_id: profissionalId,
            p_unidade_id: unidadeId,
            p_expira_minutos: expiraMinutos
        });

        if (error) throw error;
        return data;
    }

    /**
     * Processa resposta de encaixe (aceita ou recusa)
     */
    static async processarRespostaEncaixe(
        ofertaId: string,
        aceito: boolean
    ): Promise<string | null> {
        const { data, error } = await supabase.rpc('processar_resposta_encaixe', {
            p_oferta_id: ofertaId,
            p_aceito: aceito
        });

        if (error) throw error;
        return data;
    }

    /**
     * Envia oferta de encaixe via WhatsApp
     */
    static async enviarOfertaWhatsApp(
        ofertaId: string,
        pacienteNome: string,
        pacienteTelefone: string,
        dataFormatada: string,
        hora: string,
        profissionalNome: string
    ): Promise<void> {
        const mensagem = `🎯 Horário Disponível!

Olá ${pacienteNome}, temos um horário livre:

📅 ${dataFormatada}
🕐 ${hora}
👨‍⚕️ ${profissionalNome}

Gostaria de agendar?

Responda:
1️⃣ - SIM, quero agendar
2️⃣ - NÃO, obrigado

⏰ Esta oferta expira em 30 minutos.`;

        // Aqui você integraria com seu serviço de WhatsApp
        // Por exemplo: await WhatsAppService.enviarMensagem(pacienteTelefone, mensagem);

        console.log('Enviando oferta de encaixe:', { ofertaId, pacienteTelefone, mensagem });

        // Atualizar timestamp de envio
        await supabase
            .from('encaixe_ofertas')
            .update({ mensagem_enviada_em: new Date().toISOString() })
            .eq('id', ofertaId);
    }

    /**
     * Processa cancelamento e busca encaixe
     */
    static async processarCancelamentoComEncaixe(
        agendamentoId: string,
        tenantId: string
    ): Promise<void> {
        // 1. Buscar dados do agendamento cancelado
        const { data: agendamento, error: agendamentoError } = await supabase
            .from('agenda')
            .select('*, profiles!profissional_id(nome), units(nome)')
            .eq('id', agendamentoId)
            .single();

        if (agendamentoError) throw agendamentoError;

        // 2. Buscar próximo da lista de espera
        const proximo = await this.buscarProximoListaEspera(
            tenantId,
            agendamento.inicio,
            agendamento.fim,
            agendamento.profissional_id,
            agendamento.unidade_id
        );

        if (!proximo) {
            console.log('Nenhum paciente na lista de espera para este horário');
            return;
        }

        // 3. Criar oferta
        const ofertaId = await this.criarOfertaEncaixe(
            tenantId,
            proximo.lista_espera_id,
            agendamento.inicio,
            agendamento.fim,
            agendamento.profissional_id,
            agendamento.unidade_id
        );

        // 4. Enviar WhatsApp
        const dataFormatada = new Date(agendamento.inicio).toLocaleDateString('pt-BR');
        const hora = new Date(agendamento.inicio).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });

        await this.enviarOfertaWhatsApp(
            ofertaId,
            proximo.paciente_nome,
            proximo.paciente_telefone,
            dataFormatada,
            hora,
            agendamento.profiles?.nome || 'Profissional'
        );

        // 5. Registrar log
        await supabase.from('automation_logs').insert({
            flow_id: null, // Pode ser vinculado a um flow específico
            node_id: null,
            status: 'success',
            details: {
                tipo: 'encaixe_automatico',
                agendamento_cancelado_id: agendamentoId,
                oferta_id: ofertaId,
                paciente_id: proximo.paciente_id,
                lista_espera_id: proximo.lista_espera_id
            }
        });
    }

    /**
     * Detecta tipo de resposta do paciente
     */
    static async detectarTipoResposta(
        tenantId: string,
        mensagem: string
    ): Promise<'confirmacao' | 'cancelamento' | 'reagendamento' | 'encaixe' | null> {
        const mensagemLower = mensagem.toLowerCase().trim();

        // Buscar palavras-chave configuradas
        const { data: respostas, error } = await supabase
            .from('whatsapp_auto_responses')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('ativo', true);

        if (error) throw error;

        // Verificar correspondência
        for (const resposta of respostas || []) {
            if (mensagemLower.includes(resposta.palavra_chave.toLowerCase())) {
                return resposta.tipo_resposta as any;
            }
        }

        return null;
    }

    /**
     * Processa resposta de WhatsApp automaticamente
     */
    static async processarRespostaWhatsApp(
        tenantId: string,
        pacienteId: string,
        mensagem: string
    ): Promise<{ tipo: string; acao: string } | null> {
        const tipoResposta = await this.detectarTipoResposta(tenantId, mensagem);

        if (!tipoResposta) return null;

        switch (tipoResposta) {
            case 'confirmacao':
                // Confirmar próximo agendamento do paciente
                await supabase
                    .from('agenda')
                    .update({
                        confirmado: true,
                        confirmado_em: new Date().toISOString(),
                        confirmado_via: 'whatsapp'
                    })
                    .eq('paciente_id', pacienteId)
                    .eq('status', 'agendado')
                    .gte('inicio', new Date().toISOString())
                    .order('inicio', { ascending: true })
                    .limit(1);

                return { tipo: 'confirmacao', acao: 'Agendamento confirmado!' };

            case 'encaixe': {
                // Buscar oferta pendente para este paciente
                const { data: oferta } = await supabase
                    .from('encaixe_ofertas')
                    .select('*, lista_espera!inner(paciente_id)')
                    .eq('lista_espera.paciente_id', pacienteId)
                    .eq('status', 'pendente')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (oferta) {
                    await this.processarRespostaEncaixe(oferta.id, true);
                    return { tipo: 'encaixe', acao: 'Horário reservado com sucesso!' };
                }
                break;
            }

            case 'cancelamento': {
                // Cancelar próximo agendamento
                const { data: agendamentoCancelar } = await supabase
                    .from('agenda')
                    .select('id')
                    .eq('paciente_id', pacienteId)
                    .eq('status', 'agendado')
                    .gte('inicio', new Date().toISOString())
                    .order('inicio', { ascending: true })
                    .limit(1)
                    .single();

                if (agendamentoCancelar) {
                    await supabase
                        .from('agenda')
                        .update({ status: 'cancelado' })
                        .eq('id', agendamentoCancelar.id);

                    // Processar encaixe automático
                    await this.processarCancelamentoComEncaixe(agendamentoCancelar.id, tenantId);

                    return { tipo: 'cancelamento', acao: 'Agendamento cancelado.' };
                }
                break;
            }
        }

        return null;
    }

    /**
     * Expirar ofertas antigas
     */
    static async expirarOfertasAntigas(): Promise<number> {
        const { data, error } = await supabase
            .from('encaixe_ofertas')
            .update({ status: 'expirado' })
            .eq('status', 'pendente')
            .lt('expira_em', new Date().toISOString())
            .select('id');

        if (error) throw error;
        return data?.length || 0;
    }

    /**
     * Obter analytics de encaixe
     */
    static async obterAnalytics(tenantId: string) {
        const { data, error } = await supabase
            .from('view_encaixe_analytics')
            .select('*')
            .eq('tenant_id', tenantId)
            .single();

        if (error) throw error;
        return data;
    }
}
