import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useSupportChat, ChatSession, ChatMessage } from "@/hooks/useSupportChat";
import { ArrowLeft, Send, CheckCircle2, Ticket, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ChatWindowProps {
  sessionId: string;
  onClose: () => void;
}

export const ChatWindow = ({ sessionId, onClose }: ChatWindowProps) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendMessage, resolveChat, elevateToTicket } = useSupportChat();

  useEffect(() => {
    loadSession();
    loadMessages();
    subscribeToMessages();
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadSession = async () => {
    try {
      const { data, error } = await supabase
        .from('support_chat_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      setSession(data as ChatSession);
    } catch (error) {
      console.error('Error loading session:', error);
      toast.error('Erro ao carregar sessão');
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('support_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as ChatMessage[]);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_chat_messages',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const success = await sendMessage(sessionId, newMessage);
    if (success) {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleResolveChat = async () => {
    const success = await resolveChat(sessionId);
    if (success) {
      onClose();
    }
  };

  const handleElevateToTicket = async () => {
    const ticket = await elevateToTicket(sessionId);
    if (ticket) {
      onClose();
      navigate('/admin', { state: { openTicket: ticket.id } });
    }
  };

  const getWaitTime = () => {
    if (!session?.started_at) return '';
    return formatDistanceToNow(new Date(session.started_at), {
      addSuffix: false,
      locale: ptBR,
    });
  };

  if (!session) {
    return null;
  }

  return (
    <Sheet open={true} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-[600px] flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <SheetTitle className="text-left">
                {session.client_name || "Cliente Anônimo"}
              </SheetTitle>
              {session.client_email && (
                <p className="text-sm text-muted-foreground">{session.client_email}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {getWaitTime()}
              </Badge>
              {session.status === 'active' && (
                <Badge>Em andamento</Badge>
              )}
            </div>
          </div>
        </SheetHeader>

        <Card className="m-4 p-4 bg-muted/50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {session.client_phone && (
              <div>
                <span className="text-muted-foreground">Telefone:</span>
                <p className="font-medium">{session.client_phone}</p>
              </div>
            )}
            {session.started_at && (
              <div>
                <span className="text-muted-foreground">Iniciado:</span>
                <p className="font-medium">
                  {new Date(session.started_at).toLocaleString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        </Card>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender_type === 'agent' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.sender_type === 'agent'
                      ? 'bg-primary text-primary-foreground'
                      : message.sender_type === 'system'
                      ? 'bg-muted text-muted-foreground text-center'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{message.message}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResolveChat}
              disabled={session.status !== 'active'}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Resolver
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleElevateToTicket}
              disabled={session.status !== 'active'}
            >
              <Ticket className="h-4 w-4 mr-2" />
              Elevar a Ticket
            </Button>
          </div>

          <div className="flex gap-2">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="min-h-[60px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={session.status !== 'active'}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending || session.status !== 'active'}
              size="icon"
              className="h-[60px] w-[60px]"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
