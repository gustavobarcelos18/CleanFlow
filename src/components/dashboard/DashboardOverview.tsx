import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { StatsCard } from "./StatsCard";
import { AppointmentCard } from "./AppointmentCard";
import { WhatsAppCreditsWidget } from "./WhatsAppCreditsWidget";
import {
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  MessageSquare,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay, addHours } from "date-fns";

export function DashboardOverview() {
  const [todayStats, setTodayStats] = useState({
    totalAppointments: 0,
    confirmed: 0,
    pending: 0,
    completed: 0,
    noShows: 0,
    waitingList: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Realtime subscription
    const channel = supabase
      .channel("dashboard-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agenda",
        },
        () => {
          fetchDashboardData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const now = new Date();
      const dayStart = startOfDay(now);
      const dayEnd = endOfDay(now);
      const nextTwoHours = addHours(now, 2);

      // Buscar agendamentos de hoje
      const { data: todayAppointments, error: todayError } = await supabase
        .from("agenda")
        .select(
          `
          id,
          status,
          confirmado,
          inicio,
          fim,
          pacientes (
            nome,
            telefone,
            historico_faltas,
            risco_no_show
          ),
          profiles:profissional_id (
            nome
          )
        `,
        )
        .gte("inicio", dayStart.toISOString())
        .lte("inicio", dayEnd.toISOString())
        .order("inicio");

      if (todayError) throw todayError;

      // Calcular estatísticas
      const stats = {
        totalAppointments: todayAppointments?.length || 0,
        confirmed:
          todayAppointments?.filter((apt) => apt.confirmado).length || 0,
        pending:
          todayAppointments?.filter(
            (apt) => !apt.confirmado && apt.status === "agendado",
          ).length || 0,
        completed:
          todayAppointments?.filter((apt) => apt.status === "concluido")
            .length || 0,
        noShows:
          todayAppointments?.filter((apt) => apt.status === "falta").length ||
          0,
        waitingList: 0, // Será atualizado depois com tabela lista_espera
      };

      setTodayStats(stats);

      // Buscar próximas consultas (próximas 2 horas)
      const { data: upcoming, error: upcomingError } = await supabase
        .from("agenda")
        .select(
          `
          id,
          inicio,
          status,
          confirmado,
          pacientes (
            nome,
            telefone,
            historico_faltas,
            risco_no_show
          ),
          profiles:profissional_id (
            nome
          )
        `,
        )
        .gte("inicio", now.toISOString())
        .lte("inicio", nextTwoHours.toISOString())
        .eq("status", "agendado")
        .order("inicio")
        .limit(4);

      if (upcomingError) throw upcomingError;

      // Formatar dados para o componente
      const formattedUpcoming = (upcoming || []).map((apt: any) => {
        const risco = apt.pacientes?.risco_no_show || 0;
        let status: "confirmed" | "pending" | "risk-high" | "risk-medium" =
          "pending";

        if (apt.confirmado) {
          status = "confirmed";
        } else if (risco > 70) {
          status = "risk-high";
        } else if (risco > 30) {
          status = "risk-medium";
        }

        return {
          id: apt.id,
          patientName: apt.pacientes?.nome || "Paciente",
          time: format(new Date(apt.inicio), "HH:mm"),
          doctor: apt.profiles?.nome || "Profissional",
          status,
          phone: apt.pacientes?.telefone || "",
        };
      });

      setUpcomingAppointments(formattedUpcoming);

      // Buscar lista de espera
      const { data: waitingList, error: waitingError } = await supabase
        .from("lista_espera")
        .select("id")
        .eq("ativo", true);

      if (!waitingError && waitingList) {
        setTodayStats((prev) => ({ ...prev, waitingList: waitingList.length }));
      }

      // Gerar alertas dinâmicos
      const generatedAlerts = [];

      // Alerta de alto risco
      const highRiskApt = upcoming?.find(
        (apt: any) => apt.pacientes?.risco_no_show > 70,
      );
      if (highRiskApt) {
        generatedAlerts.push({
          type: "risk-high",
          title: "Alto Risco de Falta",
          message: `${highRiskApt.pacientes?.nome} (${format(new Date(highRiskApt.inicio), "HH:mm")}) tem histórico de ${highRiskApt.pacientes?.historico_faltas || 0} faltas recentes.`,
          actions: ["Ligar Agora", "Enviar WhatsApp"],
        });
      }

      // Alerta de confirmações pendentes
      if (stats.pending > 0) {
        generatedAlerts.push({
          type: "pending",
          title: "Confirmações Pendentes",
          message: `${stats.pending} pacientes ainda não confirmaram presença para hoje.`,
          actions: ["Enviar Lembretes"],
        });
      }

      // Alerta de sucesso se não houver faltas
      if (stats.noShows === 0 && stats.completed > 0) {
        generatedAlerts.push({
          type: "success",
          title: "Desempenho Excelente",
          message: "Nenhuma falta registrada hoje! Continue o bom trabalho.",
          actions: [],
        });
      }

      setAlerts(generatedAlerts);
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid - Only show when there's data */}
      {todayStats.totalAppointments > 0 && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
          data-tour="dashboard-stats"
        >
          <StatsCard
            title="Total Hoje"
            value={todayStats.totalAppointments}
            icon={Calendar}
            variant="default"
          />
          <StatsCard
            title="Confirmados"
            value={todayStats.confirmed}
            icon={CheckCircle}
            variant="success"
          />
          <StatsCard
            title="Pendentes"
            value={todayStats.pending}
            icon={Clock}
            variant="warning"
          />
          <StatsCard
            title="Realizados"
            value={todayStats.completed}
            icon={Users}
            variant="success"
          />
          <StatsCard
            title="Faltas"
            value={todayStats.noShows}
            icon={AlertTriangle}
            variant="destructive"
          />
          <StatsCard
            title="Lista Espera"
            value={todayStats.waitingList}
            icon={MessageSquare}
            variant="default"
          />
        </div>
      )}

      {/* Próximas Consultas e WhatsApp Credits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-foreground tracking-tight">
              Próximas <span className="text-primary">Consultas</span>
            </h3>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border">
              Próximas 2h
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="p-12 bg-card border border-border rounded-2xl text-center">
              <p className="text-muted-foreground font-medium">
                Nenhuma consulta nas próximas 2 horas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard key={appointment.id} {...appointment} />
              ))}
            </div>
          )}
        </div>

        {/* Widget de Créditos WhatsApp */}
        <div className="space-y-4">
          <h3 className="text-xl font-black text-foreground tracking-tight">
            Mensageria
          </h3>
          <WhatsAppCreditsWidget />
        </div>
      </div>

      {/* Painel de Alertas */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-foreground tracking-tight">
          Alertas e <span className="text-warning">Ações</span>
        </h3>
        {isLoading ? (
          <div className="text-center py-12 bg-card border border-border rounded-2xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 bg-card border border-border rounded-2xl text-center">
            <p className="text-muted-foreground font-medium">
              Nenhum alerta no momento
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={cn(
                  "p-5 rounded-2xl border transition-all duration-300 shadow-lg",
                  alert.type === "risk-high"
                    ? "bg-warning/10 border-warning/20 hover:border-warning/40"
                    : alert.type === "pending"
                      ? "bg-primary/10 border-primary/20 hover:border-primary/40"
                      : "bg-success/10 border-success/20 hover:border-success/40",
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  {alert.type === "risk-high" && (
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  )}
                  {alert.type === "pending" && (
                    <Clock className="h-5 w-5 text-primary" />
                  )}
                  {alert.type === "success" && (
                    <CheckCircle className="h-5 w-5 text-success" />
                  )}
                  <h4
                    className={cn(
                      "font-bold tracking-tight uppercase text-xs",
                      alert.type === "risk-high"
                        ? "text-warning"
                        : alert.type === "pending"
                          ? "text-primary"
                          : "text-success",
                    )}
                  >
                    {alert.title}
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  {alert.message}
                </p>
                {alert.actions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {alert.actions.map((action: string, i: number) => (
                      <button
                        key={i}
                        className={cn(
                          "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all duration-200",
                          i === 0
                            ? alert.type === "risk-high"
                              ? "bg-warning text-warning-foreground shadow-lg hover:scale-105"
                              : "bg-primary text-primary-foreground shadow-lg hover:scale-105"
                            : "bg-muted text-foreground border border-border hover:bg-border/50",
                        )}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
