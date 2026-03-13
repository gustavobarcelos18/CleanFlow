import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Clock,
  User,
  CheckCircle2,
  Circle,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PacientesDoDiaProps {
  onSelectPaciente: (agendamento: any) => void;
}

export function PacientesDoDia({ onSelectPaciente }: PacientesDoDiaProps) {
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [salaFilter, setSalaFilter] = useState<string>("todas");
  const [servicoFilter, setServicoFilter] = useState<string>("todos");

  const loadAgendamentos = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      const { data, error } = await supabase
        .from("agenda")
        .select(
          `
          *,
          pacientes(id, nome, telefone, email),
          servicos(nome, duracao_minutos)
        `,
        )
        .eq("profissional_id", user.id)
        .gte("inicio", hoje.toISOString())
        .lt("inicio", amanha.toISOString())
        .neq("status", "cancelado")
        .order("inicio", { ascending: true });

      if (error) throw error;

      setAgendamentos(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar agendamentos:", error);
      toast.error("Erro ao carregar lista de pacientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgendamentos();
  }, [loadAgendamentos]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "concluido":
        return "bg-success/10 text-success border-success/20";
      case "em_atendimento":
        return "bg-primary/10 text-primary border-primary/20";
      case "agendado":
        return "bg-muted/50 text-muted-foreground border-border";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "concluido":
        return <CheckCircle2 className="h-5 w-5" />;
      case "em_atendimento":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Circle className="h-5 w-5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      agendado: "Aguardando",
      em_atendimento: "Em Atendimento",
      concluido: "Atendido",
    };
    return labels[status] || status;
  };

  // Extrair salas e serviços únicos
  const salas = useMemo(() => {
    const uniqueSalas = [
      ...new Set(agendamentos.map((a) => a.sala).filter(Boolean)),
    ];
    return uniqueSalas;
  }, [agendamentos]);

  const servicos = useMemo(() => {
    const uniqueServicos = [
      ...new Set(agendamentos.map((a) => a.servicos?.nome).filter(Boolean)),
    ];
    return uniqueServicos;
  }, [agendamentos]);

  // Filtrar agendamentos
  const agendamentosFiltrados = useMemo(() => {
    return agendamentos.filter((agendamento) => {
      // Filtro de busca por nome
      if (
        searchTerm &&
        !agendamento.pacientes?.nome
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Filtro de status
      if (statusFilter !== "todos" && agendamento.status !== statusFilter) {
        return false;
      }

      // Filtro de sala
      if (salaFilter !== "todas" && agendamento.sala !== salaFilter) {
        return false;
      }

      // Filtro de serviço
      if (
        servicoFilter !== "todos" &&
        agendamento.servicos?.nome !== servicoFilter
      ) {
        return false;
      }

      return true;
    });
  }, [agendamentos, searchTerm, statusFilter, salaFilter, servicoFilter]);

  // Contadores por status
  const contadores = useMemo(() => {
    return {
      aguardando: agendamentos.filter((a) => a.status === "agendado").length,
      em_atendimento: agendamentos.filter((a) => a.status === "em_atendimento")
        .length,
      atendido: agendamentos.filter((a) => a.status === "concluido").length,
      total: agendamentos.length,
    };
  }, [agendamentos]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (agendamentos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">
              Nenhum paciente agendado para hoje
            </p>
            <p className="text-sm mt-2">Sua agenda está livre</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contadores de Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-muted/30 border-muted/50 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Circle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aguardando</p>
                <p className="text-2xl font-bold">{contadores.aguardando}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-muted/50 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Atendimento</p>
                <p className="text-2xl font-bold">
                  {contadores.em_atendimento}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-success/5 border-success/20 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atendidos</p>
                <p className="text-2xl font-bold text-success">
                  {contadores.atendido}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30 border-muted/50 shadow-sm rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{contadores.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="shadow-sm border-muted/50 rounded-xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Filtros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Busca por nome */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filtro de Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="agendado">Aguardando</SelectItem>
                <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
                <SelectItem value="concluido">Atendido</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro de Sala */}
            <Select value={salaFilter} onValueChange={setSalaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Sala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as salas</SelectItem>
                {salas.map((sala) => (
                  <SelectItem key={sala} value={sala}>
                    {sala}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro de Serviço */}
            <Select value={servicoFilter} onValueChange={setServicoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Serviço" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os serviços</SelectItem>
                {servicos.map((servico) => (
                  <SelectItem key={servico} value={servico}>
                    {servico}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botão para limpar filtros */}
          {(searchTerm ||
            statusFilter !== "todos" ||
            salaFilter !== "todas" ||
            servicoFilter !== "todos") && (
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("todos");
                  setSalaFilter("todas");
                  setServicoFilter("todos");
                }}
              >
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Pacientes */}
      {agendamentosFiltrados.length === 0 ? (
        <Card className="border-muted/50 shadow-sm rounded-xl">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum paciente encontrado</p>
              <p className="text-sm mt-2">Tente ajustar os filtros</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {agendamentosFiltrados.map((agendamento) => (
            <Card
              key={agendamento.id}
              className={`bg-muted/30 border-muted/50 rounded-xl shadow-sm transition-all hover:bg-muted/50 hover:shadow-md cursor-pointer ${
                agendamento.status === "concluido" ? "opacity-75" : ""
              }`}
              onClick={() => onSelectPaciente(agendamento)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${getStatusColor(agendamento.status)}`}
                      >
                        {getStatusIcon(agendamento.status)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {agendamento.pacientes?.nome}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {agendamento.servicos?.nome}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>
                          {format(new Date(agendamento.inicio), "HH:mm", {
                            locale: ptBR,
                          })}
                          {agendamento.servicos?.duracao_minutos &&
                            ` (${agendamento.servicos.duracao_minutos}min)`}
                        </span>
                      </div>
                      {agendamento.sala && (
                        <Badge variant="outline">
                          Sala: {agendamento.sala}
                        </Badge>
                      )}
                    </div>

                    {agendamento.notas && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {agendamento.notas}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <Badge className={getStatusColor(agendamento.status)}>
                      {getStatusLabel(agendamento.status)}
                    </Badge>
                    <Button size="sm" variant="default">
                      {agendamento.status === "concluido"
                        ? "Ver Prontuário"
                        : "Iniciar Atendimento"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
