import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Send, FileText, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { SLAIndicator } from "./SLAIndicator";

interface Message {
  id: string;
  user_id: string;
  sender_type: string;
  mensagem: string;
  is_internal: boolean;
  created_at: string;
}

interface Macro {
  id: string;
  nome: string;
  conteudo: string;
  categoria: string;
}

interface TicketChatProps {
  ticket: any;
  onBack: () => void;
  onStatusUpdate: (status: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed") => void;
}

export const TicketChat = ({ ticket, onBack, onStatusUpdate }: TicketChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState<string[]>(ticket.tags || []);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [agentProfile, setAgentProfile] = useState<any>(null);
  const [customerProfile, setCustomerProfile] = useState<any>(null);

  useEffect(() => {
    loadMessages();
    loadMacros();
    loadProfiles();
    subscribeToMessages();
  }, [ticket.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadProfiles = async () => {
    try {
      // Load agent profile (current user)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: agent } = await (supabase as any)
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setAgentProfile(agent);
      }

      // Load customer profile if ticket has user_id
      if (ticket.user_id) {
        const { data: customer } = await (supabase as any)
          .from("profiles")
          .select("*")
          .eq("id", ticket.user_id)
          .single();
        setCustomerProfile(customer);
      }
    } catch (error) {
      console.error("Error loading profiles:", error);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("support_ticket_messages")
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const loadMacros = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("support_ticket_macros")
        .select("*")
        .eq("ativo", true)
        .order("categoria", { ascending: true });

      if (error) throw error;
      setMacros(data || []);
    } catch (error) {
      console.error("Error loading macros:", error);
    }
  };

  const subscribeToMessages = () => {
    const channel = (supabase as any)
      .channel(`ticket_messages_${ticket.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_ticket_messages", filter: `ticket_id=eq.${ticket.id}` },
        (payload: any) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { data: { user } } = await (supabase as any).auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (supabase as any).from("support_ticket_messages").insert({
        ticket_id: ticket.id,
        user_id: user.id,
        sender_type: "agent",
        mensagem: newMessage,
        is_internal: isInternal,
      });

      if (error) throw error;

      await (supabase as any).from("support_actions_log").insert({
        support_user_id: user.id,
        action_type: "message_sent",
        target_type: "ticket",
        target_id: ticket.id,
        description: `Mensagem ${isInternal ? 'interna' : 'pública'} enviada`,
        metadata: { is_internal: isInternal }
      });

      setNewMessage("");
      setIsInternal(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  const applyMacro = (macro: Macro) => {
    let content = macro.conteudo;

    // Variables data
    const ticketNumber = ticket.numero?.toString() || ticket.id.slice(0, 8);
    const customerName = customerProfile?.nome || ticket.guest_name || "Cliente";
    const customerEmail = customerProfile?.email || ticket.guest_email || "Email não disponível";
    const customerPhone = customerProfile?.telefone || ticket.guest_phone || "Telefone não disponível";
    const agentName = agentProfile?.nome || "Agente";
    const agentEmail = agentProfile?.email || "Email não disponível";

    // Date formatting
    const createdDate = new Date(ticket.created_at).toLocaleDateString('pt-BR');
    const currentDate = new Date().toLocaleDateString('pt-BR');

    // Greeting logic
    const hour = new Date().getHours();
    let greeting = "Bom dia";
    if (hour >= 12 && hour < 18) greeting = "Boa tarde";
    if (hour >= 18) greeting = "Boa noite";

    // Substitutions
    content = content.replace(/\{\{numero_ticket\}\}/g, ticketNumber);
    content = content.replace(/\{\{titulo_ticket\}\}/g, ticket.titulo);
    content = content.replace(/\{\{descricao_ticket\}\}/g, ticket.descricao || "");
    content = content.replace(/\{\{prioridade\}\}/g, ticket.prioridade);
    content = content.replace(/\{\{status\}\}/g, ticket.status);
    content = content.replace(/\{\{data_criacao\}\}/g, createdDate);

    content = content.replace(/\{\{nome_cliente\}\}/g, customerName);
    content = content.replace(/\{\{email_cliente\}\}/g, customerEmail);
    content = content.replace(/\{\{telefone_cliente\}\}/g, customerPhone);

    content = content.replace(/\{\{nome_agente\}\}/g, agentName);
    content = content.replace(/\{\{email_agente\}\}/g, agentEmail);
    content = content.replace(/\{\{saudacao_horario\}\}/g, greeting);
    content = content.replace(/\{\{data_atual\}\}/g, currentDate);

    setNewMessage(content);
    toast.success(`Macro "${macro.nome}" aplicada`);
  };

  const addTag = async () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;

    const updatedTags = [...tags, newTag.trim()];

    try {
      const { error } = await (supabase as any)
        .from("support_tickets")
        .update({ tags: updatedTags as any })
        .eq("id", ticket.id);

      if (error) throw error;

      setTags(updatedTags);
      setNewTag("");
      toast.success("Tag adicionada");
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("Erro ao adicionar tag");
    }
  };

  const removeTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter(t => t !== tagToRemove);

    try {
      const { error } = await (supabase as any)
        .from("support_tickets")
        .update({ tags: updatedTags as any })
        .eq("id", ticket.id);

      if (error) throw error;

      setTags(updatedTags);
      toast.success("Tag removida");
    } catch (error) {
      console.error("Error removing tag:", error);
      toast.error("Erro ao remover tag");
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-start gap-4 flex-1">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-bold">{ticket.titulo}</h2>
              <Badge variant="outline">#{ticket.numero || ticket.id.slice(0, 8)}</Badge>
              <SLAIndicator sla={ticket.sla || {}} status={ticket.status} />
            </div>
            <p className="text-sm text-muted-foreground mb-3">{ticket.descricao}</p>

            {/* Tags */}
            <div className="flex items-center gap-2 flex-wrap">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  <Tag className="h-3 w-3" />
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Tag className="h-3 w-3 mr-1" />
                    Adicionar Tag
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nova tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button size="sm" onClick={addTag}>
                      Adicionar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <Select value={ticket.status} onValueChange={onStatusUpdate}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="in_progress">Em Progresso</SelectItem>
            <SelectItem value="waiting_customer">Aguardando Cliente</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
            <SelectItem value="closed">Fechado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 mb-6 h-96 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_type === "agent" || msg.sender_type === "support" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[70%] rounded-lg p-3 ${msg.sender_type === "agent" || msg.sender_type === "support"
              ? msg.is_internal
                ? "bg-yellow-100 dark:bg-yellow-900/30"
                : "bg-primary text-primary-foreground"
              : "bg-muted"
              }`}>
              {msg.is_internal && (
                <p className="text-xs font-semibold mb-1">Nota Interna</p>
              )}
              <p className="text-sm">{msg.mensagem}</p>
              <p className="text-xs opacity-70 mt-1">
                {new Date(msg.created_at).toLocaleTimeString("pt-BR")}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="internal"
                checked={isInternal}
                onCheckedChange={(checked) => setIsInternal(checked as boolean)}
              />
              <label htmlFor="internal" className="text-sm cursor-pointer">
                Nota interna (visível apenas para a equipe)
              </label>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Usar Macro
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  <h4 className="font-semibold mb-3">Selecione uma macro</h4>
                  {macros.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma macro disponível</p>
                  ) : (
                    macros.map((macro) => (
                      <button
                        key={macro.id}
                        onClick={() => applyMacro(macro)}
                        className="w-full text-left p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <div className="font-medium text-sm">{macro.nome}</div>
                        {macro.categoria && (
                          <div className="text-xs text-muted-foreground">{macro.categoria}</div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex gap-2">
          <Textarea
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-1"
            rows={4}
          />
          <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
