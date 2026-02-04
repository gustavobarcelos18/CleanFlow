import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertTriangle, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function CheckinWhatsAppManager() {
  const [checkins, setCheckins] = useState<any[]>([]);
  const [selectedCheckin, setSelectedCheckin] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCheckins();
  }, []);

  const loadCheckins = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.tenant_id) return;

      const { data } = await supabase
        .from("checkin_whatsapp" as any)
        .select(`
          *,
          pacientes(nome, telefone),
          agenda(inicio, procedimentos:servico_id(nome))
        `)
        .eq("tenant_id", profile.tenant_id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data) setCheckins(data);
    } catch (error) {
      console.error("Erro ao carregar check-ins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: any; icon: any }> = {
      iniciado: { label: "Iniciado", variant: "outline", icon: Clock },
      aguardando_dados: { label: "Aguardando", variant: "default", icon: Clock },
      completo: { label: "Completo ✓", variant: "default", icon: CheckCircle },
      incompleto: { label: "Incompleto", variant: "secondary", icon: AlertTriangle },
      erro: { label: "Erro", variant: "destructive", icon: AlertTriangle },
    };

    const { label, variant, icon: Icon } = config[status] || config.iniciado;

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            <CardTitle>Check-ins WhatsApp</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Consulta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Tentativas</TableHead>
                <TableHead>Pronto?</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {checkins.map((checkin) => (
                <TableRow key={checkin.id}>
                  <TableCell className="font-medium">
                    {checkin.pacientes?.nome}
                  </TableCell>
                  <TableCell>{checkin.agenda?.servicos?.nome}</TableCell>
                  <TableCell>
                    {new Date(checkin.agenda?.inicio).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell>{getStatusBadge(checkin.status)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground capitalize">
                      {checkin.etapa_atual}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{checkin.tentativas}</Badge>
                  </TableCell>
                  <TableCell>
                    {checkin.pronto_atendimento ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Sim
                      </Badge>
                    ) : (
                      <Badge variant="outline">Não</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedCheckin(checkin)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {checkins.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum check-in registrado
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCheckin && (
        <Dialog open={!!selectedCheckin} onOpenChange={() => setSelectedCheckin(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Check-in</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Paciente</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCheckin.pacientes?.nome}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Telefone</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCheckin.pacientes?.telefone}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Convênio</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCheckin.convenio || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Nº Carteirinha</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedCheckin.numero_carteirinha || "-"}
                  </p>
                </div>
              </div>

              {selectedCheckin.foto_frente_url && (
                <div>
                  <p className="text-sm font-medium mb-2">Foto Frente</p>
                  <img
                    src={selectedCheckin.foto_frente_url}
                    alt="Frente"
                    className="max-w-xs rounded border"
                  />
                </div>
              )}

              {selectedCheckin.foto_verso_url && (
                <div>
                  <p className="text-sm font-medium mb-2">Foto Verso</p>
                  <img
                    src={selectedCheckin.foto_verso_url}
                    alt="Verso"
                    className="max-w-xs rounded border"
                  />
                </div>
              )}

              <div>
                <p className="text-sm font-medium">Motivo da Consulta</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCheckin.motivo_consulta || "-"}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium">Consentimento LGPD</p>
                  <Badge variant={selectedCheckin.consentimento_lgpd ? "default" : "outline"}>
                    {selectedCheckin.consentimento_lgpd ? "Sim" : "Não"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Opt-in Lembretes</p>
                  <Badge variant={selectedCheckin.opt_in_lembretes ? "default" : "outline"}>
                    {selectedCheckin.opt_in_lembretes ? "Sim" : "Não"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Opt-in Promoções</p>
                  <Badge variant={selectedCheckin.opt_in_promocoes ? "default" : "outline"}>
                    {selectedCheckin.opt_in_promocoes ? "Sim" : "Não"}
                  </Badge>
                </div>
              </div>

              {selectedCheckin.ultimo_erro && (
                <div className="bg-destructive/10 p-3 rounded">
                  <p className="text-sm font-medium text-destructive">Último Erro</p>
                  <p className="text-sm text-destructive/80">
                    {selectedCheckin.ultimo_erro}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
