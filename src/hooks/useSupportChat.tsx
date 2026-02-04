import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChatSession {
  id: string;
  tenant_id: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  status: 'waiting' | 'active' | 'resolved' | 'closed';
  assigned_agent_id: string | null;
  started_at: string;
  accepted_at: string | null;
  ended_at: string | null;
  wait_time_seconds: number | null;
  metadata: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_type: 'client' | 'agent' | 'system';
  sender_id: string | null;
  sender_name: string | null;
  message: string;
  attachments: any[];
  created_at: string;
}

export const useSupportChat = () => {
  const [waitingSessions, setWaitingSessions] = useState<ChatSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [recentSessions, setRecentSessions] = useState<ChatSession[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(80);

  // Load agent preferences
  useEffect(() => {
    loadAgentPreferences();
  }, []);

  // Subscribe to chat sessions
  useEffect(() => {
    loadSessions();

    const channel = supabase
      .channel('support-chat-sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_chat_sessions'
        },
        (payload) => {
          console.log('Chat session change:', payload);
          
          if (payload.eventType === 'INSERT' && payload.new.status === 'waiting') {
            playNotificationSound();
            toast.info(`Novo chat aguardando: ${payload.new.client_name || 'Cliente'}`);
          }
          
          loadSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [soundEnabled, soundVolume]);

  const loadAgentPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('support_agent_preferences')
        .select('*')
        .eq('agent_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSoundEnabled(data.sound_enabled);
        setSoundVolume(data.sound_volume);
      } else {
        // Create default preferences
        await supabase.from('support_agent_preferences').insert({
          agent_id: user.id,
          sound_enabled: true,
          sound_volume: 80,
          max_concurrent_chats: 3
        });
      }
    } catch (error) {
      console.error('Error loading agent preferences:', error);
    }
  };

  const loadSessions = async () => {
    try {
      // Waiting sessions
      const { data: waiting, error: waitingError } = await supabase
        .from('support_chat_sessions')
        .select('*')
        .eq('status', 'waiting')
        .order('started_at', { ascending: true });

      if (waitingError) throw waitingError;
      setWaitingSessions((waiting || []) as ChatSession[]);

      // Active sessions for current agent
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: active, error: activeError } = await supabase
          .from('support_chat_sessions')
          .select('*')
          .eq('status', 'active')
          .eq('assigned_agent_id', user.id)
          .order('accepted_at', { ascending: false });

        if (activeError) throw activeError;
        setActiveSessions((active || []) as ChatSession[]);
      }

      // Recent closed sessions
      const { data: recent, error: recentError } = await supabase
        .from('support_chat_sessions')
        .select('*')
        .in('status', ['resolved', 'closed'])
        .order('ended_at', { ascending: false })
        .limit(10);

      if (recentError) throw recentError;
      setRecentSessions((recent || []) as ChatSession[]);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const acceptChat = async (sessionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check current active chats
      const { data: prefs } = await supabase
        .from('support_agent_preferences')
        .select('max_concurrent_chats')
        .eq('agent_id', user.id)
        .single();

      const maxChats = prefs?.max_concurrent_chats || 3;

      if (activeSessions.length >= maxChats) {
        toast.error(`Você já está atendendo ${maxChats} chats simultaneamente`);
        return false;
      }

      const { error } = await supabase
        .from('support_chat_sessions')
        .update({
          status: 'active',
          assigned_agent_id: user.id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      playAcceptSound();
      toast.success('Chat aceito com sucesso!');
      
      // Log action
      await supabase.from('support_actions_log').insert({
        support_user_id: user.id,
        action_type: 'chat_accepted',
        target_type: 'chat_session',
        target_id: sessionId,
        description: 'Agente aceitou chat'
      });

      return true;
    } catch (error) {
      console.error('Error accepting chat:', error);
      toast.error('Erro ao aceitar chat');
      return false;
    }
  };

  const sendMessage = async (sessionId: string, message: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('support_chat_messages')
        .insert({
          session_id: sessionId,
          sender_type: 'agent',
          sender_id: user.id,
          message
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
      return false;
    }
  };

  const resolveChat = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('support_chat_sessions')
        .update({
          status: 'resolved',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      toast.success('Chat resolvido!');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('support_actions_log').insert({
          support_user_id: user.id,
          action_type: 'chat_resolved',
          target_type: 'chat_session',
          target_id: sessionId,
          description: 'Chat marcado como resolvido'
        });
      }

      return true;
    } catch (error) {
      console.error('Error resolving chat:', error);
      toast.error('Erro ao resolver chat');
      return false;
    }
  };

  const elevateToTicket = async (sessionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get session and messages
      const { data: session } = await supabase
        .from('support_chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      const { data: messages } = await supabase
        .from('support_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!session) throw new Error('Sessão não encontrada');

      // Create transcript
      const transcript = messages?.map(m => 
        `[${new Date(m.created_at).toLocaleString()}] ${m.sender_type === 'agent' ? 'Agente' : 'Cliente'}: ${m.message}`
      ).join('\n\n');

      // Create ticket
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
          tenant_id: session.tenant_id,
          user_id: user.id,
          title: `Chat de ${session.client_name || 'Cliente'}`,
          description: `Chat elevado a ticket\n\nCliente: ${session.client_name || 'N/A'}\nEmail: ${session.client_email || 'N/A'}\nTelefone: ${session.client_phone || 'N/A'}\n\n--- Histórico do Chat ---\n\n${transcript}`,
          priority: 'medium',
          status: 'open',
          origem: 'chat'
        })
        .select()
        .single();

      if (error) throw error;

      // Update session
      const currentMetadata = (session.metadata as Record<string, any>) || {};
      await supabase
        .from('support_chat_sessions')
        .update({
          status: 'closed',
          ended_at: new Date().toISOString(),
          metadata: { ...currentMetadata, elevated_ticket_id: ticket.id }
        })
        .eq('id', sessionId);

      // Log action
      await supabase.from('support_actions_log').insert({
        support_user_id: user.id,
        action_type: 'chat_elevated',
        target_type: 'chat_session',
        target_id: sessionId,
        description: `Chat elevado ao ticket #${ticket.numero}`,
        metadata: { ticket_id: ticket.id, ticket_numero: ticket.numero }
      });

      toast.success(`Chat elevado ao ticket #${ticket.numero}`);
      return ticket;
    } catch (error) {
      console.error('Error elevating to ticket:', error);
      toast.error('Erro ao elevar chat a ticket');
      return null;
    }
  };

  const updatePreferences = async (preferences: { sound_enabled?: boolean; sound_volume?: number; max_concurrent_chats?: number }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('support_agent_preferences')
        .upsert({
          agent_id: user.id,
          ...preferences
        });

      if (error) throw error;

      if (preferences.sound_enabled !== undefined) setSoundEnabled(preferences.sound_enabled);
      if (preferences.sound_volume !== undefined) setSoundVolume(preferences.sound_volume);

      toast.success('Preferências atualizadas');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Erro ao atualizar preferências');
    }
  };

  const playNotificationSound = () => {
    if (!soundEnabled) return;
    
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBzGM0/PKdyoFJHjH8N6RQQMTX7Tp661VFA==');
    audio.volume = soundVolume / 100;
    audio.play().catch(e => console.error('Error playing sound:', e));
  };

  const playAcceptSound = () => {
    if (!soundEnabled) return;
    
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAAB/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fn9/fg==');
    audio.volume = soundVolume / 100;
    audio.play().catch(e => console.error('Error playing sound:', e));
  };

  return {
    waitingSessions,
    activeSessions,
    recentSessions,
    soundEnabled,
    soundVolume,
    acceptChat,
    sendMessage,
    resolveChat,
    elevateToTicket,
    updatePreferences,
    loadSessions
  };
};
