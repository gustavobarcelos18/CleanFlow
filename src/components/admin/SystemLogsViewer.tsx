import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, AlertCircle, Info, AlertTriangle, XCircle } from "lucide-react";

interface SystemLog {
  id: string;
  request_id: string;
  created_at: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context: any;
  status_code: number | null;
  duration_ms: number | null;
  service: string | null;
}

export const SystemLogsViewer = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadLogs();

    // Refresh a cada 10 segundos
    const interval = setInterval(loadLogs, 10000);
    return () => clearInterval(interval);
  }, [levelFilter]);

  const loadLogs = async () => {
    try {
      let query = supabase
        .from('system_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (levelFilter !== 'all') {
        query = query.eq('level', levelFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs((data || []) as SystemLog[]);
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

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'debug':
      case 'info':
        return <Info className="h-4 w-4" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
      case 'fatal':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getLevelVariant = (level: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (level) {
      case 'error':
      case 'fatal':
        return 'destructive';
      case 'warn':
        return 'outline';
      case 'info':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const filteredLogs = logs.filter(log =>
    log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.request_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.service && log.service.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs do Sistema</CardTitle>
        <CardDescription>Logs estruturados com request-id para rastreamento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Nível" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os níveis</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="fatal">Fatal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="h-[600px] w-full rounded-md border">
          <div className="space-y-2 p-4">
            {loading ? (
              <div className="text-center text-muted-foreground">Carregando logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center text-muted-foreground">Nenhum log encontrado</div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border p-3 space-y-2 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getLevelIcon(log.level)}
                      <Badge variant={getLevelVariant(log.level)}>
                        {log.level.toUpperCase()}
                      </Badge>
                      {log.service && (
                        <Badge variant="outline">{log.service}</Badge>
                      )}
                      {log.status_code && (
                        <Badge variant={log.status_code >= 400 ? 'destructive' : 'default'}>
                          {log.status_code}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </div>
                  </div>

                  <div className="text-sm">{log.message}</div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-mono">Request ID: {log.request_id.substring(0, 8)}...</span>
                    {log.duration_ms && (
                      <span>Duração: {log.duration_ms}ms</span>
                    )}
                  </div>

                  {log.context && Object.keys(log.context).length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                        Ver contexto
                      </summary>
                      <pre className="mt-2 rounded bg-muted p-2 overflow-auto">
                        {JSON.stringify(log.context, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
