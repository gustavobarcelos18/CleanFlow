import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MetricData {
  data: string;
  tickets_abertos: number;
  tickets_fechados: number;
  tempo_medio_primeira_resposta_minutos: number;
  slas_estourados: number;
  chats_iniciados: number;
  tempo_medio_resolucao_horas: number;
}

export const MetricsDashboard = () => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7days" | "30days" | "90days">("30days");
  const { toast } = useToast();

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);

      const days = period === "7days" ? 7 : period === "30days" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from("support_metrics")
        .select("*")
        .gte("data", startDate.toISOString().split("T")[0])
        .order("data", { ascending: true });

      if (error) throw error;
      setMetrics((data as any) || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar métricas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [period, toast]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const totals = useMemo(() => {
    return metrics.reduce(
      (acc, m) => ({
        tickets_abertos: acc.tickets_abertos + m.tickets_abertos,
        tickets_fechados: acc.tickets_fechados + m.tickets_fechados,
        slas_estourados: acc.slas_estourados + m.slas_estourados,
        chats_iniciados: acc.chats_iniciados + m.chats_iniciados,
        tempo_medio_resposta:
          metrics.length > 0
            ? metrics.reduce(
                (sum, me) => sum + me.tempo_medio_primeira_resposta_minutos,
                0,
              ) / metrics.length
            : 0,
        tempo_medio_resolucao:
          metrics.length > 0
            ? metrics.reduce(
                (sum, me) => sum + me.tempo_medio_resolucao_horas,
                0,
              ) / metrics.length
            : 0,
      }),
      {
        tickets_abertos: 0,
        tickets_fechados: 0,
        slas_estourados: 0,
        chats_iniciados: 0,
        tempo_medio_resposta: 0,
        tempo_medio_resolucao: 0,
      },
    );
  }, [metrics]);

  if (loading) {
    return <div className="p-4">Carregando métricas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Métricas e Observabilidade</h2>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList>
            <TabsTrigger value="7days">7 dias</TabsTrigger>
            <TabsTrigger value="30days">30 dias</TabsTrigger>
            <TabsTrigger value="90days">90 dias</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tickets Abertos
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.tickets_abertos}</div>
            <p className="text-xs text-muted-foreground">Período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tickets Fechados
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.tickets_fechados}</div>
            <p className="text-xs text-muted-foreground">Período selecionado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tempo Médio Resposta
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.tempo_medio_resposta.toFixed(0)} min
            </div>
            <p className="text-xs text-muted-foreground">Primeira resposta</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              SLAs Estourados
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {totals.slas_estourados}
            </div>
            <p className="text-xs text-muted-foreground">Período selecionado</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="tempos">Tempos</TabsTrigger>
          <TabsTrigger value="chats">Chats</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tickets Abertos vs Fechados</CardTitle>
              <CardDescription>Evolução diária de tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="tickets_abertos"
                    stroke="#8884d8"
                    name="Abertos"
                  />
                  <Line
                    type="monotone"
                    dataKey="tickets_fechados"
                    stroke="#82ca9d"
                    name="Fechados"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tempos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tempos de Resposta e Resolução</CardTitle>
              <CardDescription>Evolução dos tempos médios</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="tempo_medio_primeira_resposta_minutos"
                    fill="#8884d8"
                    name="1ª Resposta (min)"
                  />
                  <Bar
                    dataKey="tempo_medio_resolucao_horas"
                    fill="#82ca9d"
                    name="Resolução (h)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chats por Dia</CardTitle>
              <CardDescription>Volume de conversas iniciadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="chats_iniciados"
                    fill="#8884d8"
                    name="Chats Iniciados"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
