import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronRight, Clock, User } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface NextDayAppointment {
  id: string;
  patientName: string;
  time: string;
  doctor: string;
  status: string;
  duration: number;
}

interface NextDayPreviewProps {
  date: Date;
  appointments: NextDayAppointment[];
  onNavigate: () => void;
  isLoading?: boolean;
}

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  confirmed: { label: "Confirmado", variant: "default" },
  pending: { label: "Pendente", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  completed: { label: "Concluído", variant: "outline" },
  "no-show": { label: "Faltou", variant: "destructive" },
  "risk-high": { label: "Risco Alto", variant: "destructive" },
  "risk-medium": { label: "Risco Médio", variant: "secondary" },
  "risk-low": { label: "Risco Baixo", variant: "outline" },
};

export function NextDayPreview({
  date,
  appointments,
  onNavigate,
  isLoading,
}: NextDayPreviewProps) {
  const dayName = format(date, "EEEE", { locale: ptBR });
  const formattedDate = format(date, "dd/MM/yyyy", { locale: ptBR });
  const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

  const totalAppointments = appointments.length;
  const confirmedCount = appointments.filter(
    (a) => a.status === "confirmed",
  ).length;
  const pendingCount = appointments.filter(
    (a) => a.status === "pending",
  ).length;

  return (
    <Card className="h-full border-2">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {capitalizedDay}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {formattedDate}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigate}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-primary/10">
            <div className="text-2xl font-bold text-primary">
              {totalAppointments}
            </div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-green-500/10">
            <div className="text-2xl font-bold text-success">
              {confirmedCount}
            </div>
            <div className="text-xs text-muted-foreground">Confirmados</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-yellow-500/10">
            <div className="text-2xl font-bold text-warning">
              {pendingCount}
            </div>
            <div className="text-xs text-muted-foreground">Pendentes</div>
          </div>
        </div>

        {/* Lista compacta de agendamentos */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-muted/50 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum agendamento</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
            {appointments.map((appointment) => {
              const config =
                statusConfig[appointment.status] || statusConfig.pending;

              return (
                <Card
                  key={appointment.id}
                  className="p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={onNavigate}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">
                          {appointment.time}
                        </span>
                        <Badge variant={config.variant} className="text-xs">
                          {config.label}
                        </Badge>
                      </div>

                      <p className="text-sm font-medium truncate text-foreground">
                        {appointment.patientName}
                      </p>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <User className="h-3 w-3" />
                        <span className="truncate">{appointment.doctor}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Button variant="outline" className="w-full" onClick={onNavigate}>
          Ver Agenda Completa
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
