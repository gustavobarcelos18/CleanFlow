import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Activity,
  Users,
  MessageSquare,
  Zap,
  TrendingUp,
  TrendingDown,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  AnalyticsFilter,
  useAnalyticsOcupacao,
  useAnalyticsNoShow,
  useAnalyticsMensageria,
  useAnalyticsAutomacoes,
} from "@/hooks/data/useAnalytics";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["#22D3EE", "#F97316", "#10B981", "#6366F1", "#EC4899"];
const GRID_COLOR = "#1B2A40";
const TEXT_COLOR = "#A9B7D0";

export default function AnalyticsDashboard() {
  const [periodo, setPeriodo] = useState<"7d" | "30d" | "90d">("30d");
  const [unidade, setUnidade] = useState<string>("all");

  const filter: AnalyticsFilter = {
    periodo,
    unidadeId: unidade,
  };

  const { data: ocupacaoData, isLoading: loadingOcupacao } =
    useAnalyticsOcupacao(filter);
  const { data: noShowData, isLoading: loadingNoShow } =
    useAnalyticsNoShow(filter);
  const { data: mensageriaData, isLoading: loadingMensageria } =
    useAnalyticsMensageria(filter);
  const { data: automacoesData, isLoading: loadingAutomacoes } =
    useAnalyticsAutomacoes(filter);

  // Agregações para KPIs
  const totalAgendamentos =
    noShowData?.reduce(
      (acc: number, curr: any) => acc + (curr.total_agendamentos || 0),
      0,
    ) || 0;
  const totalNoShow =
    noShowData?.reduce(
      (acc: number, curr: any) => acc + (curr.total_no_show || 0),
      0,
    ) || 0;
  const taxaNoShowGlobal =
    totalAgendamentos > 0 ? (totalNoShow / totalAgendamentos) * 100 : 0;

  const totalMensagens =
    mensageriaData?.reduce(
      (acc: number, curr: any) => acc + (curr.enviados || 0),
      0,
    ) || 0;
  const totalEntregues =
    mensageriaData?.reduce(
      (acc: number, curr: any) => acc + (curr.entregues || 0),
      0,
    ) || 0;
  const taxaEntregaGlobal =
    totalMensagens > 0 ? (totalEntregues / totalMensagens) * 100 : 0;

  const totalAutomacoes =
    automacoesData?.reduce(
      (acc: number, curr: any) => acc + (curr.execucoes || 0),
      0,
    ) || 0;

  // Formatação para gráficos
  const chartDataOcupacao =
    ocupacaoData?.map((d: any) => ({
      data: format(parseISO(d.data), "dd/MM"),
      taxa: Number(d.taxa_ocupacao_estimada),
    })) || [];

  const chartDataNoShow =
    noShowData?.map((d: any) => ({
      data: format(parseISO(d.data), "dd/MM"),
      taxa: Number(d.taxa_no_show),
      score: Number(d.media_no_show_score),
    })) || [];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0B1220] p-6 border border-[#1B2A40] rounded-2xl">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Analytics & <span className="text-cyan-400">BI</span>
          </h1>
          <p className="text-[#A9B7D0] font-medium">
            Visão estratégica e métricas de conversão.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={unidade} onValueChange={setUnidade}>
            <SelectTrigger className="w-[180px] bg-[#070B12] border-[#1B2A40] text-white">
              <SelectValue placeholder="Todas as Unidades" />
            </SelectTrigger>
            <SelectContent className="bg-[#0B1220] border-[#1B2A40] text-white">
              <SelectItem value="all">Todas as Unidades</SelectItem>
              <SelectItem value="matriz">Matriz</SelectItem>
            </SelectContent>
          </Select>

          <Select value={periodo} onValueChange={(v: any) => setPeriodo(v)}>
            <SelectTrigger className="w-[140px] bg-[#070B12] border-[#1B2A40] text-white">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent className="bg-[#0B1220] border-[#1B2A40] text-white">
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Taxa de Ocupação"
          value={`${(chartDataOcupacao.reduce((acc, curr) => acc + curr.taxa, 0) / (chartDataOcupacao.length || 1)).toFixed(1)}%`}
          description="Média do período"
          icon={Activity}
          trend="up"
        />
        <KPICard
          title="Taxa de No-Show"
          value={`${taxaNoShowGlobal.toFixed(1)}%`}
          description={`${totalNoShow} faltas registradas`}
          icon={AlertTriangle}
          trend={taxaNoShowGlobal > 15 ? "down" : "up"}
          inverseTrend
        />
        <KPICard
          title="Mensagens Entregues"
          value={`${taxaEntregaGlobal.toFixed(1)}%`}
          description={`${totalEntregues} mensagens confirmadas`}
          icon={MessageSquare}
          trend="up"
        />
        <KPICard
          title="Automações Executadas"
          value={totalAutomacoes.toString()}
          description="Fluxos processados"
          icon={Zap}
          trend="neutral"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-[#0B1220] border border-[#1B2A40] p-1 h-12">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-[#22D3EE] data-[state=active]:text-[#070B12] font-bold"
          >
            Visão Geral
          </TabsTrigger>
          <TabsTrigger
            value="noshow"
            className="data-[state=active]:bg-[#22D3EE] data-[state=active]:text-[#070B12] font-bold"
          >
            Análise de No-Show
          </TabsTrigger>
          <TabsTrigger
            value="messaging"
            className="data-[state=active]:bg-[#22D3EE] data-[state=active]:text-[#070B12] font-bold"
          >
            Mensageria & Automação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#0B1220] border-[#1B2A40] shadow-xl">
              <CardHeader>
                <CardTitle className="text-white font-bold">
                  Ocupação Diária
                </CardTitle>
                <CardDescription className="text-[#A9B7D0]">
                  Evolução da taxa de ocupação estimada
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartDataOcupacao}>
                    <defs>
                      <linearGradient
                        id="colorOcupacao"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#22D3EE"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#22D3EE"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={GRID_COLOR}
                      vertical={false}
                    />
                    <XAxis dataKey="data" stroke={TEXT_COLOR} fontSize={12} />
                    <YAxis stroke={TEXT_COLOR} fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0B1220",
                        border: "1px solid #1B2A40",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="taxa"
                      stroke="#22D3EE"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorOcupacao)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-[#0B1220] border-[#1B2A40] shadow-xl">
              <CardHeader>
                <CardTitle className="text-white font-bold">
                  No-Show vs Score de Risco
                </CardTitle>
                <CardDescription className="text-[#A9B7D0]">
                  Correlação entre faltas e risco previsto
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartDataNoShow}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={GRID_COLOR}
                      vertical={false}
                    />
                    <XAxis dataKey="data" stroke={TEXT_COLOR} fontSize={12} />
                    <YAxis yAxisId="left" stroke={TEXT_COLOR} fontSize={12} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke={TEXT_COLOR}
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0B1220",
                        border: "1px solid #1B2A40",
                        borderRadius: "12px",
                        color: "#fff",
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="taxa"
                      name="Taxa No-Show %"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={{ fill: "#ef4444", r: 4 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="score"
                      name="Score Risco Médio"
                      stroke="#F97316"
                      strokeWidth={3}
                      dot={{ fill: "#F97316", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="noshow">
          <Card>
            <CardHeader>
              <CardTitle>Impacto da IA na Previsão</CardTitle>
              <CardDescription>
                Comparativo de taxa de no-show por nível de risco identificado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                {/* TODO: Implementar gráfico de barras agrupado por nível de risco */}
                Gráfico detalhado de correlação Score x Realidade (Em Breve)
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messaging">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Desempenho por Canal</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mensageriaData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="tipo" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="enviados" fill="#8884d8" name="Enviados" />
                    <Bar dataKey="entregues" fill="#82ca9d" name="Entregues" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  inverseTrend,
}: any) {
  const isPositive = trend === "up";
  const isNeutral = trend === "neutral";

  // Cores de tendência combinando com o tema
  const statusColor = isNeutral
    ? "text-cyan-400"
    : (isPositive && !inverseTrend) || (!isPositive && inverseTrend)
      ? "text-emerald-400"
      : "text-orange-500";

  const TrendIcon = isNeutral ? Zap : isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="bg-[#070B12] border-[#1B2A40] hover:border-cyan-400/30 transition-all duration-300 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-bold text-[#A9B7D0] tracking-wider uppercase">
          {title}
        </CardTitle>
        <div className="p-2 bg-cyan-400/10 rounded-lg">
          <Icon className="h-4 w-4 text-cyan-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-black text-white">{value}</div>
        <div className="flex items-center gap-2 mt-2">
          {!isNeutral && (
            <div
              className={cn(
                "flex items-center justify-center w-5 h-5 rounded-full bg-opacity-20",
                isPositive ? "bg-emerald-500/10" : "bg-orange-500/10",
              )}
            >
              <TrendIcon className={cn("h-3 w-3", statusColor)} />
            </div>
          )}
          <p className={cn("text-xs font-bold tracking-tight", statusColor)}>
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
