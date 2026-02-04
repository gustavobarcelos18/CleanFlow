import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WhatsAppConversationList } from "./WhatsAppConversationList";
import { WhatsAppMessageView } from "./WhatsAppMessageView";

interface Conversation {
  id: string;
  telefone: string;
  paciente_nome?: string;
  status: string;
  ultima_mensagem?: string;
  ultima_mensagem_em?: string;
  mensagens_nao_lidas?: number;
  created_at: string;
  tenant_id: string;
}

export function ChatUnificado() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    loadConversations();
    subscribeToConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) return;

      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select(`
          *,
          pacientes:paciente_id(nome)
        `)
        .eq("tenant_id", profile.tenant_id)
        .in("status", ["aguardando", "em_atendimento"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedData = data?.map(conv => ({
        ...conv,
        paciente_nome: conv.pacientes?.nome,
        tenant_id: profile.tenant_id
      })) || [];

      setConversations(formattedData);
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
      toast.error("Erro ao carregar conversas");
    }
  };

  const subscribeToConversations = () => {
    const channel = supabase
      .channel("whatsapp-conversations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_conversations",
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleTakeConversation = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("whatsapp_conversations")
        .update({
          status: "em_atendimento",
          atendente_id: user.id,
        })
        .eq("id", conversationId);

      if (error) throw error;

      toast.success("Conversa assumida com sucesso");
      loadConversations();
      
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedConversation({ ...conversation, status: "em_atendimento" });
      }
    } catch (error) {
      console.error("Erro ao assumir conversa:", error);
      toast.error("Erro ao assumir conversa");
    }
  };

  const handleResolveConversation = () => {
    setSelectedConversation(null);
    loadConversations();
  };

  if (selectedConversation) {
    return (
      <WhatsAppMessageView
        conversation={selectedConversation}
        onClose={() => setSelectedConversation(null)}
        onResolve={handleResolveConversation}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-200px)]">
      <WhatsAppConversationList
        conversations={conversations}
        selectedConversationId={selectedConversation?.id}
        onSelectConversation={(id) => {
          const conv = conversations.find(c => c.id === id);
          if (conv) setSelectedConversation(conv);
        }}
        onTakeConversation={handleTakeConversation}
      />
    </div>
  );
}
