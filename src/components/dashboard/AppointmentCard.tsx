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
  MoreHorizontal,
  Activity,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    | "concluido"
    | "em_atendimento"
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
  readOnly?: boolean;
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
    label: "Concluído",
    variant: "default" as const,
    bgColor: "bg-success-light/20",
    borderColor: "border-success/40",
    icon: CheckCircle,
    iconColor: "text-success",
  },
  concluido: {
    label: "Concluído",
    variant: "default" as const,
    bgColor: "bg-success-light/20",
    borderColor: "border-success/40",
    icon: CheckCircle,
    iconColor: "text-success",
  },
  em_atendimento: {
    label: "Atendendo",
    variant: "default" as const,
    bgColor: "bg-primary/10",
    borderColor: "border-primary/40",
    icon: Activity,
    iconColor: "text-primary",
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
  readOnly,
}: AppointmentCardProps) {
  const config =
    statusConfig[status as keyof typeof statusConfig] ?? statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        "group p-4 rounded-xl border transition-all duration-200 hover:shadow-lg flex flex-col h-full bg-card min-w-0 relative overflow-hidden",
        config.borderColor,
        "border-border/60 hover:border-primary/40",
        hasConflict && "ring-2 ring-orange-500/50",
        className,
      )}
    >
      {/* Decorative vertical bar for status */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1", config.iconColor.replace('text-', 'bg-'))} />

      {/* Cabeçalho com Nome do Paciente e Status */}
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={cn("p-2 rounded-lg flex-shrink-0 mt-0.5", config.bgColor)}>
            <StatusIcon className={cn("h-4 w-4", config.iconColor)} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 
              className="font-bold text-foreground text-sm md:text-base mb-1 line-clamp-1 leading-tight group-hover:text-primary transition-colors" 
              title={patientName}
            >
              {patientName}
            </h4>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0">
                <User className="h-3 w-3 flex-shrink-0 text-primary/70" />
                <span className="truncate">{doctor}</span>
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
                <Clock className="h-3 w-3 text-primary/70" />
                <span>{time}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {hasConflict && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onResolveConflict?.(id);
                    }}
                    className="p-1.5 hover:bg-orange-500/20 rounded-full transition-colors"
                  >
                    <AlertCircle className="h-4 w-4 text-orange-500 animate-pulse" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="font-bold">Conflito de Horário</p>
                  <p className="text-xs">Sobreposição de {conflictMinutes} min</p>
                  <p className="text-[10px] mt-1 opacity-80">Clique para ajustar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <Badge
            variant={config.variant}
            className={cn(
              "text-[10px] px-2 py-0.5 uppercase font-black tracking-wider hidden sm:flex",
              config.iconColor,
              "bg-foreground/5 border-none",
            )}
          >
            {config.label}
          </Badge>

          {/* Mobile Actions Dropdown */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && !readOnly && (
                  <DropdownMenuItem onClick={() => onEdit(id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                )}
                {onDelete && status !== "concluido" && status !== "completed" && (
                  <DropdownMenuItem onClick={() => onDelete(id)} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Detalhes Adicionais (Telefone) */}
      {phone && (
        <div className="flex items-center gap-3 mt-1 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border border-border/40">
            <Phone className="h-3 w-3 text-primary/70" />
            <span className="font-medium whitespace-nowrap">{phone}</span>
          </div>
          {status === "pending" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-primary hover:text-primary hover:bg-primary/10"
                    aria-label={`Enviar mensagem para ${patientName}`}
                  >
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Enviar lembrete WhatsApp</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}

      {/* Botões de Ação - Desktop e Tablets (Sempre alinhados ao fundo) */}
      {(onEdit || onDelete) && (
        <div className="hidden sm:flex items-center justify-end gap-2 pt-3 mt-auto border-t border-border/40">
          {onEdit && !readOnly && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(id);
              }}
              className="h-8 px-3 text-xs font-medium hover:bg-primary/5 hover:text-primary transition-colors"
              title="Editar agendamento"
              aria-label={`Editar agendamento de ${patientName}`}
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
          )}
          {onDelete && status !== "concluido" && status !== "completed" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(id);
              }}
              className="h-8 px-3 text-xs font-medium text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Excluir agendamento"
              aria-label={`Excluir agendamento de ${patientName}`}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Excluir
            </Button>
          )}
        </div>
      )}

      {/* Badge mobile e Ação Primária */}
      <div className={cn("mt-auto pt-3 border-t border-border/40 flex items-center justify-between gap-4", readOnly && "pb-1")}>
         <Badge
            variant={config.variant}
            className={cn(
              "text-[9px] px-1.5 py-0.5 uppercase font-black tracking-wider whitespace-nowrap",
              config.iconColor,
              "bg-foreground/5 border-none",
            )}
          >
            {config.label}
          </Badge>
          
          {status === "pending" && (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 px-2 text-[10px] flex-1 bg-primary/5 border-primary/20 text-primary hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation();
                // Lógica de WhatsApp ou lembrete (pode ser o mesmo do ícone acima)
              }}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Lembrete
            </Button>
          )}
          
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold whitespace-nowrap">
             <Clock className="h-2.5 w-2.5 text-primary" />
             <span>{time}</span>
          </div>
      </div>
    </div>
  );
}
