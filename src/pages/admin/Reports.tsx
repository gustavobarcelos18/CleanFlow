import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowLeft, Download, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layout/AdminLayout";

const COLORS = ['#016CA5', '#25D366', '#FFB800', '#FF6B6B'];

interface ReportData {
  ticketsByStatus: any[];
  ticketsByPriority: any[];
  ticketsByOrigin: any[];
  ticketsTrend: any[];
  slaMetrics: {
    cumprido: number;
    emRisco: number;
    estourado: number;
    total: number;
  };
  resolutionTime: {
    avg: number;
    min: number;
    max: number;
  };
  teamPerformance: any[];
}

const AdminReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState("30");
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    loadReportData();
  }, [period]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      // Buscar tickets do período
      const { data: tickets, error } = await supabase
        .from("support_tickets")
        .select("*")
        .gte("created_at", daysAgo.toISOString());

      if (error) throw error;

      // Processar dados para os gráficos
      const ticketsByStatus = processTicketsByStatus(tickets || []);
      const ticketsByPriority = processTicketsByPriority(tickets || []);
      const ticketsByOrigin = processTicketsByOrigin(tickets || []);
      const ticketsTrend = processTicketsTrend(tickets || [], parseInt(period));
      const slaMetrics = processSLAMetrics(tickets || []);
      const resolutionTime = processResolutionTime(tickets || []);
      const teamPerformance = await processTeamPerformance(tickets || []);

      setReportData({
        ticketsByStatus,
        ticketsByPriority,
        ticketsByOrigin,
        ticketsTrend,
        slaMetrics,
        resolutionTime,
        teamPerformance
      });
    } catch (error) {
      console.error("Error loading report data:", error);
      toast.error("Erro ao carregar relatórios");
    } finally {
      setLoading(false);
    }
  };

  const processTicketsByStatus = (tickets: any[]) => {
    const statusCount: Record<string, number> = {};
    tickets.forEach(ticket => {
      statusCount[ticket.status] = (statusCount[ticket.status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
      name: translateStatus(status),
      value: count,
      status
    }));
  };

  const processTicketsByPriority = (tickets: any[]) => {
    const priorityCount: Record<string, number> = {};
    tickets.forEach(ticket => {
      priorityCount[ticket.priority] = (priorityCount[ticket.priority] || 0) + 1;
    });

    return Object.entries(priorityCount).map(([priority, count]) => ({
      name: translatePriority(priority),
      value: count
    }));
  };

  const processTicketsByOrigin = (tickets: any[]) => {
    const originCount: Record<string, number> = {};
    tickets.forEach(ticket => {
      const origin = ticket.origem || 'manual';
      originCount[origin] = (originCount[origin] || 0) + 1;
    });

    return Object.entries(originCount).map(([origin, count]) => ({
      name: translateOrigin(origin),
      value: count
    }));
  };

  const processTicketsTrend = (tickets: any[], days: number) => {
    const trend: Record<string, number> = {};

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      trend[dateStr] = 0;
    }

    tickets.forEach(ticket => {
      const date = new Date(ticket.created_at);
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (trend[dateStr] !== undefined) {
        trend[dateStr]++;
      }
    });

    return Object.entries(trend).map(([date, count]) => ({
      date,
      tickets: count
    }));
  };

  const processSLAMetrics = (tickets: any[]) => {
    let cumprido = 0;
    let emRisco = 0;
    let estourado = 0;

    tickets.forEach(ticket => {
      if (!ticket.sla || !ticket.sla.limite) return;

      const now = new Date();
      const limite = new Date(ticket.sla.limite);
      const tempoRestante = limite.getTime() - now.getTime();

      if (ticket.status === 'resolved' || ticket.status === 'closed') {
        if (ticket.sla.atingido === false) {
          cumprido++;
        } else {
          estourado++;
        }
      } else if (tempoRestante <= 0) {
        estourado++;
      } else {
        const inicio = new Date(ticket.sla.inicio);
        const tempoTotal = limite.getTime() - inicio.getTime();
        const percentualGasto = ((tempoTotal - tempoRestante) / tempoTotal) * 100;

        if (percentualGasto >= 80) {
          emRisco++;
        } else {
          cumprido++;
        }
      }
    });

    return {
      cumprido,
      emRisco,
      estourado,
      total: tickets.length
    };
  };

  const processResolutionTime = (tickets: any[]) => {
    const resolvedTickets = tickets.filter(t => t.resolved_at);

    if (resolvedTickets.length === 0) {
      return { avg: 0, min: 0, max: 0 };
    }

    const times = resolvedTickets.map(ticket => {
      const created = new Date(ticket.created_at);
      const resolved = new Date(ticket.resolved_at);
      return (resolved.getTime() - created.getTime()) / (1000 * 60 * 60); // horas
    });

    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times)
    };
  };

  const processTeamPerformance = async (tickets: any[]) => {
    const { data: supportUsers } = await supabase
      .from("usuarios_suporte")
      .select("id, nome, auth_user_id");

    if (!supportUsers) return [];

    const performance = supportUsers.map(user => {
      const assignedTickets = tickets.filter(t => t.assigned_to === user.auth_user_id);
      const resolvedTickets = assignedTickets.filter(t => t.status === 'resolved' || t.status === 'closed');

      return {
        name: user.nome,
        atribuidos: assignedTickets.length,
        resolvidos: resolvedTickets.length,
        taxa: assignedTickets.length > 0
          ? Math.round((resolvedTickets.length / assignedTickets.length) * 100)
          : 0
      };
    }).filter(p => p.atribuidos > 0);

    return performance;
  };

  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      open: 'Aberto',
      in_progress: 'Em Progresso',
      waiting_customer: 'Aguardando Cliente',
      resolved: 'Resolvido',
      closed: 'Fechado'
    };
    return translations[status] || status;
  };

  const translatePriority = (priority: string) => {
    const translations: Record<string, string> = {
      urgent: 'Urgente',
      high: 'Alta',
      medium: 'Média',
      low: 'Baixa'
    };
    return translations[priority] || priority;
  };

  const translateOrigin = (origin: string) => {
    const translations: Record<string, string> = {
      chat: 'Chat',
      email: 'Email',
      whatsapp: 'WhatsApp',
      manual: 'Manual'
    };
    return translations[origin] || origin;
  };

  const exportReport = async (format: 'csv' | 'pdf') => {
    if (!reportData) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (format === 'csv') {
        const csvContent = generateCSV();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio-suporte-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
      } else {
        await generatePDF();
      }

      // Registrar exportação
      await supabase.rpc('registrar_exportacao', {
        p_user_id: user.id,
        p_export_type: 'support_report',
        p_table_name: 'support_tickets',
        p_filters: { period },
        p_record_count: reportData.ticketsByStatus.reduce((sum, item) => sum + item.value, 0),
        p_file_format: format
      });

      toast.success(`Relatório exportado como ${format.toUpperCase()} com sucesso`);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error("Erro ao registrar exportação");
    }
  };

  const generatePDF = async () => {
    if (!reportData) return;
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text("Relatório de Suporte CleanFlow", 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Período: Últimos ${period} dias`, 14, 30);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 36);

    let finalY = 45;

    // Métricas SLA
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Métricas de SLA", 14, finalY);
    finalY += 6;

    autoTable(doc, {
      startY: finalY,
      head: [['Status', 'Quantidade', 'Percentual']],
      body: [
        ['Cumprido', reportData.slaMetrics.cumprido, `${((reportData.slaMetrics.cumprido / reportData.slaMetrics.total) * 100).toFixed(1)}%`],
        ['Em Risco', reportData.slaMetrics.emRisco, `${((reportData.slaMetrics.emRisco / reportData.slaMetrics.total) * 100).toFixed(1)}%`],
        ['Estourado', reportData.slaMetrics.estourado, `${((reportData.slaMetrics.estourado / reportData.slaMetrics.total) * 100).toFixed(1)}%`],
      ],
    });

    // @ts-ignore
    finalY = doc.lastAutoTable.finalY + 15;

    // Tickets por Status
    doc.text("Tickets por Status", 14, finalY);
    finalY += 6;

    autoTable(doc, {
      startY: finalY,
      head: [['Status', 'Quantidade']],
      body: reportData.ticketsByStatus.map(item => [item.name, item.value]),
    });

    // @ts-ignore
    finalY = doc.lastAutoTable.finalY + 15;

    // Performance da Equipe
    doc.text("Performance da Equipe", 14, finalY);
    finalY += 6;

    autoTable(doc, {
      startY: finalY,
      head: [['Agente', 'Atribuídos', 'Resolvidos', 'Taxa de Resolução']],
      body: reportData.teamPerformance.map(item => [
        item.name,
        item.atribuidos,
        item.resolvidos,
        `${item.taxa}%`
      ]),
    });

    doc.save(`relatorio-suporte-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateCSV = () => {
    if (!reportData) return '';

    let csv = 'RELATÓRIO DE SUPORTE\n\n';
    csv += `Período: Últimos ${period} dias\n`;
    csv += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;

    csv += 'MÉTRICAS DE SLA\n';
    csv += 'Status,Quantidade,Percentual\n';
    csv += `Cumprido,${reportData.slaMetrics.cumprido},${((reportData.slaMetrics.cumprido / reportData.slaMetrics.total) * 100).toFixed(1)}%\n`;
    csv += `Em Risco,${reportData.slaMetrics.emRisco},${((reportData.slaMetrics.emRisco / reportData.slaMetrics.total) * 100).toFixed(1)}%\n`;
    csv += `Estourado,${reportData.slaMetrics.estourado},${((reportData.slaMetrics.estourado / reportData.slaMetrics.total) * 100).toFixed(1)}%\n\n`;

    csv += 'TICKETS POR STATUS\n';
    csv += 'Status,Quantidade\n';
    reportData.ticketsByStatus.forEach(item => {
      csv += `${item.name},${item.value}\n`;
    });

    csv += '\nPERFORMANCE DA EQUIPE\n';
    csv += 'Agente,Atribuídos,Resolvidos,Taxa de Resolução\n';
    reportData.teamPerformance.forEach(item => {
      csv += `${item.name},${item.atribuidos},${item.resolvidos},${item.taxa}%\n`;
    });

    return csv;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Relatórios de Suporte</h1>
              <p className="text-muted-foreground">Análises e métricas do sistema de tickets</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="15">Últimos 15 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => exportReport('csv')} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button onClick={() => exportReport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {reportData && (
          <>
            {/* Métricas Principais */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">SLA Cumprido</p>
                    <p className="text-3xl font-bold text-green-600">
                      {reportData.slaMetrics.total > 0
                        ? Math.round((reportData.slaMetrics.cumprido / reportData.slaMetrics.total) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reportData.slaMetrics.cumprido} de {reportData.slaMetrics.total}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">SLA em Risco</p>
                    <p className="text-3xl font-bold text-yellow-600">
                      {reportData.slaMetrics.total > 0
                        ? Math.round((reportData.slaMetrics.emRisco / reportData.slaMetrics.total) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reportData.slaMetrics.emRisco} tickets
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">SLA Estourado</p>
                    <p className="text-3xl font-bold text-red-600">
                      {reportData.slaMetrics.total > 0
                        ? Math.round((reportData.slaMetrics.estourado / reportData.slaMetrics.total) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {reportData.slaMetrics.estourado} tickets
                    </p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tempo Médio</p>
                    <p className="text-3xl font-bold">
                      {reportData.resolutionTime.avg.toFixed(1)}h
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Resolução de tickets
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="team">Performance da Equipe</TabsTrigger>
                <TabsTrigger value="trends">Tendências</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Tickets por Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={reportData.ticketsByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {reportData.ticketsByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Tickets por Prioridade</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={reportData.ticketsByPriority}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#016CA5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Tickets por Origem</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={reportData.ticketsByOrigin}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {reportData.ticketsByOrigin.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Tempo de Resolução</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Tempo Médio</p>
                        <p className="text-2xl font-bold">{reportData.resolutionTime.avg.toFixed(1)} horas</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tempo Mínimo</p>
                        <p className="text-xl font-semibold">{reportData.resolutionTime.min.toFixed(1)} horas</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tempo Máximo</p>
                        <p className="text-xl font-semibold">{reportData.resolutionTime.max.toFixed(1)} horas</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Performance dos Agentes</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={reportData.teamPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="atribuidos" fill="#016CA5" name="Atribuídos" />
                      <Bar dataKey="resolvidos" fill="#25D366" name="Resolvidos" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <div className="grid grid-cols-1 gap-4">
                  {reportData.teamPerformance.map((agent, index) => (
                    <Card key={index} className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">{agent.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {agent.atribuidos} tickets atribuídos • {agent.resolvidos} resolvidos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-primary">{agent.taxa}%</p>
                          <p className="text-sm text-muted-foreground">Taxa de Resolução</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="trends" className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Tendência de Criação de Tickets</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={reportData.ticketsTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="tickets" stroke="#016CA5" strokeWidth={2} name="Tickets Criados" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
