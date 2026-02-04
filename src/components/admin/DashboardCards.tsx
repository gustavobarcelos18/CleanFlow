import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { AlertTriangle, UserCheck, MessageSquare, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const DashboardCards = () => {
  const [stats, setStats] = useState({
    pendingActions: 0,
    myTickets: 0,
    waitingChats: 0,
    recentAlerts: 0
  });

  useEffect(() => {
    loadStats();

    const channel = supabase
      .channel('dashboard_cards_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => loadStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_chat_sessions' }, () => loadStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ações pendentes: tickets novos + pendente_cliente + SLAs em risco
      const { count: newTickets } = await supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open');

      // Tickets em risco de SLA
      const { data: ticketsAtRisk } = await supabase
        .from('support_tickets' as any)
        .select('id, sla')
        .in('status', ['open', 'in_progress']);

      const slaAtRisk = ticketsAtRisk?.filter((ticket: any) => {
        const sla = ticket.sla;
        if (!sla?.limite) return false;
        const limite = new Date(sla.limite);
        const now = new Date();
        const hoursUntilDeadline = (limite.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntilDeadline <= 2 && hoursUntilDeadline > 0;
      }).length || 0;

      const pendingActions = (newTickets || 0) + slaAtRisk;

      // Meus tickets
      const { count: myTickets } = await supabase
        .from('support_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', user.id)
        .in('status', ['open', 'in_progress']);

      // Chats aguardando
      const { count: waitingChats } = await supabase
        .from('support_chat_sessions' as any)
        .select('id', { count: 'exact', head: true })
        .eq('status', 'waiting');

      setStats({
        pendingActions,
        myTickets: myTickets || 0,
        waitingChats: waitingChats || 0,
        recentAlerts: 0 // Placeholder para alertas futuros
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const cards = [
    {
      title: "Ações Pendentes",
      value: stats.pendingActions,
      icon: AlertTriangle,
      description: "Tickets novos + SLAs em risco",
      color: "text-destructive"
    },
    {
      title: "Em Atendimento",
      value: stats.myTickets,
      icon: UserCheck,
      description: "Tickets atribuídos a mim",
      color: "text-primary"
    },
    {
      title: "Chats Aguardando",
      value: stats.waitingChats,
      icon: MessageSquare,
      description: "Fila atual de chats",
      color: "text-blue-500"
    },
    {
      title: "Alertas Recentes",
      value: stats.recentAlerts,
      icon: AlertCircle,
      description: "Falhas e erros recentes",
      color: "text-orange-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <Card key={card.title} className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                {card.value > 0 && card.title === "Ações Pendentes" && (
                  <Badge variant="destructive">Atenção</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </div>
            <card.icon className={`h-8 w-8 ${card.color} opacity-50`} />
          </div>
        </Card>
      ))}
    </div>
  );
};
