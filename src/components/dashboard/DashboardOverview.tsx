import React, { useState, useEffect } from "react";
import { StatsCard } from "./StatsCard";
import { AppointmentCard } from "./AppointmentCard";
import { WhatsAppCreditsWidget } from "./WhatsAppCreditsWidget";
import {
  Calendar,
  Users,
  CheckCircle,
  AlertTriangle,
  Clock,
  MessageSquare
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
    waitingList: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Realtime subscription
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agenda'
        },
        () => {
          fetchDashboardData();
        }
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
        .from('agenda')
        .select(`
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
        `)
        .gte('inicio', dayStart.toISOString())
        .lte('inicio', dayEnd.toISOString())
        .order('inicio');

      if (todayError) throw todayError;

      // Calcular estatísticas
      const stats = {
        totalAppointments: todayAppointments?.length || 0,
        confirmed: todayAppointments?.filter(apt => apt.confirmado).length || 0,
        pending: todayAppointments?.filter(apt => !apt.confirmado && apt.status === 'agendado').length || 0,
        completed: todayAppointments?.filter(apt => apt.status === 'concluido').length || 0,
        noShows: todayAppointments?.filter(apt => apt.status === 'falta').length || 0,
        waitingList: 0 // Será atualizado depois com tabela lista_espera
      };

      setTodayStats(stats);

      // Buscar próximas consultas (próximas 2 horas)
      const { data: upcoming, error: upcomingError } = await supabase
        .from('agenda')
        .select(`
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
        `)
        .gte('inicio', now.toISOString())
        .lte('inicio', nextTwoHours.toISOString())
        .eq('status', 'agendado')
        .order('inicio')
        .limit(4);

      if (upcomingError) throw upcomingError;

      // Formatar dados para o componente
      const formattedUpcoming = (upcoming || []).map((apt: any) => {
        const risco = apt.pacientes?.risco_no_show || 0;
        let status: "confirmed" | "pending" | "risk-high" | "risk-medium" = "pending";

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
          time: format(new Date(apt.inicio), 'HH:mm'),
          doctor: apt.profiles?.nome || "Profissional",
          status,
          phone: apt.pacientes?.telefone || ""
        };
      });

      setUpcomingAppointments(formattedUpcoming);

      // Buscar lista de espera
      const { data: waitingList, error: waitingError } = await supabase
        .from('lista_espera')
        .select('id')
        .eq('ativo', true);

      if (!waitingError && waitingList) {
        setTodayStats(prev => ({ ...prev, waitingList: waitingList.length }));
      }

      // Gerar alertas dinâmicos
      const generatedAlerts = [];

      // Alerta de alto risco
      const highRiskApt = upcoming?.find((apt: any) => apt.pacientes?.risco_no_show > 70);
      if (highRiskApt) {
        generatedAlerts.push({
          type: 'risk-high',
          title: 'Alto Risco de Falta',
          message: `${highRiskApt.pacientes?.nome} (${format(new Date(highRiskApt.inicio), 'HH:mm')}) tem histórico de ${highRiskApt.pacientes?.historico_faltas || 0} faltas recentes.`,
          actions: ['Ligar Agora', 'Enviar WhatsApp']
        });
      }

      // Alerta de confirmações pendentes
      if (stats.pending > 0) {
        generatedAlerts.push({
          type: 'pending',
          title: 'Confirmações Pendentes',
          message: `${stats.pending} pacientes ainda não confirmaram presença para hoje.`,
          actions: ['Enviar Lembretes']
        });
      }

      // Alerta de sucesso se não houver faltas
      if (stats.noShows === 0 && stats.completed > 0) {
        generatedAlerts.push({
          type: 'success',
          title: 'Desempenho Excelente',
          message: 'Nenhuma falta registrada hoje! Continue o bom trabalho.',
          actions: []
        });
      }

      setAlerts(generatedAlerts);

    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid - Only show when there's data */}
      {todayStats.totalAppointments > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4" data-tour="dashboard-stats">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Próximas Consultas (Próximas 2h)
          </h3>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">Nenhuma consulta nas próximas 2 horas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppointments.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  {...appointment}
                />
              ))}
            </div>
          )}
        </div>

        {/* Widget de Créditos WhatsApp */}
        <div>
          <WhatsAppCreditsWidget />
        </div>
      </div>

      {/* Painel de Alertas */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Alertas e Ações Recomendadas
        </h3>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Nenhum alerta no momento</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${alert.type === 'risk-high'
                    ? 'bg-destructive-light border-destructive/20'
                    : alert.type === 'pending'
                      ? 'bg-warning-light border-warning/20'
                      : 'bg-success-light border-success/20'
                  }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {alert.type === 'risk-high' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                  {alert.type === 'pending' && <Clock className="h-5 w-5 text-warning" />}
                  {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-success" />}
                  <h4 className={`font-medium ${alert.type === 'risk-high'
                      ? 'text-destructive'
                      : alert.type === 'pending'
                        ? 'text-warning'
                        : 'text-success'
                    }`}>
                    {alert.title}
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {alert.message}
                </p>
                {alert.actions.length > 0 && (
                  <div className="flex gap-2">
                    {alert.actions.map((action: string, i: number) => (
                      <button
                        key={i}
                        className={`px-3 py-1 text-xs rounded ${i === 0
                            ? alert.type === 'risk-high'
                              ? 'bg-destructive text-destructive-foreground'
                              : 'bg-warning text-warning-foreground'
                            : 'bg-background border border-current'
                          }`}
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
