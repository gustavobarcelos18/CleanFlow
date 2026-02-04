import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function OfertasVagaMonitor() {
  const [ofertas, setOfertas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOfertas();
    
    // Atualizar em tempo real
    const channel = supabase
      .channel('ofertas_vaga_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ofertas_vaga'
        },
        () => loadOfertas()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOfertas = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.tenant_id) return;

      const { data } = await supabase
        .from("ofertas_vaga" as any)
        .select("*, pacientes(nome, telefone)")
        .eq("tenant_id", profile.tenant_id)
        .order("enviado_em", { ascending: false })
        .limit(50);

      if (data) setOfertas(data);
    } catch (error) {
      console.error("Erro ao carregar ofertas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: any; icon: any }> = {
      pendente: { label: "Pendente", variant: "default", icon: Clock },
      aceito: { label: "Aceito ✓", variant: "default", icon: CheckCircle },
      recusado: { label: "Recusado", variant: "secondary", icon: XCircle },
      expirado: { label: "Expirado", variant: "outline", icon: AlertCircle },
      preenchido_outro: { label: "Preenchido", variant: "outline", icon: CheckCircle },
    };

    const { label, variant, icon: Icon } = config[status] || config.pendente;

    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const getTempoRestante = (expiraEm: string) => {
    const expira = new Date(expiraEm);
    const agora = new Date();
    const diff = expira.getTime() - agora.getTime();
    
    if (diff <= 0) return "Expirado";
    
    const minutos = Math.floor(diff / 60000);
    return `${minutos} min restantes`;
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <CardTitle>Monitor de Ofertas em Tempo Real</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Data/Hora Oferecida</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enviado</TableHead>
              <TableHead>Tempo Restante</TableHead>
              <TableHead>Resposta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ofertas.map((oferta) => (
              <TableRow key={oferta.id}>
                <TableCell className="font-medium">
                  {oferta.pacientes?.nome}
                </TableCell>
                <TableCell>{oferta.pacientes?.telefone}</TableCell>
                <TableCell>
                  {new Date(oferta.data_hora_oferecida).toLocaleString('pt-BR')}
                </TableCell>
                <TableCell>{getStatusBadge(oferta.status)}</TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(oferta.enviado_em), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell>
                  {oferta.status === 'pendente' ? (
                    <span className="text-sm text-orange-600 font-medium">
                      {getTempoRestante(oferta.expira_em)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {oferta.respondido_em ? (
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(oferta.respondido_em), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Aguardando...</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {ofertas.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma oferta no momento
          </div>
        )}
      </CardContent>
    </Card>
  );
}
