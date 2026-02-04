import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { whatsappService } from "@/domain/whatsapp/whatsappService";

interface ProcessedIntent {
  type: "confirmacao" | "cancelamento" | "remarcacao" | "duvida" | "outro";
  confidence: number;
  agendamento_id?: string;
}

export function useWhatsAppIntentProcessor() {
  const detectIntent = (mensagem: string): ProcessedIntent => {
    const texto = mensagem.toLowerCase().trim();

    // Palavras-chave para confirmação
    const confirmacoesKeywords = [
      "sim", "confirmo", "confirmado", "ok", "tudo bem", "pode ser",
      "beleza", "confirmar", "estarei lá", "vou sim", "presente"
    ];

    // Palavras-chave para cancelamento
    const cancelamentosKeywords = [
      "não", "cancelar", "desmarcar", "não posso", "não vou",
      "não consigo", "preciso cancelar", "desejo cancelar"
    ];

    // Palavras-chave para remarcação
    const remarcacaoKeywords = [
      "remarcar", "trocar", "mudar", "outro dia", "outra data",
      "outro horário", "transferir"
    ];

    // Detecção de confirmação
    if (confirmacoesKeywords.some(keyword => texto.includes(keyword))) {
      return {
        type: "confirmacao",
        confidence: 0.9,
      };
    }

    // Detecção de cancelamento
    if (cancelamentosKeywords.some(keyword => texto.includes(keyword))) {
      return {
        type: "cancelamento",
        confidence: 0.85,
      };
    }

    // Detecção de remarcação
    if (remarcacaoKeywords.some(keyword => texto.includes(keyword))) {
      return {
        type: "remarcacao",
        confidence: 0.8,
      };
    }

    // Detecção de dúvida
    if (texto.includes("?") || texto.includes("dúvida") || texto.includes("informação")) {
      return {
        type: "duvida",
        confidence: 0.7,
      };
    }

    return {
      type: "outro",
      confidence: 0.5,
    };
  };

  const processIntent = async (
    conversationId: string,
    mensagem: string,
    tenantId: string
  ) => {
    const intent = detectIntent(mensagem);

    // Buscar agendamento relacionado
    const { data: conversation } = await supabase
      .from("whatsapp_conversations")
      .select(`
        paciente_id,
        metadata
      `)
      .eq("id", conversationId)
      .single();

    if (!conversation) return;

    const agendamentoId = (conversation.metadata as any)?.agendamento_id;

    // Processar baseado na intenção
    switch (intent.type) {
      case "confirmacao":
        if (agendamentoId) {
          await handleConfirmacao(agendamentoId, conversationId, tenantId);
        }
        break;

      case "cancelamento":
        if (agendamentoId) {
          await handleCancelamento(agendamentoId, conversationId, tenantId);
        }
        break;

      case "remarcacao":
        if (agendamentoId) {
          await handleRemarcacao(agendamentoId, conversationId, tenantId);
        }
        break;

      case "duvida":
        await handleDuvida(conversationId, tenantId);
        break;
    }

    return intent;
  };

  const handleConfirmacao = async (
    agendamentoId: string,
    conversationId: string,
    tenantId: string
  ) => {
    try {
      // Atualizar agendamento
      const { error } = await supabase
        .from("agenda")
        .update({
          confirmado: true,
          confirmado_em: new Date().toISOString(),
        })
        .eq("id", agendamentoId);

      if (error) throw error;

      // Enviar mensagem de resposta automática
      await enviarRespostaAutomatica(
        conversationId,
        "✅ Sua consulta foi confirmada com sucesso! Aguardamos você no dia e horário agendados.",
        tenantId
      );

      toast.success("Consulta confirmada automaticamente");
    } catch (error) {
      console.error("Erro ao processar confirmação:", error);
    }
  };

  const handleCancelamento = async (
    agendamentoId: string,
    conversationId: string,
    tenantId: string
  ) => {
    try {
      // Atualizar status do agendamento
      const { error } = await supabase
        .from("agenda")
        .update({
          status: "cancelado",
        })
        .eq("id", agendamentoId);

      if (error) throw error;

      await enviarRespostaAutomatica(
        conversationId,
        "Sua consulta foi cancelada. Se precisar reagendar, entre em contato conosco.",
        tenantId
      );

      toast.info("Consulta cancelada automaticamente");
    } catch (error) {
      console.error("Erro ao processar cancelamento:", error);
    }
  };

  const handleRemarcacao = async (
    agendamentoId: string,
    conversationId: string,
    tenantId: string
  ) => {
    try {
      await enviarRespostaAutomatica(
        conversationId,
        "Entendo que você precisa remarcar. Nossa equipe entrará em contato em breve para agendar uma nova data. 📅",
        tenantId
      );

      // Criar alerta para equipe (atualizar metadata da conversa)
      const { data: conv } = await supabase
        .from("whatsapp_conversations")
        .select("metadata")
        .eq("id", conversationId)
        .single();

      await supabase.from("whatsapp_conversations").update({
        metadata: { ...(conv?.metadata as any), remarcacao_solicitada: true },
      }).eq("id", conversationId);

      toast.info("Solicitação de remarcação registrada");
    } catch (error) {
      console.error("Erro ao processar remarcação:", error);
    }
  };

  const handleDuvida = async (conversationId: string, tenantId: string) => {
    await enviarRespostaAutomatica(
      conversationId,
      "Recebi sua dúvida! Um membro da nossa equipe responderá em breve. 😊",
      tenantId
    );
  };

  const enviarRespostaAutomatica = async (
    conversationId: string,
    mensagem: string,
    tenantId: string
  ) => {
    try {
      // Buscar telefone antes (se já não tiver)
      const { data: conversation } = await supabase
        .from("whatsapp_conversations")
        .select("telefone")
        .eq("id", conversationId)
        .single();

      if (!conversation?.telefone) {
        throw new Error("Telefone não encontrado para esta conversa");
      }

      // Usar serviço centralizado
      await whatsappService.enfileirarMensagemOperacional(tenantId, {
        telefone: conversation.telefone,
        conteudo: mensagem,
        metadata: {
          conversation_id: conversationId,
          sender_type: "sistema",
          direcao: "saida"
        }
      });

    } catch (error) {
      console.error("Erro ao enviar resposta automática:", error);
    }
  };

  return {
    detectIntent,
    processIntent,
  };
}
