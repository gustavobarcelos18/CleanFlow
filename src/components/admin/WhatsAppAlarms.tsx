import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Bell, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WhatsAppAlarm {
  id: string;
  tenant_id: string | null;
  alarm_type: string;
  threshold_value: number;
  current_value: number;
  status: 'active' | 'acknowledged' | 'resolved';
  triggered_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  message: string;
  severity: 'warning' | 'error' | 'critical';
  metadata: any;
}

export function WhatsAppAlarms() {
  const [alarms, setAlarms] = useState<WhatsAppAlarm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlarms();
    // Atualizar a cada 15 segundos
    const interval = setInterval(loadAlarms, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadAlarms = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_alarms' as any)
        .select('*')
        .order('triggered_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAlarms(data as any || []);
    } catch (error: any) {
      console.error('Error loading alarms:', error);
      toast.error('Erro ao carregar alarmes');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alarmId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: supportUser } = await supabase
        .from('usuarios_suporte' as any)
        .select('id')
        .eq('auth_user_id', user.id)
        .single() as any;

      const { error } = await supabase
        .from('whatsapp_alarms' as any)
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: supportUser?.id
        })
        .eq('id', alarmId);

      if (error) throw error;
      
      toast.success('Alarme reconhecido');
      loadAlarms();
    } catch (error: any) {
      console.error('Error acknowledging alarm:', error);
      toast.error('Erro ao reconhecer alarme');
    }
  };

  const handleResolve = async (alarmId: string) => {
    try {
      const { error } = await supabase
        .from('whatsapp_alarms' as any)
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alarmId);

      if (error) throw error;
      
      toast.success('Alarme resolvido');
      loadAlarms();
    } catch (error: any) {
      console.error('Error resolving alarm:', error);
      toast.error('Erro ao resolver alarme');
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      warning: 'secondary',
      error: 'destructive',
      critical: 'destructive'
    };
    
    const icons = {
      warning: AlertTriangle,
      error: XCircle,
      critical: Bell
    };

    const Icon = icons[severity as keyof typeof icons];
    
    return (
      <Badge variant={variants[severity as keyof typeof variants] as any} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'destructive',
      acknowledged: 'secondary',
      resolved: 'default'
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status === 'active' && 'Ativo'}
        {status === 'acknowledged' && 'Reconhecido'}
        {status === 'resolved' && 'Resolvido'}
      </Badge>
    );
  };

  const getAlarmTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      error_rate: 'Taxa de Erro',
      template_rejection: 'Rejeição de Template',
      quality_rating: 'Quality Rating',
      rate_limit: 'Rate Limit',
      delivery_failure: 'Falha de Entrega'
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div>Carregando alarmes...</div>;
  }

  const activeAlarms = alarms.filter(a => a.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alarmes Ativos</CardTitle>
            <Bell className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlarms}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reconhecidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alarms.filter(a => a.status === 'acknowledged').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos (24h)</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alarms.filter(a => a.status === 'resolved').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Alarmes</CardTitle>
          <CardDescription>Monitoramento em tempo real de alarmes do WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Disparado</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alarms.map((alarm) => (
                <TableRow key={alarm.id}>
                  <TableCell>{getAlarmTypeLabel(alarm.alarm_type)}</TableCell>
                  <TableCell className="max-w-xs">
                    <div>{alarm.message}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Limite: {alarm.threshold_value} | Atual: {alarm.current_value}
                    </div>
                  </TableCell>
                  <TableCell>{getSeverityBadge(alarm.severity)}</TableCell>
                  <TableCell>{getStatusBadge(alarm.status)}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(alarm.triggered_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {alarm.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAcknowledge(alarm.id)}
                        >
                          Reconhecer
                        </Button>
                      )}
                      {alarm.status !== 'resolved' && (
                        <Button
                          size="sm"
                          onClick={() => handleResolve(alarm.id)}
                        >
                          Resolver
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
