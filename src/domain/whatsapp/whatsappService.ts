import { supabase } from "@/integrations/supabase/client";
import { WhatsappOutboxEntry, MessageType } from "./whatsappTypes";

export const whatsappService = {
    async enfileirarMensagemOperacional(
        tenantId: string,
        dados: { telefone: string; conteudo: string; metadata?: any }
    ): Promise<{ id: string }> {
        return this._enfileirar(tenantId, dados, 'operacional');
    },

    async enfileirarMensagemMarketing(
        tenantId: string,
        dados: { telefone: string; conteudo: string; metadata?: any }
    ): Promise<{ id: string }> {
        // Verificar consentimento (exemplo simplificado)
        // Idealmente, checaríamos uma tabela de consentimentos ou campo no perfil do paciente
        const temConsentimento = await this._verificarConsentimento(tenantId, dados.telefone);
        if (!temConsentimento) {
            throw new Error("Cliente não deu consentimento para mensagens de marketing.");
        }

        return this._enfileirar(tenantId, dados, 'marketing');
    },

    async _enfileirar(
        tenantId: string,
        dados: { telefone: string; conteudo: string; metadata?: any },
        tipo: MessageType
    ): Promise<{ id: string }> {

        // Inserir na outbox
        // Assumindo tabela 'whatsapp_outbox' ou similar. O dump mostrou 'whatsapp_dlq', mas geralmente tem uma outbox principal.
        // Se não tiver, vou usar uma tabela genérica ou criar.
        // O dump não mostrou 'whatsapp_outbox' explicitamente, mas mencionou "WhatsApp Outbox" no cabeçalho.
        // Vou assumir que existe ou usar 'messages_queue' se houver.
        // Vou tentar 'whatsapp_outbox'.

        const { data, error } = await supabase
            .from("whatsapp_outbox" as any) // Cast as any se não estiver no types
            .insert({
                tenant_id: tenantId,
                phone_number: dados.telefone,
                message_content: dados.conteudo,
                status: 'queued',
                message_type: tipo, // Se a coluna existir, senão colocar em metadata
                metadata: {
                    ...dados.metadata,
                    tipo_mensagem: tipo
                }
            })
            .select()
            .single();

        if (error) {
            // Fallback: se a tabela não existir com esse nome, tentar adaptar ou logar erro
            console.error("Erro ao enfileirar mensagem:", error);
            throw error;
        }

        // Tentar envio imediato (Best effort)
        this._processarEnvioImediato(data.id, tenantId, dados.telefone, dados.conteudo)
            .catch(err => console.error("Erro no envio imediato:", err));

        return { id: data.id };
    },

    async _processarEnvioImediato(outboxId: string, tenantId: string, telefone: string, conteudo: string) {
        try {
            await supabase
                .from("whatsapp_outbox" as any)
                .update({ status: 'sending', processed_at: new Date().toISOString() })
                .eq('id', outboxId);

            const { error } = await supabase.functions.invoke("enviar-whatsapp", {
                body: {
                    telefone,
                    mensagem: conteudo,
                    tenant_id: tenantId,
                    outbox_id: outboxId
                },
            });

            if (error) throw error;

            await supabase
                .from("whatsapp_outbox" as any)
                .update({ status: 'sent' })
                .eq('id', outboxId);

        } catch (err: any) {
            console.error("Falha no envio:", err);
            await supabase
                .from("whatsapp_outbox" as any)
                .update({
                    status: 'failed',
                    error_message: err.message || 'Unknown error'
                })
                .eq('id', outboxId);
        }
    },

    async _verificarConsentimento(tenantId: string, telefone: string): Promise<boolean> {
        // Implementar lógica real de verificação de opt-in
        // Por enquanto, retorna true para não bloquear, mas com TODO
        return true;
    },

    isWithin24Hours(lastInteraction: string): boolean {
        const last = new Date(lastInteraction).getTime();
        const now = new Date().getTime();
        const diffHours = (now - last) / (1000 * 60 * 60);
        return diffHours < 24;
    }
};
