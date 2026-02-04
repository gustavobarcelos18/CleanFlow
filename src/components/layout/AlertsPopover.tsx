import React, { useState, useEffect } from "react";
import { Bell, CheckCheck, AlertCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Alert {
  id: string;
  tipo: string;
  prioridade: string;
  titulo: string;
  descricao: string;
  created_at: string;
  lido: boolean;
  paciente_id: string;
  agendamento_id: string | null;
}

export function AlertsPopover() {
  const { profile } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchAlerts();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('alertas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alertas_risco',
          filter: `tenant_id=eq.${profile?.tenant_id}`
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.tenant_id]);

  const fetchAlerts = async () => {
    if (!profile?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('alertas_risco')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('resolvido', false)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setAlerts(data || []);
      setUnreadCount(data?.filter(a => !a.lido).length || 0);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alertas_risco')
        .update({
          lido: true,
          lido_em: new Date().toISOString(),
          lido_por: profile?.id
        })
        .eq('id', alertId);

      if (error) throw error;

      setAlerts(prev => 
        prev.map(a => a.id === alertId ? { ...a, lido: true } : a)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar o alerta como lido",
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    if (!profile?.tenant_id) return;

    try {
      const { error } = await supabase
        .from('alertas_risco')
        .update({
          lido: true,
          lido_em: new Date().toISOString(),
          lido_por: profile?.id
        })
        .eq('tenant_id', profile.tenant_id)
        .eq('lido', false)
        .eq('resolvido', false);

      if (error) throw error;

      setAlerts(prev => prev.map(a => ({ ...a, lido: true })));
      setUnreadCount(0);
      
      toast({
        title: "Sucesso",
        description: "Todos os alertas foram marcados como lidos"
      });
    } catch (error) {
      console.error('Erro ao marcar todos como lidos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar todos os alertas como lidos",
        variant: "destructive"
      });
    }
  };

  const getAlertIcon = (tipo: string) => {
    switch (tipo) {
      case 'risco_no_show':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'confirmacao_pendente':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'atraso':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta':
        return 'border-l-destructive bg-destructive-light';
      case 'media':
        return 'border-l-warning bg-warning-light';
      case 'baixa':
        return 'border-l-success bg-success-light';
      default:
        return 'border-l-muted';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-foreground">Alertas</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="h-8 text-xs"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Marcar todos como lidos
            </Button>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Nenhum alerta no momento
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border-l-4 transition-colors hover:bg-accent/50 ${
                    !alert.lido ? 'bg-accent/20' : ''
                  } ${getPriorityColor(alert.prioridade)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getAlertIcon(alert.tipo)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-medium text-foreground">
                          {alert.titulo}
                        </h4>
                        {!alert.lido && (
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            Novo
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.descricao}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(alert.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </span>
                        {!alert.lido && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(alert.id)}
                            className="h-6 text-xs"
                          >
                            Marcar como lido
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
