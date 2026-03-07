import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketChat } from "./TicketChat";
import { SLAIndicator } from "./SLAIndicator";
import { MessageSquare, Search, Filter, Tag } from "lucide-react";
import { toast } from "sonner";

interface Ticket {
  id: string;
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  created_at: string;
  user_id: string;
  tenant_id: string;
  atribuido_a: string | null;
  numero?: number;
  origem?: string;
  tags?: string[];
  sla?: any;
}

interface TicketListProps {
  onStatsUpdate: () => void;
}

export const TicketList = ({ onStatsUpdate }: TicketListProps) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [origemFilter, setOrigemFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error("Error loading tickets:", error);
      toast.error("Erro ao carregar tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  const subscribeToTickets = useCallback(() => {
    const channel = supabase
      .channel("support_tickets_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => {
          loadTickets();
          onStatsUpdate();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadTickets, onStatsUpdate]);

  const filterTickets = useCallback(() => {
    let filtered = tickets;

    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (ticket.numero && ticket.numero.toString().includes(searchTerm)) ||
          (ticket.tags &&
            ticket.tags.some((tag) =>
              tag.toLowerCase().includes(searchTerm.toLowerCase()),
            )),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (ticket) => ticket.prioridade === priorityFilter,
      );
    }

    if (origemFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.origem === origemFilter);
    }

    setFilteredTickets(filtered);
  }, [searchTerm, statusFilter, priorityFilter, origemFilter, tickets]);

  useEffect(() => {
    loadTickets();
    const unsubscribe = subscribeToTickets();
    return () => {
      unsubscribe();
    };
  }, [loadTickets, subscribeToTickets]);

  useEffect(() => {
    filterTickets();
  }, [filterTickets]);

  const updateTicketStatus = async (
    ticketId: string,
    status: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed",
  ) => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status })
        .eq("id", ticketId);

      if (error) throw error;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("support_actions_log").insert({
          support_user_id: user.id,
          action_type: "status_change",
          target_type: "ticket",
          target_id: ticketId,
          description: `Status alterado para: ${status}`,
          metadata: {
            old_status: tickets.find((t) => t.id === ticketId)?.status,
            new_status: status,
          },
        });
      }

      toast.success("Status atualizado");
      loadTickets();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgente":
        return "destructive";
      case "alta":
        return "default";
      case "media":
        return "secondary";
      case "baixa":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "default";
      case "in_progress":
        return "secondary";
      case "waiting_customer":
        return "outline";
      case "resolved":
        return "secondary";
      case "closed":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (selectedTicket) {
    return (
      <TicketChat
        ticket={selectedTicket}
        onBack={() => setSelectedTicket(null)}
        onStatusUpdate={(status) =>
          updateTicketStatus(
            selectedTicket.id,
            status as
              | "open"
              | "in_progress"
              | "waiting_customer"
              | "resolved"
              | "closed",
          )
        }
      />
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tickets por título, descrição, número ou tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="open">Abertos</SelectItem>
                <SelectItem value="in_progress">Em Progresso</SelectItem>
                <SelectItem value="waiting_customer">
                  Aguardando Cliente
                </SelectItem>
                <SelectItem value="resolved">Resolvidos</SelectItem>
                <SelectItem value="closed">Fechados</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Prioridades</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>

            <Select value={origemFilter} onValueChange={setOrigemFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Origens</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-8 text-muted-foreground">
            Carregando...
          </p>
        ) : filteredTickets.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            Nenhum ticket encontrado
          </p>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <Card
                key={ticket.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline">
                        #{ticket.numero || ticket.id.slice(0, 8)}
                      </Badge>
                      <h3 className="font-semibold">{ticket.titulo}</h3>
                      <Badge variant={getPriorityColor(ticket.prioridade)}>
                        {ticket.prioridade}
                      </Badge>
                      <Badge variant={getStatusColor(ticket.status)}>
                        {ticket.status}
                      </Badge>
                      {ticket.origem && (
                        <Badge variant="secondary">{ticket.origem}</Badge>
                      )}
                      <SLAIndicator
                        sla={ticket.sla || {}}
                        status={ticket.status}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ticket.descricao}
                    </p>

                    {ticket.tags && ticket.tags.length > 0 && (
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {ticket.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                          >
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(ticket.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
