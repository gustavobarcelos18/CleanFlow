import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertTriangle, TrendingUp, CheckCircle, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendamentoRisco {
  id: string;
  inicio: string;
  paciente: { nome: string; telefone: string };
  servico: { nome: string };
  score: number;
  acoes_tomadas: string[];
}

export function RiscoNoShowDashboard() {
  const [agendamentosRisco, setAgendamentosRisco] = useState<AgendamentoRisco[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculando, setCalculando] = useState<string | null>(null);

  const loadAgendamentosRisco = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .single();

      if (!profile?.tenant_id) return;

      // Buscar agendamentos com alto risco
      const { data, error } = await supabase
        .from("risco_no_show_scores" as any)
        .select(`
          *,
          agenda!inner(
            id,
            inicio,
            pacientes(nome, telefone),
            procedimentos:servico_id(nome)
          )
        `)
        .eq("tenant_id", profile.tenant_id)
        .gte("score", 60)
        .order("score", { ascending: false })
        .limit(20);

      if (error) throw error;

      const formatted = (data as any[] || []).map((item: any) => ({
        id: item.agendamento_id,
        inicio: item.agenda.inicio,
        paciente: item.agenda.pacientes,
        servico: item.agenda.servicos,
        score: item.score,
        acoes_tomadas: item.acoes_tomadas || []
      }));

      setAgendamentosRisco(formatted);
    } catch (error) {
      console.error("Erro ao carregar agendamentos de risco:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgendamentosRisco();
  }, []);

  const calcularRisco = async (agendamentoId: string) => {
    setCalculando(agendamentoId);
    try {
      const { error } = await supabase.functions.invoke("calcular-risco-no-show", {
        body: { agendamento_id: agendamentoId }
      });

      if (error) throw error;
      
      toast.success("Score recalculado e ações tomadas!");
      loadAgendamentosRisco();
    } catch (error) {
      console.error("Erro ao calcular risco:", error);
      toast.error("Erro ao calcular risco");
    } finally {
      setCalculando(null);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 85) {
      return <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Crítico ({score})
      </Badge>;
    }
    if (score >= 70) {
      return <Badge variant="default" className="gap-1 bg-orange-500">
        <TrendingUp className="h-3 w-3" />
        Alto ({score})
      </Badge>;
    }
    return <Badge variant="secondary" className="gap-1">
      Moderado ({score})
    </Badge>;
  };

  const getAcaoLabel = (acao: string) => {
    const labels: Record<string, string> = {
      lembrete_extra: "Lembrete Extra Enviado",
      oferta_rota: "Rota Google Maps Enviada"
    };
    return labels[acao] || acao;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Risco de No-Show</h2>
        <p className="text-muted-foreground">
          Monitore agendamentos com alta probabilidade de falta e tome ações preventivas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alto Risco (≥70)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">
              {agendamentosRisco.filter(a => a.score >= 70 && a.score < 85).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Crítico (≥85)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {agendamentosRisco.filter(a => a.score >= 85).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Com Ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-3xl font-bold">
                {agendamentosRisco.filter(a => a.acoes_tomadas?.length > 0).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Carregando agendamentos...
          </CardContent>
        </Card>
      ) : agendamentosRisco.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum agendamento de risco no momento
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {agendamentosRisco.map((agendamento) => (
            <Card key={agendamento.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      {getScoreBadge(agendamento.score)}
                      <span className="font-medium">{agendamento.paciente?.nome}</span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(agendamento.inicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                      <div>{agendamento.servico?.nome}</div>
                    </div>

                    {agendamento.acoes_tomadas && agendamento.acoes_tomadas.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {agendamento.acoes_tomadas.map((acao, idx) => (
                          <Badge key={idx} variant="outline" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {getAcaoLabel(acao)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => calcularRisco(agendamento.id)}
                    disabled={calculando === agendamento.id}
                  >
                    {calculando === agendamento.id ? "Calculando..." : "Recalcular"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
