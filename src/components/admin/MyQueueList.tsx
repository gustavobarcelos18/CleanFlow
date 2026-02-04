import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface QueueTicket {
  id: string;
  numero: number;
  title: string;
  priority: string;
  sla: any;
  created_at: string;
  tenant_id: string;
  tenants?: {
    nome: string;
  };
}

export const MyQueueList = () => {
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyQueue();
  }, []);

  const loadMyQueue = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('support_tickets')
        .select('*, tenants(nome)')
        .eq('assigned_to', user.id)
        .in('status', ['open', 'in_progress'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Sort by SLA urgency
      const sorted = (data || []).sort((a, b) => {
        const getSLAUrgency = (ticket: any) => {
          const sla = ticket.sla;
          if (!sla?.limite) return Infinity;
          const limite = new Date(sla.limite);
          return limite.getTime() - Date.now();
        };

        return getSLAUrgency(a) - getSLAUrgency(b);
      });

      setTickets(sorted as QueueTicket[]);
    } catch (error) {
      console.error('Error loading queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSLAStatus = (ticket: QueueTicket) => {
    const sla = ticket.sla;
    if (!sla?.limite) return null;

    const limite = new Date(sla.limite);
    const now = new Date();
    const hoursUntilDeadline = (limite.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDeadline <= 0) {
      return { status: 'breached', label: 'SLA Estourado', color: 'destructive' };
    } else if (hoursUntilDeadline <= 2) {
      return { status: 'critical', label: 'SLA Crítico', color: 'destructive' };
    } else if (hoursUntilDeadline <= 8) {
      return { status: 'warning', label: 'SLA em Risco', color: 'warning' };
    }

    return null;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'warning';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Minha Fila</h3>
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Minha Fila</h3>
        <Badge variant="secondary">{tickets.length} tickets</Badge>
      </div>

      {tickets.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Nenhum ticket atribuído a você
        </p>
      ) : (
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const slaStatus = getSLAStatus(ticket);
              
              return (
                <Card
                  key={ticket.id}
                  className="p-4 hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-muted-foreground">
                          #{ticket.numero}
                        </span>
                        <Badge variant={getPriorityColor(ticket.priority) as any}>
                          {ticket.priority}
                        </Badge>
                        {slaStatus && (
                          <Badge variant={slaStatus.color as any} className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {slaStatus.label}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium line-clamp-1">{ticket.title}</h4>
                      {ticket.tenants && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {ticket.tenants.nome}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(ticket.created_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
};
