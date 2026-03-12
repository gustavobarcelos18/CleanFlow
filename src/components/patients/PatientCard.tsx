import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Mail,
  MessageCircle,
  Edit3,
  Trash2,
  AlertTriangle,
  Package,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VincularPacoteDialog } from "@/components/pacotes/VincularPacoteDialog";
import { formatCPF } from "@/lib/cpf";

interface PatientCardProps {
  patient: any;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PatientCard({ patient, onEdit, onDelete }: PatientCardProps) {
  const getRiskStyles = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "high":
      case "alto":
        return {
          bg: "bg-destructive/10 dark:bg-destructive/20",
          text: "text-destructive dark:text-red-400",
          icon: AlertTriangle,
          label: "Alto Risco",
          border: "border-destructive/20 dark:border-destructive/50",
        };
      case "medium":
      case "médio":
        return {
          bg: "bg-warning/10 dark:bg-warning/20",
          text: "text-warning dark:text-amber-400",
          icon: AlertTriangle,
          label: "Médio Risco",
          border: "border-warning/20 dark:border-warning/50",
        };
      case "low":
      case "baixo":
        return {
          bg: "bg-success/10 dark:bg-success/20",
          text: "text-success dark:text-emerald-400",
          icon: AlertTriangle,
          label: "Baixo Risco",
          border: "border-success/20 dark:border-success/50",
        };
      default:
        return {
          bg: "bg-muted dark:bg-muted/50",
          text: "text-muted-foreground",
          icon: AlertTriangle,
          label: "Sem Risco",
          border: "border-border",
        };
    }
  };

  const risk = getRiskStyles(patient.no_show_risk_level);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleWhatsApp = () => {
    const phone = patient.telefone?.replace(/\D/g, "");
    if (phone) {
      window.open(`https://wa.me/55${phone}`, "_blank");
    }
  };

  return (
    <Card className="group overflow-hidden border border-border shadow-sm hover:shadow-lg transition-shadow duration-300 bg-card h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        <div className="p-6 flex-grow flex flex-col">
          <div className="flex items-start justify-between mb-4 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border border-primary/20 shrink-0">
                {getInitials(patient.nome)}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg leading-none group-hover:text-primary transition-colors text-foreground">
                  {patient.nome}
                </h3>
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <span className="font-medium">{formatCPF(patient.cpf)}</span>
                  {patient.historico_faltas > 0 && (
                    <Badge
                      variant="destructive"
                      className="h-5 px-1.5 py-0 text-[10px] uppercase font-bold tracking-wider"
                    >
                      {patient.historico_faltas} faltas
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Badge
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold border shrink-0",
                risk.bg,
                risk.text,
                risk.border,
              )}
            >
              <risk.icon className="h-3 w-3" />
              {risk.label}
            </Badge>
          </div>

          <div className="space-y-3 mb-6 flex-grow">
            {patient.telefone && (
              <div className="flex items-center gap-3 text-sm text-foreground/80">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <span className="font-medium">{patient.telefone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center gap-3 text-sm text-foreground/80">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <span className="truncate max-w-[200px] font-medium">
                  {patient.email}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm text-foreground/80">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border shrink-0">
                <MessageCircle className="h-3.5 w-3.5" />
              </div>
              <span>
                Prefere:{" "}
                <span className="font-bold text-foreground capitalize">
                  {patient.preferencia_contato || "WhatsApp"}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-auto">
            <Button
              className="flex-1 shadow-sm hover:shadow-md transition-shadow h-10 gap-2 font-bold"
              variant="default"
              onClick={handleWhatsApp}
              disabled={!patient.telefone}
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>

            <VincularPacoteDialog
              pacienteId={patient.id}
              pacienteNome={patient.nome}
              onSuccess={() => {}}
            />

            <div className="flex items-center border border-border rounded-lg bg-muted overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 hover:text-primary rounded-none border-r border-border"
                onClick={() => onEdit(patient.id)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-none"
                onClick={() => onDelete(patient.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 bg-muted/30 border-t border-border flex items-center justify-between group/footer cursor-pointer hover:bg-muted transition-colors mt-auto">
          <span className="text-xs font-bold text-foreground/60 uppercase tracking-widest flex items-center gap-2">
            <ExternalLink className="h-3 w-3" />
            Ver Prontuário Completo
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/footer:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
}
