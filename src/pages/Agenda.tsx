import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DragSchedule } from "@/components/schedule/DragSchedule";
import { AppointmentCard } from "@/components/dashboard/AppointmentCard";
import { NewAppointmentDialog } from "@/components/schedule/NewAppointmentDialog";
import { EditAppointmentDialog } from "@/components/schedule/EditAppointmentDialog";
import { NextDayPreview } from "@/components/schedule/NextDayPreview";
import { MonthlyCalendar } from "@/components/schedule/MonthlyCalendar";
import { DigitalClock } from "@/components/schedule/DigitalClock";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Plus,
  Filter,
  Search,
  Calendar,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProfessionals } from "@/hooks/data/useProfessionals";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLayoutTitle } from "@/hooks/useLayoutTitle";
import {
  format,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  isToday,
  isValid,
  isBefore,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { detectConflict, calculateAdjustments } from "@/lib/scheduleConflicts";
import { useAgendaDia } from "@/hooks/data/useAgendaDia";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Agenda = () => {
  const [viewMode, setViewMode] = useState<"cards" | "timeline">("timeline");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentsWithConflicts, setAppointmentsWithConflicts] = useState<
    any[]
  >([]);
  const [nextDayAppointments, setNextDayAppointments] = useState<any[]>([]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingAppointmentId, setEditingAppointmentId] = useState<
    string | null
  >(null);
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<
    string | null
  >(null);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [rescheduleAppointmentId, setRescheduleAppointmentId] = useState<
    string | null
  >(null);
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [conflictAdjustDialogOpen, setConflictAdjustDialogOpen] =
    useState(false);
  const [conflictAdjustData, setConflictAdjustData] = useState<{
    appointmentId: string;
    newTime: string;
    affectedCount: number;
  } | null>(null);
  const [newAppointmentDialogOpen, setNewAppointmentDialogOpen] =
    useState(false);
  const [newAppointmentTime, setNewAppointmentTime] = useState("");
  const [calendarPopoverOpen, setCalendarPopoverOpen] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] =
    useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: professionalsData } = useProfessionals({ pageSize: 100 });
  const professionals = professionalsData?.data || [];
  const deveMostrarFiltro = professionals.length > 1;

  // Auto-selecionar quando há apenas 1 profissional para não quebrar state
  useEffect(() => {
    if (professionals.length === 1 && selectedProfessionalId !== professionals[0].id) {
      setSelectedProfessionalId(professionals[0].id);
    } else if (professionals.length === 0 && selectedProfessionalId !== "all") {
      setSelectedProfessionalId("all");
    }
  }, [professionals, selectedProfessionalId]);

  const { toast } = useToast();
  const { setTitle, setSubtitle } = useLayoutTitle();

  const {
    data: appointmentsData,
    isLoading: isLoadingAppointments,
    refetch: refetchAppointments,
  } = useAgendaDia({
    date: selectedDate,
    professionalId:
      selectedProfessionalId === "all" ? undefined : selectedProfessionalId,
  });

  const { data: nextDayData, isLoading: isLoadingNextDay } = useAgendaDia({
    date: addDays(selectedDate, 1),
    professionalId:
      selectedProfessionalId === "all" ? undefined : selectedProfessionalId,
  });

  useEffect(() => {
    if (appointmentsData) {
      const isPastDay = isBefore(selectedDate, startOfDay(new Date()));
      const formattedAppointments = appointmentsData.map((apt: any) => {
        const inicioDate = apt?.inicio ? new Date(apt.inicio) : null;
        const fimDate = apt?.fim ? new Date(apt.fim) : null;

        const safeTime =
          inicioDate && isValid(inicioDate)
            ? format(inicioDate, "HH:mm")
            : "--:--";

        const safeDuration =
          inicioDate && fimDate && isValid(inicioDate) && isValid(fimDate)
            ? Math.round((fimDate.getTime() - inicioDate.getTime()) / 60000)
            : 30; // default de 30 min

        // Se o dia já passou, mostramos como concluído visualmente, a menos que esteja cancelado ou seja falta
        let currentStatus = apt.status || "pending";
        // Regra de somente leitura (finalizado ou passado)
        const now = new Date();
        const slotDateTime = new Date(selectedDate);
        if (safeTime !== "--:--") {
          const [hours, minutes] = safeTime.split(":").map(Number);
          slotDateTime.setHours(hours, minutes, 0, 0);
        }
        
        const isExpired = slotDateTime < now;
        if (isExpired && (currentStatus === "pending" || currentStatus === "agendado")) {
          currentStatus = "concluido";
        }
        
        const isLocked = isExpired || currentStatus === "concluido";

        return {
          id: apt.id,
          patientName: apt.pacientes?.nome || "Paciente",
          time: safeTime,
          doctor: apt.profiles?.nome || "Profissional",
          status: currentStatus,
          phone: apt.pacientes?.telefone || "",
          duration: safeDuration,
          ordem: apt.ordem,
          inicio: apt.inicio,
          riskLevel: apt.no_show_risk_level,
          profissional_id: apt.profissional_id,
          readOnly: isLocked,
        };
      });

      setAppointments(formattedAppointments);

      // Detectar conflitos
      const withConflicts = formattedAppointments.map((apt: any) => {
        const aptInicio = new Date(apt.inicio);
        const aptFim = new Date(aptInicio);
        aptFim.setMinutes(aptInicio.getMinutes() + apt.duration);

        const conflict = detectConflict(
          apt.id,
          aptInicio,
          aptFim,
          formattedAppointments,
          apt.profissional_id,
        );

        return {
          ...apt,
          hasConflict: !!conflict,
          conflictMinutes: conflict?.overlapMinutes || 0,
        };
      });

      setAppointmentsWithConflicts(withConflicts);
    }
  }, [appointmentsData]);

  useEffect(() => {
    if (nextDayData) {
      const formattedAppointments = nextDayData.map((apt: any) => {
        const inicioDate = apt?.inicio ? new Date(apt.inicio) : null;
        const fimDate = apt?.fim ? new Date(apt.fim) : null;

        const safeTime =
          inicioDate && isValid(inicioDate)
            ? format(inicioDate, "HH:mm")
            : "--:--";

        const safeDuration =
          inicioDate && fimDate && isValid(inicioDate) && isValid(fimDate)
            ? Math.round((fimDate.getTime() - inicioDate.getTime()) / 60000)
            : 30;

        return {
          id: apt.id,
          patientName: apt.pacientes?.nome || "Paciente",
          time: safeTime,
          doctor: apt.profiles?.nome || "Profissional",
          status: apt.status || "pending",
          phone: apt.pacientes?.telefone || "",
          duration: safeDuration,
          ordem: apt.ordem,
          inicio: apt.inicio,
          profissional_id: apt.profissional_id,
        };
      });

      setNextDayAppointments(formattedAppointments);
    }
  }, [nextDayData]);

  // Configurar realtime
  useEffect(() => {
    const channel = supabase
      .channel("agenda-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agenda",
        },
        (payload) => {
          console.log("Mudança na agenda:", payload);
          // Usar um pequeno delay para evitar múltiplas chamadas simultâneas
          setTimeout(() => {
            // Invalidate queries to trigger refetch
            refetchAppointments();
          }, 100);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate]);

  // Configurar títulos no header
  useEffect(() => {
    setTitle(getPageTitle());
    setSubtitle("Gerenciar consultas e horários");
  }, [selectedDate, setTitle, setSubtitle]);

  // Recarregar dados ao trocar de visualização ou data
  // useEffect(() => {
  //   fetchAppointments();
  //   fetchNextDayAppointments();
  // }, [viewMode, selectedDate]);

  const handleNavigateToNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1));
  };

  const handleNavigateToPreviousDay = () => {
    setSelectedDate((prev) => subDays(prev, 1));
  };

  const handleGoToToday = () => {
    setSelectedDate(new Date());
  };

  const getPageTitle = () => {
    if (isToday(selectedDate)) {
      return "Agenda de Hoje";
    }
    const dayName = format(selectedDate, "EEEE", { locale: ptBR });
    const formattedDate = format(selectedDate, "dd/MM/yyyy", { locale: ptBR });
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);
    return `Agenda do dia ${formattedDate} - ${capitalizedDay}`;
  };

  const timeSlots = [
    { id: "slot-08:00", time: "08:00" },
    { id: "slot-08:30", time: "08:30" },
    { id: "slot-09:00", time: "09:00" },
    { id: "slot-09:30", time: "09:30" },
    { id: "slot-10:00", time: "10:00" },
    { id: "slot-10:30", time: "10:30" },
    { id: "slot-11:00", time: "11:00" },
    { id: "slot-11:30", time: "11:30" },
    { id: "slot-12:00", time: "12:00" },
    { id: "slot-12:30", time: "12:30" },
    { id: "slot-13:00", time: "13:00" },
    { id: "slot-13:30", time: "13:30" },
    { id: "slot-14:00", time: "14:00" },
    { id: "slot-14:30", time: "14:30" },
    { id: "slot-15:00", time: "15:00" },
    { id: "slot-15:30", time: "15:30" },
    { id: "slot-16:00", time: "16:00" },
    { id: "slot-16:30", time: "16:30" },
    { id: "slot-17:00", time: "17:00" },
    { id: "slot-17:30", time: "17:30" },
  ];

  const handleAppointmentMove = async (
    appointmentId: string,
    newTime: string,
  ) => {
    try {
      const appointment = appointments.find((app) => app.id === appointmentId);
      if (!appointment) return;

      const [hours, minutes] = newTime.split(":");
      const newInicio = new Date(appointment.inicio);
      newInicio.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const newFim = new Date(newInicio);
      newFim.setMinutes(newInicio.getMinutes() + appointment.duration);

      // Validar se o horário já passou
      const now = new Date();
      if (newInicio < now) {
        toast({
          title: "Horário inválido",
          description:
            "Não é possível mover um agendamento para um horário que já passou.",
          variant: "destructive",
        });
        return;
      }

      // Detectar conflitos de horário
      const conflictingAppointments = appointments.filter((app) => {
        if (app.id === appointmentId) return false;

        const appInicio = new Date(app.inicio);
        const appFim = new Date(appInicio);
        appFim.setMinutes(appInicio.getMinutes() + app.duration);

        // Verificar se há sobreposição (apenas para o mesmo profissional)
        return (
          app.profissional_id === appointment.profissional_id &&
          newInicio < appFim &&
          newFim > appInicio
        );
      });

      // Atualização otimista - atualizar UI imediatamente
      const updatedAppointments = appointments.map((app) => {
        if (app.id === appointmentId) {
          return {
            ...app,
            time: newTime,
            inicio: newInicio.toISOString(),
          };
        }
        return app;
      });

      // Reajustar appointments conflitantes
      let adjustedAppointments = [...updatedAppointments];
      const dbUpdates: Array<{ id: string; inicio: string; fim: string }> = [
        {
          id: appointmentId,
          inicio: newInicio.toISOString(),
          fim: newFim.toISOString(),
        },
      ];

      if (conflictingAppointments.length > 0) {
        let nextAvailableTime = new Date(newFim);

        for (const conflicting of conflictingAppointments) {
          const conflictInicio = nextAvailableTime;
          const conflictFim = new Date(nextAvailableTime);
          conflictFim.setMinutes(
            conflictInicio.getMinutes() + conflicting.duration,
          );

          // Atualizar no estado local
          adjustedAppointments = adjustedAppointments.map((app) => {
            if (app.id === conflicting.id) {
              return {
                ...app,
                time: format(conflictInicio, "HH:mm"),
                inicio: conflictInicio.toISOString(),
              };
            }
            return app;
          });

          // Adicionar às atualizações do banco
          dbUpdates.push({
            id: conflicting.id,
            inicio: conflictInicio.toISOString(),
            fim: conflictFim.toISOString(),
          });

          nextAvailableTime = conflictFim;
        }
      }

      // Atualizar UI imediatamente (otimista)
      setAppointments(adjustedAppointments);

      // Atualizar também appointmentsWithConflicts para refletir mudança imediata
      const updatedWithConflicts = adjustedAppointments.map((apt) => {
        const aptInicio = new Date(apt.inicio);
        const aptFim = new Date(aptInicio);
        aptFim.setMinutes(aptInicio.getMinutes() + apt.duration);

        const conflict = detectConflict(
          apt.id,
          aptInicio,
          aptFim,
          adjustedAppointments,
          apt.profissional_id,
        );

        return {
          ...apt,
          hasConflict: !!conflict,
          conflictMinutes: conflict?.overlapMinutes || 0,
        };
      });
      setAppointmentsWithConflicts(updatedWithConflicts);

      // Salvar todas as mudanças no banco
      for (const update of dbUpdates) {
        const { error } = await supabase
          .from("agenda")
          .update({
            inicio: update.inicio,
            fim: update.fim,
          })
          .eq("id", update.id);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description:
          conflictingAppointments.length > 0
            ? `Horário atualizado! ${conflictingAppointments.length} consulta(s) reajustada(s).`
            : "Horário atualizado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao mover agendamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o horário.",
        variant: "destructive",
      });
      // Reverter para estado do banco
      refetchAppointments();
    }
  };

  const handleCardReorder = async (appointmentId: string, targetId: string) => {
    // Abrir diálogo para solicitar novo horário
    setRescheduleAppointmentId(appointmentId);
    setRescheduleDialogOpen(true);
  };

  const handleEmptySlotClick = (time: string) => {
    setNewAppointmentTime(time);
    setNewAppointmentDialogOpen(true);
  };

  const handleResolveConflict = async (appointmentId: string) => {
    const appointment = appointmentsWithConflicts.find(
      (apt) => apt.id === appointmentId,
    );
    if (!appointment) return;

    // Mostrar dialog para ajustar horário
    setConflictAdjustData({
      appointmentId,
      newTime: appointment.time,
      affectedCount: 0, // Calculado ao confirmar
    });
    setRescheduleTime(appointment.time);
    setConflictAdjustDialogOpen(true);
  };

  const handleConfirmConflictAdjust = async () => {
    if (!conflictAdjustData || !rescheduleTime) return;

    try {
      const appointment = appointments.find(
        (app) => app.id === conflictAdjustData.appointmentId,
      );
      if (!appointment) return;

      const [hours, minutes] = rescheduleTime.split(":");
      const newInicio = new Date(appointment.inicio);
      newInicio.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Calcular ajustes necessários
      const adjustments = calculateAdjustments(
        conflictAdjustData.appointmentId,
        newInicio,
        appointment.duration,
        appointments,
        appointment.profissional_id,
      );

      // Se há ajustes necessários e o usuário não viu o aviso ainda
      if (adjustments.length > 0 && conflictAdjustData.affectedCount === 0) {
        setConflictAdjustData({
          ...conflictAdjustData,
          affectedCount: adjustments.length,
        });
        return; // Mostrar aviso primeiro
      }

      // Aplicar ajustes
      const updates = [
        {
          id: conflictAdjustData.appointmentId,
          inicio: newInicio,
          fim: new Date(newInicio.getTime() + appointment.duration * 60000),
        },
        ...adjustments,
      ];

      // Atualizar no banco
      for (const update of updates) {
        const { error } = await supabase
          .from("agenda")
          .update({
            inicio: update.inicio.toISOString(),
            fim: update.fim.toISOString(),
          })
          .eq("id", update.id);

        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: `Horário ajustado. ${adjustments.length > 0 ? `${adjustments.length} agendamento(s) posterior(es) também foram ajustados.` : ""}`,
      });

      // Recarregar
      refetchAppointments();
      setConflictAdjustDialogOpen(false);
      setConflictAdjustData(null);
      setRescheduleTime("");
    } catch (error) {
      console.error("Erro ao ajustar horários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível ajustar os horários.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleAppointmentId || !rescheduleTime) {
      toast({
        title: "Erro",
        description: "Por favor, informe o novo horário.",
        variant: "destructive",
      });
      return;
    }

    try {
      const appointment = appointments.find(
        (app) => app.id === rescheduleAppointmentId,
      );
      if (!appointment) return;

      const [hours, minutes] = rescheduleTime.split(":");
      const newInicio = new Date(appointment.inicio);
      newInicio.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const newFim = new Date(newInicio);
      newFim.setMinutes(newInicio.getMinutes() + appointment.duration);

      // Validar se o horário já passou
      const now = new Date();
      if (newInicio < now) {
        toast({
          title: "Horário inválido",
          description:
            "Não é possível reagendar para um horário que já passou.",
          variant: "destructive",
        });
        return;
      }

      // Atualizar no banco
      const { error } = await supabase
        .from("agenda")
        .update({
          inicio: newInicio.toISOString(),
          fim: newFim.toISOString(),
        })
        .eq("id", rescheduleAppointmentId);

      if (error) throw error;

      // Atualizar UI
      setAppointments((prev) =>
        prev.map((app) => {
          if (app.id === rescheduleAppointmentId) {
            return {
              ...app,
              time: rescheduleTime,
              inicio: newInicio.toISOString(),
            };
          }
          return app;
        }),
      );

      toast({
        title: "Sucesso",
        description: "Horário atualizado com sucesso!",
      });

      // Fechar diálogo e limpar estado
      setRescheduleDialogOpen(false);
      setRescheduleAppointmentId(null);
      setRescheduleTime("");
    } catch (error) {
      console.error("Erro ao reagendar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o horário.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingAppointmentId) return;

    try {
      console.log("Iniciando exclusão do agendamento:", deletingAppointmentId);
      
      // Deletar registros em tabelas dependentes um por um para capturar o erro exato
      try {
        await supabase.from("prontuarios" as any).delete().eq("agendamento_id", deletingAppointmentId);
        console.log("Prontuários deletados");
      } catch (e) { console.error("Erro prontuarios:", e); }

      try {
        await supabase.from("contas_receber" as any).delete().eq("agendamento_id", deletingAppointmentId);
        console.log("Contas receber deletadas");
      } catch (e) { console.error("Erro contas_receber:", e); }

      try {
        await supabase.from("alertas_risco" as any).delete().eq("agendamento_id", deletingAppointmentId);
        console.log("Alertas risco deletados");
      } catch (e) { console.error("Erro alertas_risco:", e); }

      try {
        await supabase.from("appointment_transfers" as any).delete().eq("appointment_id", deletingAppointmentId);
        console.log("Transfers deletados");
      } catch (e) { console.error("Erro appointment_transfers:", e); }

      try {
        await supabase.from("financial_commissions" as any).delete().eq("appointment_id", deletingAppointmentId);
        console.log("Comissões deletadas");
      } catch (e) { console.error("Erro financial_commissions:", e); }

      const { error } = await supabase
        .from("agenda")
        .delete()
        .eq("id", deletingAppointmentId);

      if (error) {
        console.error("Erro ao deletar da tabela agenda:", error);
        throw error;
      }

      // Atualizar UI imediatamente
      setAppointments((prev) =>
        prev.filter((app) => app.id !== deletingAppointmentId),
      );

      toast({
        title: "Sucesso",
        description: "Agendamento excluído com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o agendamento.",
        variant: "destructive",
      });
    } finally {
      setDeletingAppointmentId(null);
    }
  };

  const filteredAppointments = appointmentsWithConflicts.filter((apt) =>
    apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <MainLayout>
      <div className="space-y-4 animate-in fade-in duration-500 pb-10 max-w-full lg:max-w-[1400px] xl:max-w-[1600px] mx-auto px-4 md:px-0">
        {/* Barra de Ferramentas / Filtros (Sticky) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/80 backdrop-blur-md p-4 rounded-xl border border-border shadow-sm sticky top-20 z-40">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex bg-background/50 p-1 rounded-md shadow-inner border border-muted/50">
              <Button
                variant={viewMode === "timeline" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("timeline")}
                className={`h-8 px-3 rounded-sm ${viewMode === "timeline" ? 'bg-background shadow-sm' : ''}`}
              >
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Timeline</span>
              </Button>
              <Button
                variant={viewMode === "cards" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className={`h-8 px-3 rounded-sm ${viewMode === "cards" ? 'bg-background shadow-sm' : ''}`}
              >
                <span className="hidden sm:inline">Cards</span>
                <span className="sm:hidden">Cards</span>
              </Button>
            </div>

            <div className="h-6 w-px bg-border/50 hidden sm:block" />

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md bg-background shadow-sm hover:bg-accent"
                onClick={handleNavigateToPreviousDay}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 font-medium bg-background shadow-sm"
                onClick={handleGoToToday}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-md bg-background shadow-sm hover:bg-accent"
                onClick={handleNavigateToNextDay}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button
              onClick={() => setNewAppointmentDialogOpen(true)}
              className="h-9 px-4 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex-1 sm:flex-none order-last sm:order-first"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="inline">Agendar</span>
            </Button>
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar paciente..."
                className="h-9 w-full md:w-[180px] lg:w-[220px] pl-9 bg-background shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {deveMostrarFiltro && (
              <div className="flex items-center gap-2">
                <Select
                  value={selectedProfessionalId}
                  onValueChange={setSelectedProfessionalId}
                >
                  <SelectTrigger className="h-9 w-[140px] md:w-[160px] bg-background shadow-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <SelectValue placeholder="Profissional" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {professionals.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

          </div>
        </div>

        {isLoadingAppointments ? (
          <div className="flex flex-col items-center justify-center p-16 h-[50vh] border rounded-xl bg-muted/30 border-dashed border-muted/50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground font-medium">
              Sincronizando agenda...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_320px] 2xl:grid-cols-[300px_1fr_350px] gap-6 items-start">
            
            {/* Coluna Esquerda - Calendário Mensal */}
            <div className="hidden xl:block sticky top-[10.5rem] z-30 space-y-4">
              <MonthlyCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>

            {/* Coluna Central - Agenda do Dia */}
            <div className="min-w-0 bg-background rounded-xl p-0.5 md:p-0">
              {viewMode === "timeline" ? (
                <>
                  <div className="mb-4 flex items-center justify-between bg-accent/20 border border-accent/40 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                       <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                         <Calendar className="h-3 w-3 text-primary" />
                       </span>
                       <p className="text-xs text-foreground/80 font-medium">
                         <strong className="text-foreground">Dica:</strong> Arraste os blocos para reorganizar os horários.
                       </p>
                    </div>
                  </div>
                  <DragSchedule
                    appointments={filteredAppointments}
                    timeSlots={timeSlots}
                    onAppointmentMove={handleAppointmentMove}
                    viewMode="timeline"
                    onEdit={setEditingAppointmentId}
                    onDelete={setDeletingAppointmentId}
                    onResolveConflict={handleResolveConflict}
                    onEmptySlotClick={handleEmptySlotClick}
                    selectedDate={selectedDate}
                  />
                </>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between bg-accent/20 border border-accent/40 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                       <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                         <Calendar className="h-3 w-3 text-primary" />
                       </span>
                       <p className="text-xs text-foreground/80 font-medium">
                         <strong className="text-foreground">Cards View:</strong> Arraste para cima/baixo para reordenar a prioridade.
                       </p>
                    </div>
                  </div>
                  <DragSchedule
                    appointments={filteredAppointments}
                    timeSlots={[]}
                    onAppointmentMove={handleAppointmentMove}
                    onCardReorder={handleCardReorder}
                    viewMode="cards"
                    onEdit={setEditingAppointmentId}
                    onDelete={setDeletingAppointmentId}
                    onResolveConflict={handleResolveConflict}
                    selectedDate={selectedDate}
                  />
                </>
              )}
            </div>

            {/* Coluna Direita - Preview do Próximo Dia */}
            <div className="hidden xl:block sticky top-[10.5rem] z-30 space-y-4">
              <NextDayPreview
                date={addDays(selectedDate, 1)}
                appointments={nextDayAppointments}
                onNavigate={handleNavigateToNextDay}
                isLoading={isLoadingNextDay}
              />
              {/* Digital Clock moved here for better integration */}
              <DigitalClock className="shadow-none border bg-muted/30 w-full rounded-xl border-muted/50" />
            </div>
          </div>
        )}
      </div>

      {editingAppointmentId && (
        <EditAppointmentDialog
          appointmentId={editingAppointmentId}
          onSuccess={() => {
            refetchAppointments();
            setEditingAppointmentId(null);
          }}
        >
          <Button style={{ display: "none" }} />
        </EditAppointmentDialog>
      )}

      {/* Exclusão */}
      <AlertDialog
        open={!!deletingAppointmentId}
        onOpenChange={() => setDeletingAppointmentId(null)}
      >
        <AlertDialogContent className="border-muted/50 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Ajuste Conflito */}
      <AlertDialog
        open={conflictAdjustDialogOpen}
        onOpenChange={setConflictAdjustDialogOpen}
      >
        <AlertDialogContent className="border-muted/50 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Ajustar Horário Conflitante</AlertDialogTitle>
            <AlertDialogDescription>
              {conflictAdjustData?.affectedCount === 0 ? (
                <div className="space-y-3 mt-2">
                  <p className="text-sm">
                    Ajuste o horário deste agendamento para resolver o conflito detectado:
                  </p>
                  <Input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full bg-background"
                  />
                </div>
              ) : (
                <div className="bg-warning/10 text-warning-foreground p-3 rounded-md text-sm border border-warning/20 mt-2">
                  Este ajuste empurrará <strong>{conflictAdjustData?.affectedCount}</strong> agendamento(s) para frente em cascata. Deseja aplicar o ajuste geral?
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConflictAdjustDialogOpen(false);
                setConflictAdjustData(null);
                setRescheduleTime("");
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmConflictAdjust} className="bg-primary">
              {conflictAdjustData?.affectedCount === 0 ? "Verificar Horário" : "Confirmar Cascata"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Reagendar (Card Drop) */}
      <AlertDialog
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
      >
        <AlertDialogContent className="border-muted/50 rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Definir Novo Horário</AlertDialogTitle>
            <AlertDialogDescription>
              Você mudou a ordem do card. Informe o novo horário base para este agendamento:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              type="time"
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
              className="w-full bg-background"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setRescheduleDialogOpen(false);
                setRescheduleAppointmentId(null);
                setRescheduleTime("");
              }}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReschedule}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NewAppointmentDialog
        selectedDate={selectedDate}
        onSuccess={() => refetchAppointments()}
        open={newAppointmentDialogOpen}
        onOpenChange={(open) => {
          setNewAppointmentDialogOpen(open);
          if (!open) setNewAppointmentTime("");
        }}
        selectedTime={newAppointmentTime}
      >
        <button style={{ display: "none" }} />
      </NewAppointmentDialog>
    </MainLayout>
  );
};

export default Agenda;
