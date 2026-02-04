import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
    Activity, Users, MessageSquare, Zap, TrendingUp, TrendingDown,
    Calendar, AlertTriangle, CheckCircle
} from "lucide-react";
import { AnalyticsFilter, useAnalyticsOcupacao, useAnalyticsNoShow, useAnalyticsMensageria, useAnalyticsAutomacoes } from "@/hooks/data/useAnalytics";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsDashboard() {
    const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d'>('30d');
    const [unidade, setUnidade] = useState<string>('all');

    const filter: AnalyticsFilter = {
        periodo,
        unidadeId: unidade
    };

    const { data: ocupacaoData, isLoading: loadingOcupacao } = useAnalyticsOcupacao(filter);
    const { data: noShowData, isLoading: loadingNoShow } = useAnalyticsNoShow(filter);
    const { data: mensageriaData, isLoading: loadingMensageria } = useAnalyticsMensageria(filter);
    const { data: automacoesData, isLoading: loadingAutomacoes } = useAnalyticsAutomacoes(filter);

    // Agregações para KPIs
    const totalAgendamentos = noShowData?.reduce((acc, curr) => acc + (curr.total_agendamentos || 0), 0) || 0;
    const totalNoShow = noShowData?.reduce((acc, curr) => acc + (curr.total_no_show || 0), 0) || 0;
    const taxaNoShowGlobal = totalAgendamentos > 0 ? (totalNoShow / totalAgendamentos) * 100 : 0;

    const totalMensagens = mensageriaData?.reduce((acc, curr) => acc + (curr.enviados || 0), 0) || 0;
    const totalEntregues = mensageriaData?.reduce((acc, curr) => acc + (curr.entregues || 0), 0) || 0;
    const taxaEntregaGlobal = totalMensagens > 0 ? (totalEntregues / totalMensagens) * 100 : 0;

    const totalAutomacoes = automacoesData?.reduce((acc, curr) => acc + (curr.execucoes || 0), 0) || 0;

    // Formatação para gráficos
    const chartDataOcupacao = ocupacaoData?.map(d => ({
        data: format(parseISO(d.data), 'dd/MM'),
        taxa: Number(d.taxa_ocupacao_estimada)
    })) || [];

    const chartDataNoShow = noShowData?.map(d => ({
        data: format(parseISO(d.data), 'dd/MM'),
        taxa: Number(d.taxa_no_show),
        score: Number(d.media_no_show_score)
    })) || [];

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics & BI</h1>
                    <p className="text-muted-foreground">Visão estratégica da sua operação.</p>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={unidade} onValueChange={setUnidade}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Todas as Unidades" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Unidades</SelectItem>
                            {/* TODO: Popular com unidades reais */}
                            <SelectItem value="matriz">Matriz</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={periodo} onValueChange={(v: any) => setPeriodo(v)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
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

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="noshow">Análise de No-Show</TabsTrigger>
                    <TabsTrigger value="messaging">Mensageria & Automação</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Ocupação Diária</CardTitle>
                                <CardDescription>Evolução da taxa de ocupação estimada</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartDataOcupacao}>
                                        <defs>
                                            <linearGradient id="colorOcupacao" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="data" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="taxa" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorOcupacao)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>No-Show vs Score de Risco</CardTitle>
                                <CardDescription>Correlação entre faltas e risco previsto</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartDataNoShow}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="data" />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip />
                                        <Legend />
                                        <Line yAxisId="left" type="monotone" dataKey="taxa" name="Taxa No-Show %" stroke="#ef4444" activeDot={{ r: 8 }} />
                                        <Line yAxisId="right" type="monotone" dataKey="score" name="Score Risco Médio" stroke="#f59e0b" />
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
                            <CardDescription>Comparativo de taxa de no-show por nível de risco identificado</CardDescription>
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

function KPICard({ title, value, description, icon: Icon, trend, inverseTrend }: any) {
    const isPositive = trend === 'up';
    const isNeutral = trend === 'neutral';
    const colorClass = isNeutral ? 'text-muted-foreground' :
        (isPositive && !inverseTrend) || (!isPositive && inverseTrend) ? 'text-green-500' : 'text-red-500';
    const TrendIcon = isNeutral ? Activity : (isPositive ? TrendingUp : TrendingDown);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {!isNeutral && <TrendIcon className={`h-3 w-3 ${colorClass}`} />}
                    <span className={colorClass}>
                        {description}
                    </span>
                </p>
            </CardContent>
        </Card>
    );
}
