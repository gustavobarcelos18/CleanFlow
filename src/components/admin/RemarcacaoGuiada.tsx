import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Clock, TrendingUp, Users, CheckCircle, XCircle, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Metricas {
  data: string;
  remarcacoes_solicitadas: number;
  remarcacoes_automaticas: number;
  taxa_automacao: number;
  tempo_medio_resposta_minutos: number;
}

interface Sugestao {
  horario: string;
  score: number;
  disponivel: boolean;
  motivo_score: string;
}

export function RemarcacaoGuiada() {
  const [metricas, setMetricas] = useState<Metricas[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMetricas = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .single();

      if (!profile?.tenant_id) return;

      const { data, error } = await supabase
        .from("metricas_remarcacao" as any)
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .order("data", { ascending: false })
        .limit(30);

      if (error) throw error;
      setMetricas((data as any) || []);
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
      toast.error("Erro ao carregar métricas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetricas();
  }, []);

  const gerarSugestoes = async (agendamentoId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("gerar-sugestoes-remarcacao", {
        body: { agendamento_id: agendamentoId, limite: 5 }
      });

      if (error) throw error;
      
      toast.success("Sugestões geradas com sucesso!");
      return data;
    } catch (error) {
      console.error("Erro ao gerar sugestões:", error);
      toast.error("Erro ao gerar sugestões");
    }
  };

  const calcularTotais = () => {
    const totais = metricas.reduce(
      (acc, m) => ({
        solicitadas: acc.solicitadas + m.remarcacoes_solicitadas,
        automaticas: acc.automaticas + m.remarcacoes_automaticas,
      }),
      { solicitadas: 0, automaticas: 0 }
    );

    const taxaGeral = totais.solicitadas > 0 
      ? (totais.automaticas / totais.solicitadas) * 100 
      : 0;

    return { ...totais, taxaGeral };
  };

  const totais = calcularTotais();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Remarcação Guiada</h2>
        <p className="text-muted-foreground">
          Sugestões inteligentes de horários e automação de remarcações
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remarcações Solicitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{totais.solicitadas}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remarcações Automáticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-primary">{totais.automaticas}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Automação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">{totais.taxaGeral.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tempo Médio Resposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {metricas.length > 0
                  ? Math.round(
                      metricas.reduce((acc, m) => acc + m.tempo_medio_resposta_minutos, 0) / metricas.length
                    )
                  : 0}
                min
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informações sobre o Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Como Funciona a Remarcação Guiada
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">1</span>
              </div>
              <div>
                <h4 className="font-medium">Análise Inteligente</h4>
                <p className="text-sm text-muted-foreground">
                  Sistema analisa janelas livres, duração do procedimento, preferências do paciente e histórico
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">2</span>
              </div>
              <div>
                <h4 className="font-medium">Sugestões Personalizadas</h4>
                <p className="text-sm text-muted-foreground">
                  Gera 3-5 horários ótimos com score de compatibilidade para cada paciente
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">3</span>
              </div>
              <div>
                <h4 className="font-medium">Confirmação WhatsApp</h4>
                <p className="text-sm text-muted-foreground">
                  Paciente recebe mensagem com botões (chips) e confirma com 1 toque
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">4</span>
              </div>
              <div>
                <h4 className="font-medium">Atualização Automática</h4>
                <p className="text-sm text-muted-foreground">
                  Sistema atualiza agenda, envia ICS/e-mail e registra a remarcação
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Fatores de Score</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Preferência de período (manhã/tarde)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Histórico de confirmações</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Proximidade da data</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Disponibilidade de profissionais</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Métricas */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Performance</CardTitle>
          <CardDescription>Últimos 30 dias de remarcações</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando métricas...
            </div>
          ) : metricas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma métrica disponível ainda
            </div>
          ) : (
            <div className="space-y-2">
              {metricas.slice(0, 10).map((metrica) => (
                <div
                  key={metrica.data}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {format(new Date(metrica.data), "dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-right">
                      <div className="text-muted-foreground">Solicitadas</div>
                      <div className="font-medium">{metrica.remarcacoes_solicitadas}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-muted-foreground">Automáticas</div>
                      <div className="font-medium text-primary">{metrica.remarcacoes_automaticas}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-muted-foreground">Taxa</div>
                      <div className="font-bold">{metrica.taxa_automacao.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
