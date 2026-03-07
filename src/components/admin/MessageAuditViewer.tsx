import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Search, Eye, Hash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MessageAudit {
  id: string;
  rota: string;
  actor_type: string;
  ip_address: string;
  timestamp: string;
  payload_hash: string;
  status: string;
  error_message: string | null;
}

export function MessageAuditViewer() {
  const [audits, setAudits] = useState<MessageAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAudit, setSelectedAudit] = useState<MessageAudit | null>(null);

  const loadAudits = useCallback(async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

      const { data, error } = await supabase
        .from("message_audit" as any)
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .order("timestamp", { ascending: false })
        .limit(100);

      if (error) throw error;
      setAudits((data as any) || []);
    } catch (error) {
      console.error("Erro ao carregar auditoria:", error);
      toast.error("Erro ao carregar auditoria de mensagens");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAudits();
  }, [loadAudits]);

  const handleReplay = useCallback(async (messageId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "replay-message",
        {
          body: { message_id: messageId },
        },
      );

      if (error) throw error;

      toast.success("Replay recuperado com sucesso");
      console.log("Replay data:", data);
    } catch (error) {
      console.error("Erro ao fazer replay:", error);
      toast.error("Erro ao fazer replay da mensagem");
    }
  }, []);

  const filteredAudits = audits.filter(
    (audit) =>
      audit.rota.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.actor_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.payload_hash.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-success">Enviado</Badge>;
      case "failed":
        return <Badge variant="destructive">Falhou</Badge>;
      case "pending":
        return <Badge variant="outline">Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div>Carregando auditoria...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            <CardTitle>Auditoria Detalhada de Mensagens</CardTitle>
          </div>
          <CardDescription>
            Rastreamento completo: rota, ator, IP, timestamp e hash do payload
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por rota, tipo de ator ou hash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Rota</TableHead>
                  <TableHead>Ator</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Hash</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-mono text-xs">
                      {new Date(audit.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium">{audit.rota}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{audit.actor_type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {audit.ip_address}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {audit.payload_hash.substring(0, 12)}...
                    </TableCell>
                    <TableCell>{getStatusBadge(audit.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAudit(audit)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog
        open={!!selectedAudit}
        onOpenChange={() => setSelectedAudit(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Auditoria</DialogTitle>
            <DialogDescription>
              Informações completas do registro de auditoria
            </DialogDescription>
          </DialogHeader>
          {selectedAudit && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Timestamp
                  </p>
                  <p className="font-mono text-sm">
                    {new Date(selectedAudit.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Status
                  </p>
                  {getStatusBadge(selectedAudit.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Rota
                  </p>
                  <p className="font-medium">{selectedAudit.rota}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Tipo de Ator
                  </p>
                  <Badge variant="outline">{selectedAudit.actor_type}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    IP Address
                  </p>
                  <p className="font-mono text-sm">
                    {selectedAudit.ip_address}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Payload Hash
                  </p>
                  <p className="font-mono text-xs break-all">
                    {selectedAudit.payload_hash}
                  </p>
                </div>
              </div>
              {selectedAudit.error_message && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Mensagem de Erro
                  </p>
                  <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
                    <p className="text-sm text-destructive">
                      {selectedAudit.error_message}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
