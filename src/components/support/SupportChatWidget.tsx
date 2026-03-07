import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  User,
  Mail,
  Bot,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent" | "system" | "bot";
  created_at: string;
}

export function SupportChatWidget() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"initial" | "chat">("initial");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);

  // Guest form
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkSupportStatus();
    const interval = setInterval(checkSupportStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen && user) {
      setStep("chat");
      // Optionally load active ticket for user
      checkActiveTicket();
    } else if (isOpen) {
      // Check local storage for guest ticket
      const savedTicket = localStorage.getItem("cleanflow_guest_ticket");
      if (savedTicket) {
        setTicketId(savedTicket);
        setStep("chat");
        loadMessages(savedTicket);
      }
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const checkSupportStatus = async () => {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday
      const timeString = now.toTimeString().slice(0, 5); // HH:MM
      const dateString = now.toISOString().split("T")[0]; // YYYY-MM-DD

      // Check holidays
      const { data: holiday } = await (supabase as any)
        .from("support_holidays")
        .select("id")
        .eq("date", dateString)
        .maybeSingle();

      if (holiday) {
        setIsOnline(false);
        setCheckingStatus(false);
        return;
      }

      // Check operating hours
      const { data: hours } = await (supabase as any)
        .from("support_operating_hours")
        .select("*")
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true)
        .maybeSingle();

      if (hours) {
        const start = hours.start_time.slice(0, 5);
        const end = hours.end_time.slice(0, 5);
        setIsOnline(timeString >= start && timeString <= end);
      } else {
        setIsOnline(false);
      }
    } catch (error) {
      console.error("Error checking status:", error);
      // Default to online if error to not block support
      setIsOnline(true);
    } finally {
      setCheckingStatus(false);
    }
  };

  const checkActiveTicket = async () => {
    if (!user) return;
    // Find most recent open ticket
    const { data } = await supabase
      .from("support_tickets")
      .select("id")
      .eq("user_id", user.id)
      .neq("status", "closed")
      .neq("status", "resolved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setTicketId(data.id);
      loadMessages(data.id);
    }
  };

  const loadMessages = async (tid: string) => {
    const { data } = await supabase
      .from("support_ticket_messages")
      .select("*")
      .eq("ticket_id", tid)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(
        data.map((m: any) => ({
          id: m.id,
          content: m.mensagem,
          sender:
            m.sender_type === "agent"
              ? "agent"
              : m.sender_type === "bot"
                ? "bot"
                : "user",
          created_at: m.created_at,
        })),
      );
    }
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let ticket;

      if (user) {
        // Logged in user - use direct insert
        const { data, error } = await (supabase as any)
          .from("support_tickets")
          .insert({
            title: "Chat Support",
            description: "Chat started via widget",
            status: "open",
            priority: "medium",
            origem: "widget",
            user_id: user.id,
            tenant_id: profile?.tenant_id || null,
          })
          .select()
          .single();

        if (error) throw error;
        ticket = data;
      } else {
        // Guest - use RPC to bypass RLS select issues
        const { data, error } = await supabase.rpc("create_guest_ticket", {
          p_name: guestName,
          p_email: guestEmail,
          p_title: "Chat Support (Guest)",
          p_description: "Chat started via widget",
        });

        if (error) throw error;
        // RPC returns jsonb, so we cast it
        ticket = data as any;
      }

      setTicketId(ticket.id);
      if (!user) {
        localStorage.setItem("cleanflow_guest_ticket", ticket.id);
      }

      const protocol = ticket.id.slice(0, 8).toUpperCase();

      const hour = new Date().getHours();
      let greeting = "Olá";
      if (hour < 12) greeting = "Bom dia";
      else if (hour < 18) greeting = "Boa tarde";
      else greeting = "Boa noite";

      const welcomeMsg = isOnline
        ? `${greeting}, ${user ? profile?.nome : guestName}! Sou o assistente virtual do CleanFlow. Seu protocolo de atendimento é #${protocol}. Como posso ajudar você hoje?`
        : `${greeting}, ${user ? profile?.nome : guestName}. Sou o assistente virtual do CleanFlow. Seu protocolo de atendimento é #${protocol}. Estamos fora do horário de atendimento no momento, mas posso tentar tirar suas dúvidas!`;

      // Save welcome message to database
      await supabase.from("support_ticket_messages").insert({
        ticket_id: ticket.id,
        mensagem: welcomeMsg,
        sender_type: "bot",
      });

      // Add welcome message to state
      setMessages([
        {
          id: "welcome",
          content: welcomeMsg,
          sender: "bot",
          created_at: new Date().toISOString(),
        },
      ]);

      setStep("chat");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao iniciar chat");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !ticketId) return;

    const msgContent = newMessage;
    setNewMessage("");

    // Optimistic update
    const tempId = Math.random().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        content: msgContent,
        sender: "user",
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      // Save user message
      await supabase.from("support_ticket_messages").insert({
        ticket_id: ticketId,
        mensagem: msgContent,
        user_id: user?.id || null,
        sender_type: "user",
      });

      // Try bot response
      const { data: botResponse } = await (supabase as any).rpc(
        "search_knowledge_base",
        { search_query: msgContent },
      );

      const threshold = 0.6; // Stricter threshold

      if (
        botResponse &&
        botResponse.length > 0 &&
        botResponse[0].similarity > threshold
      ) {
        const answer = botResponse[0].answer;

        // Add bot delay for realism
        setTimeout(async () => {
          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              content: answer,
              sender: "bot",
              created_at: new Date().toISOString(),
            },
          ]);

          await supabase.from("support_ticket_messages").insert({
            ticket_id: ticketId,
            mensagem: answer,
            sender_type: "bot",
          });
        }, 1000);
      } else {
        // Fallback: Bot doesn't know
        // 1. Log for training
        await (supabase as any).rpc("log_unanswered_question", {
          p_question: msgContent,
          p_ticket_id: ticketId,
        });

        const fallbackMsg =
          "Desculpe, não consegui encontrar uma resposta precisa para sua dúvida. \n\nO assunto exige intervenção humana. Um ticket de atendimento foi aberto e nossa equipe de suporte retornará via e-mail em breve.";
        const followUpMsg =
          "Agradecemos pelo contato! Continuo à disposição caso precise de ajuda com outros assuntos.";

        setTimeout(async () => {
          // First message
          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              content: fallbackMsg,
              sender: "bot",
              created_at: new Date().toISOString(),
            },
          ]);

          await supabase.from("support_ticket_messages").insert({
            ticket_id: ticketId,
            mensagem: fallbackMsg,
            sender_type: "bot",
          });

          // Second message (Follow up)
          setTimeout(async () => {
            setMessages((prev) => [
              ...prev,
              {
                id: Math.random().toString(),
                content: followUpMsg,
                sender: "bot",
                created_at: new Date().toISOString(),
              },
            ]);

            await supabase.from("support_ticket_messages").insert({
              ticket_id: ticketId,
              mensagem: followUpMsg,
              sender_type: "bot",
            });
          }, 1500);
        }, 1000);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleReset = () => {
    setTicketId(null);
    setMessages([]);
    setStep("initial");
    localStorage.removeItem("cleanflow_guest_ticket");
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-4">
      {isOpen && (
        <Card className="w-[350px] h-[500px] shadow-2xl border-blue-500/20 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
          <CardHeader
            className={`p-4 shrink-0 flex flex-row items-center justify-between transition-colors ${
              isOnline
                ? "bg-gradient-to-r from-blue-600 to-cyan-600"
                : "bg-slate-700"
            } text-white`}
          >
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Suporte CleanFlow
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
                />
                <p className="text-xs text-blue-100 opacity-90">
                  {checkingStatus
                    ? "Verificando..."
                    : isOnline
                      ? "Online agora"
                      : "Fora do horário"}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {step === "chat" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={handleReset}
                  title="Nova Conversa"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
            {step === "initial" ? (
              <div className="p-6 flex flex-col h-full justify-center space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto text-blue-600">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold">
                    Olá! Como podemos te chamar?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Preencha seus dados para iniciarmos o atendimento.
                  </p>
                </div>

                <form onSubmit={handleStartChat} className="space-y-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Seu nome"
                        className="pl-9"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="Seu e-mail"
                        className="pl-9"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Iniciar Chat"
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              <>
                <div
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                  ref={scrollRef}
                >
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} `}
                    >
                      <div className={`flex flex-col gap-1 max-w-[80%]`}>
                        {msg.sender === "bot" && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Bot className="h-3 w-3" /> CleanBot
                          </span>
                        )}
                        <div
                          className={`rounded-2xl px-4 py-2 text-xs ${
                            msg.sender === "user"
                              ? "bg-blue-600 text-white rounded-tr-none"
                              : msg.sender === "bot"
                                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 rounded-tl-none border border-purple-200 dark:border-purple-800"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground text-xs py-8">
                      Nenhuma mensagem ainda.
                    </div>
                  )}
                </div>
                <div className="p-3 border-t bg-white dark:bg-slate-950">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 text-xs"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 group relative z-40"
        aria-label="Abrir chat de suporte"
      >
        {/* Animação de pulso (Halo) */}
        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20" />

        {isOpen ? (
          <X className="h-8 w-8 text-white relative z-10" />
        ) : (
          <MessageCircle className="h-8 w-8 text-white relative z-10" />
        )}

        {/* Status indicator dot (optional, keeping it small if needed, or relying on the green button) */}
        {isOnline && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full z-20" />
        )}
      </button>
    </div>
  );
}
