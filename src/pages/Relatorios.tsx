import { useState, useEffect, useCallback, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Download,
  Search,
  Calendar,
  Users,
  Stethoscope,
  FileText,
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileDown,
  ArrowUpDown,
} from "lucide-react";
import { format, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import "./Relatorios.css";

export default function Relatorios() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  // Estados de filtro para cada relatório
  const [filterAgendamento, setFilterAgendamento] = useState({
    search: "",
    status: "",
    dateFrom: "",
    dateTo: "",
  });
  const [filterPaciente, setFilterPaciente] = useState({
    search: "",
    risco: "",
  });
  const [filterProfissional, setFilterProfissional] = useState({
    search: "",
    especialidade: "",
  });
  const [filterConfirmacao, setFilterConfirmacao] = useState({
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [filterListaEspera, setFilterListaEspera] = useState({
    search: "",
    prioridade: "",
  });
  const [filterAlerta, setFilterAlerta] = useState({
    search: "",
    tipo: "",
    prioridade: "",
  });
  const [filterMensagem, setFilterMensagem] = useState({
    search: "",
    canal: "",
    status: "",
  });

  // Estados de ordenação
  const [sortAgendamento, setSortAgendamento] = useState({
    field: "inicio",
    direction: "desc" as "asc" | "desc",
  });
  const [sortPaciente, setSortPaciente] = useState({
    field: "nome",
    direction: "asc" as "asc" | "desc",
  });
  const [sortProfissional, setSortProfissional] = useState({
    field: "nome",
    direction: "asc" as "asc" | "desc",
  });

  // Estados para cada relatório
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [confirmacoes, setConfirmacoes] = useState<any[]>([]);
  const [listaEspera, setListaEspera] = useState<any[]>([]);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [mensagens, setMensagens] = useState<any[]>([]);

  // Memoized filtered lists to avoid duplication and unnecessary re-renders
  const filteredAgendamentos = useMemo(() => {
    return agendamentos.filter((a) => {
      const matchSearch =
        !filterAgendamento.search ||
        a.pacientes?.nome
          ?.toLowerCase()
          .includes(filterAgendamento.search.toLowerCase()) ||
        a.procedimentos?.nome
          ?.toLowerCase()
          .includes(filterAgendamento.search.toLowerCase());
      const matchStatus =
        !filterAgendamento.status || a.status === filterAgendamento.status;
      const matchDate =
        (!filterAgendamento.dateFrom ||
          new Date(a.inicio) >= new Date(filterAgendamento.dateFrom)) &&
        (!filterAgendamento.dateTo ||
          new Date(a.inicio) <= new Date(filterAgendamento.dateTo));
      return matchSearch && matchStatus && matchDate;
    });
  }, [agendamentos, filterAgendamento]);

  const filteredPacientes = useMemo(() => {
    return pacientes.filter((p) => {
      const matchSearch =
        !filterPaciente.search ||
        p.nome?.toLowerCase().includes(filterPaciente.search.toLowerCase()) ||
        p.cpf?.includes(filterPaciente.search) ||
        p.telefone?.includes(filterPaciente.search);
      const matchRisco = !filterPaciente.risco || p.risco_no_show > 50;
      return matchSearch && matchRisco;
    });
  }, [pacientes, filterPaciente]);

  const filteredProfissionais = useMemo(() => {
    return profissionais.filter((p) => {
      const matchSearch =
        !filterProfissional.search ||
        p.nome?.toLowerCase().includes(filterProfissional.search.toLowerCase());
      const matchEsp =
        !filterProfissional.especialidade ||
        p.especialidades?.nome
          ?.toLowerCase()
          .includes(filterProfissional.especialidade.toLowerCase());
      return matchSearch && matchEsp;
    });
  }, [profissionais, filterProfissional]);

  const filteredConfirmacoes = useMemo(() => {
    return confirmacoes.filter((c) => {
      const matchSearch =
        !filterConfirmacao.search ||
        c.pacientes?.nome
          ?.toLowerCase()
          .includes(filterConfirmacao.search.toLowerCase());
      const matchDate =
        (!filterConfirmacao.dateFrom ||
          new Date(c.confirmado_em) >= new Date(filterConfirmacao.dateFrom)) &&
        (!filterConfirmacao.dateTo ||
          new Date(c.confirmado_em) <= new Date(filterConfirmacao.dateTo));
      return matchSearch && matchDate;
    });
  }, [confirmacoes, filterConfirmacao]);

  const filteredListaEspera = useMemo(() => {
    return listaEspera.filter((l) => {
      const matchSearch =
        !filterListaEspera.search ||
        l.pacientes?.nome
          ?.toLowerCase()
          .includes(filterListaEspera.search.toLowerCase());
      const matchPrioridade =
        !filterListaEspera.prioridade ||
        (filterListaEspera.prioridade === "alta" && l.prioridade > 5) ||
        (filterListaEspera.prioridade === "media" &&
          l.prioridade > 2 &&
          l.prioridade <= 5) ||
        (filterListaEspera.prioridade === "baixa" && l.prioridade <= 2);
      return matchSearch && matchPrioridade;
    });
  }, [listaEspera, filterListaEspera]);

  const filteredAlertas = useMemo(() => {
    return alertas.filter((a) => {
      const matchSearch =
        !filterAlerta.search ||
        a.titulo?.toLowerCase().includes(filterAlerta.search.toLowerCase()) ||
        a.pacientes?.nome
          ?.toLowerCase()
          .includes(filterAlerta.search.toLowerCase());
      const matchTipo = !filterAlerta.tipo || a.tipo === filterAlerta.tipo;
      const matchPrioridade =
        !filterAlerta.prioridade || a.prioridade === filterAlerta.prioridade;
      return matchSearch && matchTipo && matchPrioridade;
    });
  }, [alertas, filterAlerta]);

  const filteredMensagens = useMemo(() => {
    return mensagens.filter((m) => {
      const matchSearch =
        !filterMensagem.search ||
        m.destinatario
          ?.toLowerCase()
          .includes(filterMensagem.search.toLowerCase());
      const matchCanal =
        !filterMensagem.canal || m.canal === filterMensagem.canal;
      const matchStatus =
        !filterMensagem.status || m.status === filterMensagem.status;
      return matchSearch && matchCanal && matchStatus;
    });
  }, [mensagens, filterMensagem]);

  const fetchAllReports = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) return;

      // Buscar agendamentos
      const { data: agendamentosData } = await supabase
        .from("agenda")
        .select(
          `
          *,
          pacientes:paciente_id(nome, telefone),
          procedimentos:servico_id(nome),
          profiles:profissional_id(nome)
        `,
        )
        .eq("tenant_id", profile.tenant_id)
        .order("inicio", { ascending: false })
        .limit(100);

      // Buscar pacientes
      const { data: pacientesData } = await supabase
        .from("pacientes")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .order("created_at", { ascending: false });

      // Buscar profissionais
      const { data: profissionaisData } = await supabase
        .from("profiles")
        .select(
          `
          *,
          especialidades:especialidade_id(nome)
        `,
        )
        .eq("tenant_id", profile.tenant_id)
        .eq("role", "profissional")
        .order("created_at", { ascending: false });

      // Buscar confirmações (agendamentos confirmados)
      const { data: confirmacoesData } = await supabase
        .from("agenda")
        .select(
          `
          *,
          pacientes:paciente_id(nome, telefone),
          procedimentos:servico_id(nome)
        `,
        )
        .eq("tenant_id", profile.tenant_id)
        .eq("confirmado", true)
        .order("confirmado_em", { ascending: false })
        .limit(100);

      // Buscar lista de espera
      const { data: listaEsperaData } = await supabase
        .from("lista_espera")
        .select(
          `
          *,
          pacientes:paciente_id(nome, telefone),
          procedimentos:servico_id(nome)
        `,
        )
        .eq("tenant_id", profile.tenant_id)
        .eq("ativo", true)
        .order("prioridade", { ascending: false });

      // Buscar alertas
      const { data: alertasData } = await supabase
        .from("alertas_risco")
        .select(
          `
          *,
          pacientes:paciente_id(nome, telefone)
        `,
        )
        .eq("tenant_id", profile.tenant_id)
        .order("created_at", { ascending: false })
        .limit(100);

      // Buscar mensagens
      const { data: mensagensData } = await supabase
        .from("log_mensagens")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .order("created_at", { ascending: false })
        .limit(100);

      setAgendamentos(agendamentosData || []);
      setPacientes(pacientesData || []);
      setProfissionais(profissionaisData || []);
      setConfirmacoes(confirmacoesData || []);
      setListaEspera(listaEsperaData || []);
      setAlertas(alertasData || []);
      setMensagens(mensagensData || []);
    } catch (error) {
      console.error("Erro ao buscar relatórios:", error);
      toast({
        title: "Erro ao carregar relatórios",
        description: "Não foi possível carregar os dados dos relatórios.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Não há dados disponíveis neste relatório.",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => (typeof val === "object" ? JSON.stringify(val) : val))
        .join(","),
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();

    toast({
      title: "Exportado com sucesso",
      description: `Relatório ${filename} exportado em CSV.`,
    });
  };

  const exportToPDF = (
    data: any[],
    filename: string,
    columns: string[],
    headers: string[],
  ) => {
    if (data.length === 0) {
      toast({
        title: "Sem dados para exportar",
        description: "Não há dados disponíveis neste relatório.",
        variant: "destructive",
      });
      return;
    }

    const doc = new jsPDF();

    // Título
    doc.setFontSize(16);
    doc.text(`Relatório - ${filename}`, 14, 15);
    doc.setFontSize(10);
    doc.text(
      `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
      14,
      22,
    );

    // Tabela
    const tableData = data.map((row) =>
      columns.map((col) => {
        const value = row[col];
        if (typeof value === "object" && value !== null) {
          return JSON.stringify(value);
        }
        return value || "-";
      }),
    );

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [1, 108, 165] },
    });

    doc.save(`${filename}_${format(new Date(), "yyyy-MM-dd")}.pdf`);

    toast({
      title: "Exportado com sucesso",
      description: `Relatório ${filename} exportado em PDF.`,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      agendado: { label: "Agendado", variant: "default" },
      confirmado: { label: "Confirmado", variant: "success" },
      realizado: { label: "Realizado", variant: "success" },
      cancelado: { label: "Cancelado", variant: "destructive" },
      faltou: { label: "Faltou", variant: "destructive" },
    };

    const config = statusMap[status] || { label: status, variant: "default" };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const prioridadeMap: Record<string, { variant: any }> = {
      baixa: { variant: "secondary" },
      media: { variant: "default" },
      alta: { variant: "warning" },
      critica: { variant: "destructive" },
    };

    const config = prioridadeMap[prioridade] || { variant: "default" };
    return <Badge variant={config.variant as any}>{prioridade}</Badge>;
  };

  const sortData = (data: any[], field: string, direction: "asc" | "desc") => {
    return [...data].sort((a, b) => {
      let aVal = a[field];
      let bVal = b[field];

      // Handle nested objects (e.g., pacientes.nome)
      if (field.includes(".")) {
        const parts = field.split(".");
        aVal = parts.reduce((obj, key) => obj?.[key], a);
        bVal = parts.reduce((obj, key) => obj?.[key], b);
      }

      // Handle null values
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // String comparison
      if (typeof aVal === "string" && typeof bVal === "string") {
        return direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      // Number/Date comparison
      return direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  };

  const handleSort = (field: string, currentSort: any, setSortFunc: any) => {
    const newDirection =
      currentSort.field === field && currentSort.direction === "asc"
        ? "desc"
        : "asc";
    setSortFunc({ field, direction: newDirection });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-10 reports-page">
        <div className="border-b border-muted/30 pb-6">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-300 dark:to-gray-600 pr-2 pb-1">Relatórios</h1>
          <p className="text-muted-foreground font-medium mt-1">
            <FileText className="inline h-4 w-4 mr-1.5 mb-0.5" />
            Visualize e exporte relatórios completos do sistema
          </p>
        </div>

        <Tabs defaultValue="agendamentos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 bg-muted/30 border border-muted/50 rounded-xl p-1 h-auto">
            <TabsTrigger value="agendamentos">
              <Calendar className="h-4 w-4 mr-2" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="pacientes">
              <Users className="h-4 w-4 mr-2" />
              Pacientes
            </TabsTrigger>
            <TabsTrigger value="profissionais">
              <Stethoscope className="h-4 w-4 mr-2" />
              Profissionais
            </TabsTrigger>
            <TabsTrigger value="confirmacoes">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmações
            </TabsTrigger>
            <TabsTrigger value="lista-espera">
              <Clock className="h-4 w-4 mr-2" />
              Lista Espera
            </TabsTrigger>
            <TabsTrigger value="alertas">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Alertas
            </TabsTrigger>
            <TabsTrigger value="mensagens">
              <Activity className="h-4 w-4 mr-2" />
              Mensagens
            </TabsTrigger>
          </TabsList>

          {/* Relatório de Agendamentos */}
          <TabsContent value="agendamentos">
            <Card className="bg-muted/30 border-muted/50 rounded-xl shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Relatório de Agendamentos</CardTitle>
                    <CardDescription>
                      {filteredAgendamentos.length} agendamentos encontrados
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        exportToCSV(filteredAgendamentos, "agendamentos")
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        exportToPDF(
                          filteredAgendamentos.map((a) => ({
                            data: format(
                              new Date(a.inicio),
                              "dd/MM/yyyy HH:mm",
                              { locale: ptBR },
                            ),
                            paciente: a.pacientes?.nome,
                            servico: a.servicos?.nome,
                            profissional: a.profiles?.nome || "-",
                            status: a.status,
                            confirmado: a.confirmado ? "Sim" : "Não",
                          })),
                          "agendamentos",
                          [
                            "data",
                            "paciente",
                            "servico",
                            "profissional",
                            "status",
                            "confirmado",
                          ],
                          [
                            "Data/Hora",
                            "Paciente",
                            "Serviço",
                            "Profissional",
                            "Status",
                            "Confirmado",
                          ],
                        )
                      }
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar paciente..."
                      value={filterAgendamento.search}
                      onChange={(e) =>
                        setFilterAgendamento({
                          ...filterAgendamento,
                          search: e.target.value,
                        })
                      }
                      className="pl-10"
                    />
                  </div>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filterAgendamento.status}
                    onChange={(e) =>
                      setFilterAgendamento({
                        ...filterAgendamento,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="">Todos os status</option>
                    <option value="agendado">Agendado</option>
                    <option value="confirmado">Confirmado</option>
                    <option value="realizado">Realizado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="faltou">Faltou</option>
                  </select>
                  <Input
                    type="date"
                    placeholder="Data início"
                    value={filterAgendamento.dateFrom}
                    onChange={(e) =>
                      setFilterAgendamento({
                        ...filterAgendamento,
                        dateFrom: e.target.value,
                      })
                    }
                  />
                  <Input
                    type="date"
                    placeholder="Data fim"
                    value={filterAgendamento.dateTo}
                    onChange={(e) =>
                      setFilterAgendamento({
                        ...filterAgendamento,
                        dateTo: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() =>
                              handleSort(
                                "inicio",
                                sortAgendamento,
                                setSortAgendamento,
                              )
                            }
                          >
                            Data/Hora
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() =>
                              handleSort(
                                "pacientes.nome",
                                sortAgendamento,
                                setSortAgendamento,
                              )
                            }
                          >
                            Paciente
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Profissional</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() =>
                              handleSort(
                                "status",
                                sortAgendamento,
                                setSortAgendamento,
                              )
                            }
                          >
                            Status
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Confirmado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortData(
                        agendamentos.filter((a) => {
                          const matchSearch =
                            !filterAgendamento.search ||
                            a.pacientes?.nome
                              ?.toLowerCase()
                              .includes(filterAgendamento.search.toLowerCase());
                          const matchStatus =
                            !filterAgendamento.status ||
                            a.status === filterAgendamento.status;
                          const matchDateFrom =
                            !filterAgendamento.dateFrom ||
                            new Date(a.inicio) >=
                              new Date(filterAgendamento.dateFrom);
                          const matchDateTo =
                            !filterAgendamento.dateTo ||
                            new Date(a.inicio) <=
                              new Date(filterAgendamento.dateTo);
                          return (
                            matchSearch &&
                            matchStatus &&
                            matchDateFrom &&
                            matchDateTo
                          );
                        }),
                        sortAgendamento.field,
                        sortAgendamento.direction,
                      ).map((agendamento) => (
                        <TableRow key={agendamento.id}>
                          <TableCell className="selectable-text">
                            {format(
                              new Date(agendamento.inicio),
                              "dd/MM/yyyy HH:mm",
                              { locale: ptBR },
                            )}
                          </TableCell>
                          <TableCell className="selectable-text">
                            {agendamento.pacientes?.nome}
                          </TableCell>
                          <TableCell className="selectable-text">
                            {agendamento.servicos?.nome}
                          </TableCell>
                          <TableCell className="selectable-text">
                            {agendamento.profiles?.nome || "-"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(agendamento.status)}
                          </TableCell>
                          <TableCell>
                            {agendamento.confirmado ? (
                              <Badge variant="success">Sim</Badge>
                            ) : (
                              <Badge variant="secondary">Não</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatório de Pacientes */}
          <TabsContent value="pacientes">
            <Card className="bg-muted/30 border-muted/50 rounded-xl shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Relatório de Pacientes</CardTitle>
                    <CardDescription>
                      {filteredPacientes.length} pacientes encontrados
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        exportToCSV(filteredPacientes, "pacientes")
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        exportToPDF(
                          filteredPacientes.map((p) => ({
                            nome: p.nome,
                            telefone: p.telefone,
                            email: p.email || "-",
                            risco: `${p.risco_no_show}%`,
                            faltas: p.historico_faltas,
                            cadastro: format(
                              new Date(p.created_at),
                              "dd/MM/yyyy",
                              { locale: ptBR },
                            ),
                          })),
                          "pacientes",
                          [
                            "nome",
                            "telefone",
                            "email",
                            "risco",
                            "faltas",
                            "cadastro",
                          ],
                          [
                            "Nome",
                            "Telefone",
                            "Email",
                            "Risco No-Show",
                            "Faltas",
                            "Cadastro",
                          ],
                        )
                      }
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar paciente..."
                      value={filterPaciente.search}
                      onChange={(e) =>
                        setFilterPaciente({
                          ...filterPaciente,
                          search: e.target.value,
                        })
                      }
                      className="pl-10"
                    />
                  </div>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filterPaciente.risco}
                    onChange={(e) =>
                      setFilterPaciente({
                        ...filterPaciente,
                        risco: e.target.value,
                      })
                    }
                  >
                    <option value="">Todos os riscos</option>
                    <option value="baixo">Baixo (≤40%)</option>
                    <option value="medio">Médio (41-70%)</option>
                    <option value="alto">Alto (&gt;70%)</option>
                  </select>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() =>
                              handleSort("nome", sortPaciente, setSortPaciente)
                            }
                          >
                            Nome
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() =>
                              handleSort(
                                "risco_no_show",
                                sortPaciente,
                                setSortPaciente,
                              )
                            }
                          >
                            Risco No-Show
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() =>
                              handleSort(
                                "historico_faltas",
                                sortPaciente,
                                setSortPaciente,
                              )
                            }
                          >
                            Faltas
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() =>
                              handleSort(
                                "created_at",
                                sortPaciente,
                                setSortPaciente,
                              )
                            }
                          >
                            Cadastro
                            <ArrowUpDown className="ml-2 h-3 w-3" />
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortData(
                        filteredPacientes,
                        sortPaciente.field,
                        sortPaciente.direction,
                      ).map((paciente) => (
                        <TableRow key={paciente.id}>
                          <TableCell className="selectable-text">
                            {paciente.nome}
                          </TableCell>
                          <TableCell className="selectable-text">
                            {paciente.telefone}
                          </TableCell>
                          <TableCell className="selectable-text">
                            {paciente.email || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                paciente.risco_no_show > 70
                                  ? "destructive"
                                  : paciente.risco_no_show > 40
                                    ? "warning"
                                    : "success"
                              }
                            >
                              {paciente.risco_no_show}%
                            </Badge>
                          </TableCell>
                          <TableCell>{paciente.historico_faltas}</TableCell>
                          <TableCell className="selectable-text">
                            {format(
                              new Date(paciente.created_at),
                              "dd/MM/yyyy",
                              { locale: ptBR },
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatório de Profissionais */}
          <TabsContent value="profissionais">
            <Card className="bg-muted/30 border-muted/50 rounded-xl shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Relatório de Profissionais</CardTitle>
                    <CardDescription>
                      {
                        profissionais.filter((p) => {
                          const matchSearch =
                            !filterProfissional.search ||
                            p.nome
                              ?.toLowerCase()
                              .includes(
                                filterProfissional.search.toLowerCase(),
                              );
                          const matchEsp =
                            !filterProfissional.especialidade ||
                            p.especialidades?.nome
                              ?.toLowerCase()
                              .includes(
                                filterProfissional.especialidade.toLowerCase(),
                              );
                          return matchSearch && matchEsp;
                        }).length
                      }{" "}
                      profissionais encontrados
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        exportToCSV(filteredProfissionais, "profissionais")
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        exportToPDF(
                          filteredProfissionais.map((p) => ({
                            nome: p.nome,
                            email: p.email,
                            telefone: p.telefone || "-",
                            especialidade: p.especialidades?.nome || "-",
                            registro: `${p.conselho_profissional} ${p.numero_registro}`,
                            cadastro: format(
                              new Date(p.created_at),
                              "dd/MM/yyyy",
                              { locale: ptBR },
                            ),
                          })),
                          "profissionais",
                          [
                            "nome",
                            "email",
                            "telefone",
                            "especialidade",
                            "registro",
                            "cadastro",
                          ],
                          [
                            "Nome",
                            "Email",
                            "Telefone",
                            "Especialidade",
                            "Registro",
                            "Cadastro",
                          ],
                        )
                      }
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar profissional..."
                      value={filterProfissional.search}
                      onChange={(e) =>
                        setFilterProfissional({
                          ...filterProfissional,
                          search: e.target.value,
                        })
                      }
                      className="pl-10"
                    />
                  </div>
                  <Input
                    placeholder="Filtrar por especialidade..."
                    value={filterProfissional.especialidade}
                    onChange={(e) =>
                      setFilterProfissional({
                        ...filterProfissional,
                        especialidade: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Especialidade</TableHead>
                        <TableHead>Registro</TableHead>
                        <TableHead>Cadastro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProfissionais.map((prof) => (
                        <TableRow key={prof.id}>
                          <TableCell className="font-medium">
                            {prof.nome}
                          </TableCell>
                          <TableCell>{prof.email}</TableCell>
                          <TableCell>{prof.telefone || "-"}</TableCell>
                          <TableCell>
                            {prof.especialidades?.nome || "-"}
                          </TableCell>
                          <TableCell>
                            {prof.conselho_profissional} {prof.numero_registro}
                          </TableCell>
                          <TableCell>
                            {format(new Date(prof.created_at), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatório de Confirmações */}
          <TabsContent value="confirmacoes">
            <Card className="bg-muted/30 border-muted/50 rounded-xl shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Relatório de Confirmações</CardTitle>
                    <CardDescription>
                      {filteredConfirmacoes.length} confirmações encontradas
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        exportToCSV(filteredConfirmacoes, "confirmacoes")
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        exportToPDF(
                          confirmacoes
                            .filter((c) => {
                              const matchSearch =
                                !filterConfirmacao.search ||
                                c.pacientes?.nome
                                  ?.toLowerCase()
                                  .includes(
                                    filterConfirmacao.search.toLowerCase(),
                                  );
                              const matchDateFrom =
                                !filterConfirmacao.dateFrom ||
                                new Date(c.confirmado_em) >=
                                  new Date(filterConfirmacao.dateFrom);
                              const matchDateTo =
                                !filterConfirmacao.dateTo ||
                                new Date(c.confirmado_em) <=
                                  new Date(filterConfirmacao.dateTo);
                              return (
                                matchSearch && matchDateFrom && matchDateTo
                              );
                            })
                            .map((c) => ({
                              confirmacao: c.confirmado_em
                                ? format(
                                    new Date(c.confirmado_em),
                                    "dd/MM/yyyy HH:mm",
                                    { locale: ptBR },
                                  )
                                : "-",
                              paciente: c.pacientes?.nome,
                              telefone: c.pacientes?.telefone,
                              servico: c.servicos?.nome,
                              consulta: format(
                                new Date(c.inicio),
                                "dd/MM/yyyy HH:mm",
                                { locale: ptBR },
                              ),
                            })),
                          "confirmacoes",
                          [
                            "confirmacao",
                            "paciente",
                            "telefone",
                            "servico",
                            "consulta",
                          ],
                          [
                            "Data Confirmação",
                            "Paciente",
                            "Telefone",
                            "Serviço",
                            "Data Consulta",
                          ],
                        )
                      }
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar paciente..."
                      value={filterConfirmacao.search}
                      onChange={(e) =>
                        setFilterConfirmacao({
                          ...filterConfirmacao,
                          search: e.target.value,
                        })
                      }
                      className="pl-10"
                    />
                  </div>
                  <Input
                    type="date"
                    placeholder="Data início"
                    value={filterConfirmacao.dateFrom}
                    onChange={(e) =>
                      setFilterConfirmacao({
                        ...filterConfirmacao,
                        dateFrom: e.target.value,
                      })
                    }
                  />
                  <Input
                    type="date"
                    placeholder="Data fim"
                    value={filterConfirmacao.dateTo}
                    onChange={(e) =>
                      setFilterConfirmacao({
                        ...filterConfirmacao,
                        dateTo: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data Confirmação</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Data Consulta</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredConfirmacoes.map((conf) => (
                        <TableRow key={conf.id}>
                          <TableCell>
                            {conf.confirmado_em
                              ? format(
                                  new Date(conf.confirmado_em),
                                  "dd/MM/yyyy HH:mm",
                                  { locale: ptBR },
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>{conf.pacientes?.nome}</TableCell>
                          <TableCell>{conf.pacientes?.telefone}</TableCell>
                          <TableCell>{conf.servicos?.nome}</TableCell>
                          <TableCell>
                            {format(new Date(conf.inicio), "dd/MM/yyyy HH:mm", {
                              locale: ptBR,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatório de Lista de Espera */}
          <TabsContent value="lista-espera">
            <Card className="bg-muted/30 border-muted/50 rounded-xl shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Relatório de Lista de Espera</CardTitle>
                    <CardDescription>
                      {filteredListaEspera.length} pacientes encontrados
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        exportToCSV(filteredListaEspera, "lista-espera")
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        exportToPDF(
                          filteredListaEspera.map((l) => ({
                            paciente: l.pacientes?.nome,
                            telefone: l.pacientes?.telefone,
                            servico: l.servicos?.nome || "Qualquer",
                            prioridade: l.prioridade,
                            cadastro: format(
                              new Date(l.created_at),
                              "dd/MM/yyyy",
                              { locale: ptBR },
                            ),
                          })),
                          "lista-espera",
                          [
                            "paciente",
                            "telefone",
                            "servico",
                            "prioridade",
                            "cadastro",
                          ],
                          [
                            "Paciente",
                            "Telefone",
                            "Serviço",
                            "Prioridade",
                            "Data Cadastro",
                          ],
                        )
                      }
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar paciente..."
                      value={filterListaEspera.search}
                      onChange={(e) =>
                        setFilterListaEspera({
                          ...filterListaEspera,
                          search: e.target.value,
                        })
                      }
                      className="pl-10"
                    />
                  </div>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filterListaEspera.prioridade}
                    onChange={(e) =>
                      setFilterListaEspera({
                        ...filterListaEspera,
                        prioridade: e.target.value,
                      })
                    }
                  >
                    <option value="">Todas prioridades</option>
                    <option value="baixa">Baixa (≤2)</option>
                    <option value="media">Média (3-5)</option>
                    <option value="alta">Alta (&gt;5)</option>
                  </select>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Data Cadastro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredListaEspera.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.pacientes?.nome}</TableCell>
                          <TableCell>{item.pacientes?.telefone}</TableCell>
                          <TableCell>
                            {item.servicos?.nome || "Qualquer"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.prioridade > 5
                                  ? "destructive"
                                  : item.prioridade > 2
                                    ? "warning"
                                    : "secondary"
                              }
                            >
                              {item.prioridade}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(item.created_at), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatório de Alertas */}
          <TabsContent value="alertas">
            <Card className="bg-muted/30 border-muted/50 rounded-xl shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Relatório de Alertas de Risco</CardTitle>
                    <CardDescription>
                      {filteredAlertas.length} alertas encontrados
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => exportToCSV(filteredAlertas, "alertas")}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        exportToPDF(
                          filteredAlertas.map((a) => ({
                            data: format(
                              new Date(a.created_at),
                              "dd/MM/yyyy HH:mm",
                              { locale: ptBR },
                            ),
                            tipo: a.tipo,
                            titulo: a.titulo,
                            paciente: a.pacientes?.nome || "-",
                            prioridade: a.prioridade,
                            status: a.resolvido ? "Resolvido" : "Pendente",
                          })),
                          "alertas",
                          [
                            "data",
                            "tipo",
                            "titulo",
                            "paciente",
                            "prioridade",
                            "status",
                          ],
                          [
                            "Data",
                            "Tipo",
                            "Título",
                            "Paciente",
                            "Prioridade",
                            "Status",
                          ],
                        )
                      }
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar alertas..."
                      value={filterAlerta.search}
                      onChange={(e) =>
                        setFilterAlerta({
                          ...filterAlerta,
                          search: e.target.value,
                        })
                      }
                      className="pl-10"
                    />
                  </div>
                  <Input
                    placeholder="Filtrar por tipo..."
                    value={filterAlerta.tipo}
                    onChange={(e) =>
                      setFilterAlerta({ ...filterAlerta, tipo: e.target.value })
                    }
                  />
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filterAlerta.prioridade}
                    onChange={(e) =>
                      setFilterAlerta({
                        ...filterAlerta,
                        prioridade: e.target.value,
                      })
                    }
                  >
                    <option value="">Todas prioridades</option>
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Paciente</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlertas.map((alerta) => (
                        <TableRow key={alerta.id}>
                          <TableCell>
                            {format(
                              new Date(alerta.created_at),
                              "dd/MM/yyyy HH:mm",
                              { locale: ptBR },
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{alerta.tipo}</Badge>
                          </TableCell>
                          <TableCell>{alerta.titulo}</TableCell>
                          <TableCell>{alerta.pacientes?.nome || "-"}</TableCell>
                          <TableCell>
                            {getPrioridadeBadge(alerta.prioridade)}
                          </TableCell>
                          <TableCell>
                            {alerta.resolvido ? (
                              <Badge variant="success">Resolvido</Badge>
                            ) : (
                              <Badge variant="warning">Pendente</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatório de Mensagens */}
          <TabsContent value="mensagens">
            <Card className="bg-muted/30 border-muted/50 rounded-xl shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Relatório de Mensagens</CardTitle>
                    <CardDescription>
                      {filteredMensagens.length} mensagens encontradas
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        exportToCSV(filteredMensagens, "mensagens")
                      }
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() =>
                        exportToPDF(
                          filteredMensagens.map((m) => ({
                            data: format(
                              new Date(m.created_at),
                              "dd/MM/yyyy HH:mm",
                              { locale: ptBR },
                            ),
                            canal: m.canal,
                            destinatario: m.destinatario,
                            status: m.status,
                            template: m.template_usado || "-",
                          })),
                          "mensagens",
                          [
                            "data",
                            "canal",
                            "destinatario",
                            "status",
                            "template",
                          ],
                          [
                            "Data",
                            "Canal",
                            "Destinatário",
                            "Status",
                            "Template",
                          ],
                        )
                      }
                    >
                      <FileDown className="h-4 w-4 mr-2" />
                      Exportar PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar destinatário..."
                      value={filterMensagem.search}
                      onChange={(e) =>
                        setFilterMensagem({
                          ...filterMensagem,
                          search: e.target.value,
                        })
                      }
                      className="pl-10"
                    />
                  </div>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filterMensagem.canal}
                    onChange={(e) =>
                      setFilterMensagem({
                        ...filterMensagem,
                        canal: e.target.value,
                      })
                    }
                  >
                    <option value="">Todos canais</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="sms">SMS</option>
                    <option value="email">Email</option>
                  </select>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filterMensagem.status}
                    onChange={(e) =>
                      setFilterMensagem({
                        ...filterMensagem,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="">Todos status</option>
                    <option value="enviado">Enviado</option>
                    <option value="pendente">Pendente</option>
                    <option value="entregue">Entregue</option>
                    <option value="erro">Erro</option>
                  </select>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Canal</TableHead>
                        <TableHead>Destinatário</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Template</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMensagens.map((msg) => (
                        <TableRow key={msg.id}>
                          <TableCell>
                            {format(
                              new Date(msg.created_at),
                              "dd/MM/yyyy HH:mm",
                              { locale: ptBR },
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{msg.canal}</Badge>
                          </TableCell>
                          <TableCell>{msg.destinatario}</TableCell>
                          <TableCell>
                            {msg.status === "enviado" && (
                              <Badge variant="success">Enviado</Badge>
                            )}
                            {msg.status === "pendente" && (
                              <Badge variant="warning">Pendente</Badge>
                            )}
                            {msg.status === "entregue" && (
                              <Badge variant="outline">Entregue</Badge>
                            )}
                            {msg.status === "erro" && (
                              <Badge variant="destructive">Erro</Badge>
                            )}
                          </TableCell>
                          <TableCell>{msg.template_usado || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
