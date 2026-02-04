import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Search } from "lucide-react";

interface AuditLog {
  id: string;
  created_at: string;
  tipo_evento: string;
  descricao: string;
  usuario_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: any;
}

export const ActionLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventType, setEventType] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();
  }, [eventType]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('auditoria_admin')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventType !== 'all') {
        query = query.eq('tipo_evento', eventType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar logs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const csvContent = generateCSV();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      await supabase.rpc('registrar_exportacao', {
        p_user_id: user.id,
        p_export_type: 'audit_logs',
        p_table_name: 'auditoria_admin',
        p_filters: { event_type: eventType },
        p_record_count: logs.length,
        p_file_format: 'csv'
      });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `logs-auditoria-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast({
        title: "Logs exportados",
        description: "Arquivo CSV baixado com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao exportar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const generateCSV = () => {
    let csv = 'Data/Hora,Tipo de Evento,Descrição,IP\n';
    
    logs.forEach(log => {
      const date = new Date(log.created_at).toLocaleString('pt-BR');
      const descricao = (log.descricao || '').replace(/,/g, ';');
      const ip = log.ip_address || '-';
      
      csv += `${date},${log.tipo_evento},"${descricao}",${ip}\n`;
    });

    return csv;
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.tipo_evento.toLowerCase().includes(searchLower) ||
      log.descricao?.toLowerCase().includes(searchLower)
    );
  });

  const getEventBadgeVariant = (tipo: string): "default" | "destructive" | "secondary" | "outline" => {
    if (tipo.includes('delete') || tipo.includes('error') || tipo.includes('lock')) return 'destructive';
    if (tipo.includes('create') || tipo.includes('success')) return 'default';
    if (tipo.includes('update') || tipo.includes('change')) return 'secondary';
    return 'outline';
  };

  const eventTypes = [
    { value: 'all', label: 'Todos os Eventos' },
    { value: 'login', label: 'Login' },
    { value: 'logout', label: 'Logout' },
    { value: 'data_export', label: 'Exportação de Dados' },
    { value: 'user_create', label: 'Criação de Usuário' },
    { value: 'user_update', label: 'Atualização de Usuário' },
    { value: 'user_delete', label: 'Exclusão de Usuário' },
    { value: 'password_reset', label: 'Reset de Senha' },
    { value: 'permission_change', label: 'Mudança de Permissão' },
    { value: 'config_change', label: 'Mudança de Configuração' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria</CardTitle>
          <CardDescription>
            Registro completo de todas as ações administrativas do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar em logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={exportLogs} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>

          {/* Tabela */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getEventBadgeVariant(log.tipo_evento)}>
                          {log.tipo_evento}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {log.descricao}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.ip_address || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            Mostrando {filteredLogs.length} de {logs.length} registros
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
