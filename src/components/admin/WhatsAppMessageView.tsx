import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Phone,
  CheckCheck,
  Check,
  Clock,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WhatsAppMediaUpload } from "./WhatsAppMediaUpload";
import { useWhatsAppIntentProcessor } from "./WhatsAppIntentProcessor";

interface Message {
  id: string;
  conversation_id: string;
  sender_type: string;
  sender_name?: string;
  conteudo: string;
  tipo_mensagem: string;
  status: string;
  timestamp: string;
  created_at: string;
}

interface Conversation {
  id: string;
  telefone: string;
  paciente_nome?: string;
  status: string;
  tenant_id: string;
}

interface WhatsAppMessageViewProps {
  conversation: Conversation;
  onClose: () => void;
  onResolve: (conversationId: string) => void;
}

export function WhatsAppMessageView({
  conversation,
  onClose,
  onResolve,
}: WhatsAppMessageViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { processIntent } = useWhatsAppIntentProcessor();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("timestamp", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      toast.error("Erro ao carregar mensagens");
    } finally {
      setLoading(false);
    }
  }, [conversation.id]);

  const subscribeToMessages = useCallback(() => {
    const channel = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whatsapp_messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);

          // Processar intenção se for mensagem do cliente
          if (newMsg.sender_type === "cliente") {
            await processIntent(
              conversation.id,
              newMsg.conteudo,
              conversation.tenant_id,
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation.id, conversation.tenant_id, processIntent]);

  useEffect(() => {
    loadMessages();
    const unsubscribe = subscribeToMessages();
    return () => {
      unsubscribe();
    };
  }, [loadMessages, subscribeToMessages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMediaMessage = async (content: string) => {
    if (sending) return;

    setSending(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Inserir mensagem no banco
      const { error: insertError } = await supabase
        .from("whatsapp_messages")
        .insert({
          conversation_id: conversation.id,
          sender_type: "agente",
          sender_id: user.id,
          conteudo: content,
          tipo_mensagem: "text",
          direcao: "saida",
          status: "pendente",
          timestamp: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // Chamar edge function para enviar via WhatsApp
      const { error: sendError } = await supabase.functions.invoke(
        "enviar-whatsapp",
        {
          body: {
            telefone: conversation.telefone,
            mensagem: content,
            tenant_id: conversation.tenant_id,
            conversation_id: conversation.id,
          },
        },
      );

      if (sendError) throw sendError;

      toast.success("Mensagem enviada");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    try {
      const { error } = await supabase
        .from("whatsapp_conversations")
        .update({ status: "resolvido" })
        .eq("id", conversation.id);

      if (error) throw error;

      toast.success("Conversa encerrada");
      onResolve(conversation.id);
    } catch (error) {
      console.error("Erro ao encerrar conversa:", error);
      toast.error("Erro ao encerrar conversa");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "entregue":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "lido":
        return <CheckCheck className="h-3 w-3 text-green-500" />;
      case "enviado":
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case "falha":
        return <X className="h-3 w-3 text-destructive" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando mensagens...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Phone className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">
              {conversation.paciente_nome || conversation.telefone}
            </h3>
            {conversation.paciente_nome && (
              <p className="text-sm text-muted-foreground">
                {conversation.telefone}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conversation.status === "em_atendimento" && (
            <Button size="sm" variant="outline" onClick={handleResolve}>
              Encerrar Conversa
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender_type === "cliente"
                  ? "justify-start"
                  : "justify-end"
              }`}
            >
              <Card
                className={`max-w-[70%] p-3 ${
                  message.sender_type === "cliente"
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {message.conteudo}
                </p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-xs opacity-70">
                    {format(new Date(message.timestamp), "HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                  {message.sender_type === "agente" &&
                    getStatusIcon(message.status)}
                </div>
              </Card>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      {conversation.status !== "resolvido" && (
        <div className="p-4 border-t">
          <div className="flex gap-2 mb-2">
            <WhatsAppMediaUpload
              conversationId={conversation.id}
              onMediaUploaded={(url, type) => {
                handleSendMediaMessage(
                  `[${type.startsWith("image/") ? "Imagem" : "Arquivo"}] ${url}`,
                );
              }}
            />
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="min-h-[80px] resize-none flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMediaMessage(newMessage);
                  setNewMessage("");
                }
              }}
            />
            <Button
              onClick={() => {
                handleSendMediaMessage(newMessage);
                setNewMessage("");
              }}
              disabled={!newMessage.trim() || sending}
              size="icon"
              className="self-end"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Pressione Enter para enviar, Shift+Enter para nova linha
          </p>
        </div>
      )}
    </div>
  );
}
