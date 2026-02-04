import { supabase } from "@/integrations/supabase/client";
import { whatsappService } from "@/domain/whatsapp/whatsappService";
import { AutomationContext, AutomationFlow, AutomationNode, AutomationEdge } from "./types";

export const automationEngine = {
    async processarEventoAutomacao(context: AutomationContext) {
        console.log(`[AutomationEngine] Processando evento: ${context.event_type} para tenant: ${context.tenant_id}`);

        try {
            // 1. Buscar fluxos ativos para este tenant
            const { data: flows, error: flowError } = await supabase
                .from('automations_flows')
                .select('*')
                .eq('tenant_id', context.tenant_id)
                .eq('ativo', true);

            if (flowError) throw flowError;
            if (!flows || flows.length === 0) {
                console.log('[AutomationEngine] Nenhum fluxo ativo encontrado.');
                return;
            }

            // 2. Para cada fluxo, verificar se o gatilho corresponde
            for (const flow of flows) {
                await this._executarFluxo(flow, context);
            }

        } catch (error) {
            console.error('[AutomationEngine] Erro crítico ao processar automação:', error);
            // Logar erro sistêmico se necessário
        }
    },

    async _executarFluxo(flow: AutomationFlow, context: AutomationContext) {
        try {
            // Buscar nós e arestas do fluxo
            const { data: nodes, error: nodeError } = await supabase
                .from('automations_nodes')
                .select('*')
                .eq('flow_id', flow.id)
                .order('ordem');

            const { data: edges, error: edgeError } = await supabase
                .from('automations_edges')
                .select('*')
                .eq('flow_id', flow.id);

            if (nodeError || edgeError || !nodes) return;

            // Encontrar nó inicial (trigger)
            const triggerNode = nodes.find(n => n.tipo === 'trigger' && n.config_json?.event === context.event_type);

            if (!triggerNode) {
                // Este fluxo não começa com este evento
                return;
            }

            console.log(`[AutomationEngine] Iniciando fluxo "${flow.nome}" (ID: ${flow.id})`);

            // Iniciar travessia
            await this._processarNo(triggerNode, nodes, edges || [], context, flow.id);

        } catch (error) {
            console.error(`[AutomationEngine] Erro no fluxo ${flow.id}:`, error);
            await this._logAudit(context.tenant_id, flow.id, null, context.event_type, null, 'error', { error });
        }
    },

    async _processarNo(
        currentNode: AutomationNode,
        allNodes: AutomationNode[],
        allEdges: AutomationEdge[],
        context: AutomationContext,
        flowId: string
    ) {
        // Executar lógica do nó atual
        let shouldContinue = true;

        if (currentNode.tipo === 'condition') {
            shouldContinue = await this._avaliarCondicao(currentNode, context);
        } else if (currentNode.tipo === 'action') {
            await this._executarAcao(currentNode, context, flowId);
        }

        // Se for condição e falhar (false), procurar aresta de "false" ou parar?
        // Simplificação: Se condição for true, segue aresta padrão. Se false, segue aresta "else" se existir.
        // Aqui assumimos um grafo simples: edges conectam nodes.

        // Encontrar próximos nós
        const nextEdges = allEdges.filter(e => e.from_node_id === currentNode.id);

        for (const edge of nextEdges) {
            // Se tiver condição na aresta (ex: branch), verificar
            // Se o nó atual foi uma condição, o resultado dela dita qual aresta seguir

            if (currentNode.tipo === 'condition') {
                // Lógica de branch: edge.condicao_json deve bater com o resultado
                // Ex: edge.condicao_json = { result: true }
                const edgeCondition = edge.condicao_json?.result;
                if (edgeCondition !== undefined && edgeCondition !== shouldContinue) {
                    continue; // Não segue esta aresta
                }
            }

            const nextNode = allNodes.find(n => n.id === edge.to_node_id);
            if (nextNode) {
                await this._processarNo(nextNode, allNodes, allEdges, context, flowId);
            }
        }
    },

    async _avaliarCondicao(node: AutomationNode, context: AutomationContext): Promise<boolean> {
        const config = node.config_json;

        switch (config.condition_type) {
            case 'check_risk_noshow':
                // Verificar risco no payload (agendamento já tem o score calculado)
                const score = context.data?.agendamento?.no_show_score || 0;
                return score >= (config.threshold || 70);

            case 'check_unit':
                return context.data?.unidade_id === config.unit_id;

            case 'check_service':
                return context.data?.servico_id === config.service_id;

            default:
                return true;
        }
    },

    async _executarAcao(node: AutomationNode, context: AutomationContext, flowId: string) {
        const config = node.config_json;
        const actionType = config.action_type;

        try {
            switch (actionType) {
                case 'send_whatsapp':
                    if (context.data?.paciente?.telefone) {
                        const messageType = config.message_type || 'operacional';
                        const content = this._interpolarVariaveis(config.template, context.data);

                        if (messageType === 'marketing') {
                            await whatsappService.enfileirarMensagemMarketing(context.tenant_id, {
                                telefone: context.data.paciente.telefone,
                                conteudo: content
                            });
                        } else {
                            await whatsappService.enfileirarMensagemOperacional(context.tenant_id, {
                                telefone: context.data.paciente.telefone,
                                conteudo: content
                            });
                        }
                    }
                    break;

                case 'send_email':
                    console.log('[AutomationEngine] Mock: Enviando email para', context.data?.paciente?.email);
                    break;

                case 'add_tag':
                    console.log('[AutomationEngine] Mock: Adicionando tag', config.tag, 'ao paciente', context.data?.paciente?.id);
                    break;
            }

            await this._logAudit(context.tenant_id, flowId, node.id, context.event_type, actionType, 'success', { config });

        } catch (error: any) {
            console.error(`[AutomationEngine] Erro na ação ${actionType}:`, error);
            await this._logAudit(context.tenant_id, flowId, node.id, context.event_type, actionType, 'error', { error: error.message });
        }
    },

    _interpolarVariaveis(template: string, data: any): string {
        if (!template) return '';
        return template.replace(/{{(\w+)}}/g, (_, key) => {
            // Suporte básico a variáveis planas (ex: {{paciente_nome}})
            // Idealmente usar lodash.get para nested props
            return data[key] || data.paciente?.[key] || `{{${key}}}`;
        });
    },

    async _logAudit(
        tenantId: string,
        flowId: string | null,
        nodeId: string | null,
        eventType: string,
        actionType: string | null,
        status: string,
        details: any
    ) {
        await supabase.from('automation_logs').insert({
            tenant_id: tenantId,
            flow_id: flowId,
            node_id: nodeId,
            event_type: eventType,
            action_type: actionType,
            status,
            details
        });
    }
};
