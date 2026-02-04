import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WhatsAppNotification {
  id: string;
  conversation_id: string;
  telefone: string;
  paciente_nome?: string;
  mensagem: string;
  timestamp: string;
}

export function useWhatsAppNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<WhatsAppNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    loadUnreadCount();
    subscribeToNewMessages();
  }, []);

  const loadUnreadCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) return;

      const { count, error } = await supabase
        .from("whatsapp_messages")
        .select("id", { count: "exact", head: true })
        .eq("direcao", "entrada")
        .is("metadata->lido", null);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (error) {
      console.error("Erro ao carregar contador de não lidas:", error);
    }
  };

  const subscribeToNewMessages = () => {
    const channel = supabase
      .channel("whatsapp-new-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "whatsapp_messages",
          filter: "direcao=eq.entrada",
        },
        async (payload) => {
          const newMessage = payload.new as any;
          
          // Buscar dados da conversa
          const { data: conversation } = await supabase
            .from("whatsapp_conversations")
            .select(`
              id,
              telefone,
              pacientes:paciente_id(nome)
            `)
            .eq("id", newMessage.conversation_id)
            .single();

          if (conversation) {
            const notification: WhatsAppNotification = {
              id: newMessage.id,
              conversation_id: newMessage.conversation_id,
              telefone: conversation.telefone,
              paciente_nome: conversation.pacientes?.nome,
              mensagem: newMessage.conteudo,
              timestamp: newMessage.timestamp,
            };

            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Tocar som
            if (soundEnabled) {
              playNotificationSound();
            }

            // Mostrar toast
            toast.info(`Nova mensagem de ${notification.paciente_nome || notification.telefone}`, {
              description: notification.mensagem.substring(0, 100),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const playNotificationSound = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Som de notificação WhatsApp-like
    oscillator.frequency.setValueAtTime(800, ctx.currentTime);
    oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.3);
  };

  const markAsRead = async (conversationId: string) => {
    try {
      // Atualizar metadata das mensagens para marcar como lidas
      const { data: messages, error: fetchError } = await supabase
        .from("whatsapp_messages")
        .select("id, metadata")
        .eq("conversation_id", conversationId)
        .eq("direcao", "entrada");

      if (fetchError) throw fetchError;

      for (const msg of messages || []) {
        await supabase
          .from("whatsapp_messages")
          .update({
            metadata: { ...(msg.metadata as any), lido: true, lido_em: new Date().toISOString() }
          })
          .eq("id", msg.id);
      }

      setNotifications(prev => prev.filter(n => n.conversation_id !== conversationId));
      loadUnreadCount();
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  };

  const clearNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  return {
    unreadCount,
    notifications,
    soundEnabled,
    setSoundEnabled,
    markAsRead,
    clearNotification,
  };
}
