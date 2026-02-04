import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, CheckCircle, Users } from "lucide-react";

export function MetricasListaEspera() {
  const [metricas, setMetricas] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetricas();
  }, []);

  const loadMetricas = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.tenant_id) return;

      // Métricas do último mês
      const { data } = await supabase
        .from("metricas_lista_espera" as any)
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .gte("data", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("data", { ascending: false });

      if (data && data.length > 0) {
        // Calcular totais
        const totais = (data as any[]).reduce(
          (acc, m: any) => ({
            ofertas_enviadas: acc.ofertas_enviadas + (m.ofertas_enviadas || 0),
            ofertas_aceitas: acc.ofertas_aceitas + (m.ofertas_aceitas || 0),
            ofertas_recusadas: acc.ofertas_recusadas + (m.ofertas_recusadas || 0),
            ofertas_expiradas: acc.ofertas_expiradas + (m.ofertas_expiradas || 0),
            vagas_salvas: acc.vagas_salvas + (m.vagas_salvas || 0),
            tempo_medio_resposta: acc.tempo_medio_resposta + (m.tempo_medio_resposta_minutos || 0),
          }),
          {
            ofertas_enviadas: 0,
            ofertas_aceitas: 0,
            ofertas_recusadas: 0,
            ofertas_expiradas: 0,
            vagas_salvas: 0,
            tempo_medio_resposta: 0,
          }
        );

        const taxaAceitacao = totais.ofertas_enviadas > 0
          ? ((totais.ofertas_aceitas / totais.ofertas_enviadas) * 100).toFixed(1)
          : 0;

        const tempoMedioResposta = data.length > 0
          ? Math.round(totais.tempo_medio_resposta / data.length)
          : 0;

        setMetricas({
          ...totais,
          taxa_aceitacao: taxaAceitacao,
          tempo_medio_resposta_minutos: tempoMedioResposta,
          pacientes_em_fila: (data[0] as any)?.pacientes_em_fila || 0,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !metricas) {
    return <div>Carregando métricas...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Aceitação</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metricas.taxa_aceitacao}%</div>
          <p className="text-xs text-muted-foreground">
            {metricas.ofertas_aceitas} de {metricas.ofertas_enviadas} ofertas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metricas.tempo_medio_resposta_minutos} min</div>
          <p className="text-xs text-muted-foreground">Tempo para responder</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vagas Salvas</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metricas.vagas_salvas}</div>
          <p className="text-xs text-muted-foreground">Vagas que não ficaram vazias</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pacientes em Fila</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metricas.pacientes_em_fila}</div>
          <p className="text-xs text-muted-foreground">Aguardando vaga</p>
        </CardContent>
      </Card>
    </div>
  );
}
