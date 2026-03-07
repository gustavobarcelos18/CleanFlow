import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AnonymizationRequest {
  id: string;
  tenant_id: string;
  contact_type: "paciente" | "usuario" | "tenant_contato";
  contact_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
}

interface Patient {
  id: string;
  nome: string;
  email: string | null;
}

export const AnonymizationManager = () => {
  const [requests, setRequests] = useState<AnonymizationRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [tenantId, setTenantId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadPatients = useCallback(
    async (tid: string) => {
      try {
        const { data, error } = await supabase
          .from("pacientes")
          .select("id, nome, email")
          .eq("tenant_id", tid)
          .order("nome");

        if (error) throw error;
        setPatients(data || []);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erro desconhecido";
        toast({
          title: "Erro ao carregar pacientes",
          description: message,
          variant: "destructive",
        });
      }
    },
    [toast],
  );

  const loadTenantInfo = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.tenant_id) {
        setTenantId(profile.tenant_id);
        loadPatients(profile.tenant_id);
      }
    } catch (error) {
      console.error("Erro ao carregar tenant:", error);
    }
  }, [loadPatients]);

  const loadRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("anonymization_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests((data || []) as AnonymizationRequest[]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao carregar solicitações",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadRequests();
    loadTenantInfo();
  }, [loadRequests, loadTenantInfo]);

  const handleCreateRequest = async () => {
    if (!selectedPatient || !tenantId) {
      toast({
        title: "Erro",
        description: "Selecione um paciente",
        variant: "destructive",
      });
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("anonymization_requests").insert({
        tenant_id: tenantId,
        contact_type: "paciente",
        contact_id: selectedPatient,
        requested_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Solicitação criada",
        description: "A solicitação de anonimização foi criada com sucesso",
      });

      setIsDialogOpen(false);
      setSelectedPatient("");
      loadRequests();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao criar solicitação",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleProcessRequest = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc("anonymize_contact_data", {
        p_request_id: requestId,
      });

      if (error) throw error;

      toast({
        title: "Dados anonimizados",
        description: "Os dados foram anonimizados com sucesso",
      });

      loadRequests();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao anonimizar",
        description: message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "processing":
        return (
          <Badge>
            <Clock className="h-3 w-3 mr-1" />
            Processando
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Concluído
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Falhou
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return <div className="p-4">Carregando solicitações...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <div>
              <CardTitle>Anonimização de Dados (LGPD)</CardTitle>
              <CardDescription>
                Gerenciar solicitações de anonimização de dados pessoais
              </CardDescription>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Trash2 className="h-4 w-4 mr-2" />
                Nova Solicitação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Solicitar Anonimização</DialogTitle>
                <DialogDescription>
                  Selecione o paciente cujos dados deseja anonimizar. Esta ação
                  não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Select
                  value={selectedPatient}
                  onValueChange={setSelectedPatient}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.nome}{" "}
                        {patient.email ? `(${patient.email})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateRequest} variant="destructive">
                  Criar Solicitação
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhuma solicitação de anonimização
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead>Processado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Badge variant="outline">{request.contact_type}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(request.created_at).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {request.processed_at
                      ? new Date(request.processed_at).toLocaleString("pt-BR")
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {request.status === "pending" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Processar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Confirmar anonimização
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação é irreversível. Os dados pessoais serão
                              permanentemente anonimizados. Deseja continuar?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleProcessRequest(request.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Anonimizar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    {request.status === "failed" && request.error_message && (
                      <span className="text-xs text-destructive">
                        {request.error_message}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
