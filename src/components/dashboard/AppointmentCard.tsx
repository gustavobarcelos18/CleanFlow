import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Clock,
  User,
  Phone,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";

interface AppointmentCardProps {
  id: string;
  patientName: string;
  time: string;
  doctor: string;
  status:
    | "confirmed"
    | "pending"
    | "cancelled"
    | "completed"
    | "no-show"
    | "risk-high"
    | "risk-medium"
    | "risk-low";
  phone?: string;
  className?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  hasConflict?: boolean;
  conflictMinutes?: number;
  onResolveConflict?: (id: string) => void;
}

const statusConfig = {
  confirmed: {
    label: "Confirmado",
    variant: "default" as const,
    bgColor: "bg-success-light",
    borderColor: "border-success/40",
    icon: CheckCircle,
    iconColor: "text-success",
  },
  pending: {
    label: "Pendente",
    variant: "secondary" as const,
    bgColor: "bg-warning-light",
    borderColor: "border-warning/40",
    icon: Clock,
    iconColor: "text-warning",
  },
  cancelled: {
    label: "Cancelado",
    variant: "destructive" as const,
    bgColor: "bg-destructive-light",
    borderColor: "border-destructive/20",
    icon: XCircle,
    iconColor: "text-destructive",
  },
  completed: {
    label: "Realizado",
    variant: "default" as const,
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    borderColor: "border-blue-500/30",
    icon: CheckCircle,
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  "no-show": {
    label: "Faltou",
    variant: "destructive" as const,
    bgColor: "bg-destructive-light",
    borderColor: "border-destructive/20",
    icon: XCircle,
    iconColor: "text-destructive",
  },
  "risk-high": {
    label: "Alto Risco",
    variant: "destructive" as const,
    bgColor: "bg-destructive-light",
    borderColor: "border-destructive/20",
    icon: AlertTriangle,
    iconColor: "text-destructive",
  },
  "risk-medium": {
    label: "Médio Risco",
    variant: "secondary" as const,
    bgColor: "bg-warning-light",
    borderColor: "border-warning/20",
    icon: AlertTriangle,
    iconColor: "text-warning",
  },
  "risk-low": {
    label: "Baixo Risco",
    variant: "default" as const,
    bgColor: "bg-success-light",
    borderColor: "border-success/20",
    icon: CheckCircle,
    iconColor: "text-success",
  },
};

export function AppointmentCard({
  id,
  patientName,
  time,
  doctor,
  status,
  phone,
  className,
  onEdit,
  onDelete,
  hasConflict,
  conflictMinutes,
  onResolveConflict,
}: AppointmentCardProps) {
  const config =
    statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-all duration-200 hover:shadow-md flex flex-col bg-card",
        config.borderColor,
        hasConflict && "ring-2 ring-orange-500/50",
        className,
      )}
    >
      {/* Cabeçalho com Nome do Paciente e Status */}
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="p-2 bg-foreground/5 rounded-full flex-shrink-0">
            <StatusIcon className={cn("h-4 w-4", config.iconColor)} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-foreground text-lg mb-0.5 break-words leading-tight">
              {patientName}
            </h4>
            <p className="text-xs text-muted-foreground break-words flex items-center gap-1">
              <User className="h-3 w-3 flex-shrink-0" />
              <span className="break-words">{doctor}</span>
            </p>
          </div>
        </div>
        {hasConflict && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolveConflict?.(id);
                  }}
                  className="flex-shrink-0 p-1.5 hover:bg-orange-500/20 rounded-full transition-colors"
                >
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Sobreposição de {conflictMinutes} minutos com agendamento
                  anterior
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Clique para ajustar
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <Badge
          variant={config.variant}
          className={cn(
            "text-[10px] px-2 py-0.5 flex-shrink-0 uppercase font-black tracking-wider",
            config.iconColor,
            "bg-foreground/5 border-none",
          )}
        >
          {config.label}
        </Badge>
      </div>

      {/* Informações de Horário e Contato */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="font-bold">{time}</span>
        </div>
        {phone && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3.5 w-3.5 text-primary" />
            <span className="font-bold">{phone}</span>
          </div>
        )}
      </div>

      {/* Botões de Ação Rápidos (Opcional - Reduzido) */}
      {status === "pending" && (
        <div className="flex gap-2 mb-2">
          <Button
            size="xs"
            variant="outline"
            className="flex-1 h-7 text-[10px]"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Lembrete
          </Button>
        </div>
      )}

      {/* Ícones de Edição e Exclusão - Parte Inferior */}
      {(onEdit || onDelete) && (
        <div className="flex items-center justify-end gap-2 mt-auto pt-2 border-t border-border/50">
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(id);
              }}
              className="h-7 px-2 text-xs"
              title="Editar agendamento"
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Editar
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Excluir agendamento"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Excluir
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
