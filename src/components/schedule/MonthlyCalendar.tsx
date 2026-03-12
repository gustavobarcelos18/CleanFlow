import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface DayStats {
  date: Date;
  appointmentCount: number;
  maxCapacity: number; // Define capacidade máxima por dia (pode ser configurável)
}

interface MonthlyCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  className?: string;
}

export function MonthlyCalendar({
  selectedDate,
  onDateSelect,
  className,
}: MonthlyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [dayStats, setDayStats] = useState<DayStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const MAX_APPOINTMENTS_PER_DAY = 12; // Configurável

  // Buscar estatísticas do mês
  const fetchMonthStats = async () => {
    try {
      setIsLoading(true);
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from("agenda")
        .select("inicio, id")
        .gte("inicio", monthStart.toISOString())
        .lte("inicio", monthEnd.toISOString());

      if (error) throw error;

      // Agrupar por dia
      const statsByDay = new Map<string, number>();

      (data || []).forEach((apt) => {
        const aptDate = new Date(apt.inicio);
        const dateKey = format(aptDate, "yyyy-MM-dd");
        statsByDay.set(dateKey, (statsByDay.get(dateKey) || 0) + 1);
      });

      // Criar array de estatísticas
      const daysInMonth = eachDayOfInterval({
        start: monthStart,
        end: monthEnd,
      });
      const stats: DayStats[] = daysInMonth.map((day) => ({
        date: day,
        appointmentCount: statsByDay.get(format(day, "yyyy-MM-dd")) || 0,
        maxCapacity: MAX_APPOINTMENTS_PER_DAY,
      }));

      setDayStats(stats);
    } catch (error) {
      console.error("Erro ao buscar estatísticas do mês:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthStats();
  }, [currentMonth]);

  // Atualizar mês quando selectedDate mudar
  useEffect(() => {
    if (!isSameMonth(selectedDate, currentMonth)) {
      setCurrentMonth(selectedDate);
    }
  }, [selectedDate]);

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
  };

  // Obter cor baseado na quantidade de agendamentos
  const getDayColor = (stats: DayStats) => {
    if (stats.appointmentCount === 0) {
      return "bg-green-500/20 hover:bg-green-500/30 border-green-500/50"; // Livre
    } else if (stats.appointmentCount >= stats.maxCapacity) {
      return "bg-red-500/20 hover:bg-red-500/30 border-red-500/50"; // Lotado
    } else {
      return "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/50"; // Com agendamentos
    }
  };

  // Obter dias para renderizar (incluindo dias da semana anterior/próxima)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { locale: ptBR });
  const calendarEnd = endOfWeek(monthEnd, { locale: ptBR });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handlePreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onDateSelect(subDays(selectedDate, 1))}
            title="Dia anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="flex-1"
          >
            Hoje
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onDateSelect(addDays(selectedDate, 1))}
            title="Próximo dia"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-muted-foreground py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid de dias */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const stats = dayStats.find((s) => isSameDay(s.date, day));
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onDateSelect(day)}
                    disabled={!isCurrentMonth}
                    className={cn(
                      "relative aspect-square rounded-md border transition-all",
                      "flex flex-col items-center justify-center text-sm",
                      "disabled:opacity-40 disabled:cursor-not-allowed",
                      isCurrentMonth && stats && getDayColor(stats),
                      !isCurrentMonth && "bg-muted/30 hover:bg-muted/50",
                      isSelected && "ring-2 ring-primary ring-offset-2",
                      isToday &&
                        "border-2 border-primary font-bold shadow-sm z-10",
                      isToday && !isSelected && "scale-105",
                      "hover:scale-105 active:scale-95",
                    )}
                  >
                    <span
                      className={cn(
                        "font-medium",
                        isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground",
                        isToday && "font-bold",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    {stats && stats.appointmentCount > 0 && (
                      <span className="text-[10px] font-semibold mt-0.5">
                        {stats.appointmentCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="mt-4 pt-4 border-t space-y-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Legenda:
              </p>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-4 w-4 rounded bg-green-500/20 border border-green-500/50"></div>
                <span className="text-muted-foreground">Livre</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-4 w-4 rounded bg-blue-500/20 border border-blue-500/50"></div>
                <span className="text-muted-foreground">Com agendamentos</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="h-4 w-4 rounded bg-red-500/20 border border-red-500/50"></div>
                <span className="text-muted-foreground">
                  Lotado ({MAX_APPOINTMENTS_PER_DAY}+)
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
