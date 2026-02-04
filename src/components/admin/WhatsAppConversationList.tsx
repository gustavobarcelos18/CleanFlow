import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Phone, Clock, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Conversation {
  id: string;
  telefone: string;
  paciente_nome?: string;
  status: string;
  ultima_mensagem?: string;
  ultima_mensagem_em?: string;
  mensagens_nao_lidas?: number;
  created_at: string;
}

interface WhatsAppConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelectConversation: (conversationId: string) => void;
  onTakeConversation?: (conversationId: string) => void;
}

export function WhatsAppConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onTakeConversation,
}: WhatsAppConversationListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredConversations = conversations.filter((conv) => {
    if (statusFilter === "all") return true;
    return conv.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      aguardando: { variant: "default", label: "Aguardando" },
      em_atendimento: { variant: "secondary", label: "Em Atendimento" },
      resolvido: { variant: "outline", label: "Resolvido" },
    };

    const config = variants[status] || { variant: "outline", label: status };
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold mb-3">Conversas WhatsApp</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
          >
            Todas
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "aguardando" ? "default" : "outline"}
            onClick={() => setStatusFilter("aguardando")}
          >
            Aguardando
          </Button>
          <Button
            size="sm"
            variant={statusFilter === "em_atendimento" ? "default" : "outline"}
            onClick={() => setStatusFilter("em_atendimento")}
          >
            Ativas
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {filteredConversations.map((conversation) => (
            <Card
              key={conversation.id}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedConversationId === conversation.id
                  ? "border-primary bg-accent"
                  : ""
              }`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {conversation.paciente_nome || conversation.telefone}
                    </p>
                    {conversation.paciente_nome && (
                      <p className="text-xs text-muted-foreground">
                        {conversation.telefone}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(conversation.status)}
              </div>

              {conversation.ultima_mensagem && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {conversation.ultima_mensagem}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {conversation.ultima_mensagem_em
                    ? formatDistanceToNow(new Date(conversation.ultima_mensagem_em), {
                        addSuffix: true,
                        locale: ptBR,
                      })
                    : formatDistanceToNow(new Date(conversation.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                </div>
                {conversation.mensagens_nao_lidas > 0 && (
                  <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center">
                    {conversation.mensagens_nao_lidas}
                  </Badge>
                )}
              </div>

              {conversation.status === "aguardando" && onTakeConversation && (
                <Button
                  size="sm"
                  className="w-full mt-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTakeConversation(conversation.id);
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Assumir Conversa
                </Button>
              )}
            </Card>
          ))}

          {filteredConversations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma conversa encontrada</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
