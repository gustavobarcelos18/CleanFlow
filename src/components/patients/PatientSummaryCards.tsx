import React, { useMemo } from "react";
import { Users, UserPlus, AlertTriangle } from "lucide-react";
import { useTerminology } from "@/stores/useSegmentStore";
import { startOfMonth, isAfter } from "date-fns";
import { cn } from "@/lib/utils";

interface PatientSummaryCardsProps {
  patients: any[];
  isLoading: boolean;
}

export function PatientSummaryCards({
  patients,
  isLoading,
}: PatientSummaryCardsProps) {
  const t = useTerminology();

  const stats = useMemo(() => {
    if (!patients) return { total: 0, newThisMonth: 0, highRisk: 0 };

    const now = new Date();
    const monthStart = startOfMonth(now);

    return {
      total: patients.length,
      newThisMonth: patients.filter(
        (p) => p.created_at && isAfter(new Date(p.created_at), monthStart),
      ).length,
      highRisk: patients.filter(
        (p) =>
          p.no_show_risk_level === "high" || p.no_show_risk_level === "alto",
      ).length,
    };
  }, [patients]);

  const cards = [
    {
      title: `Total de ${t.client_label}s`,
      value: stats.total,
      icon: Users,
      description: "Cadastrados no sistema",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Novos este Mês",
      value: stats.newThisMonth,
      icon: UserPlus,
      description: "Desde o dia 1º",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Alto Risco",
      value: stats.highRisk,
      icon: AlertTriangle,
      description: "Probabilidade de falta",
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    // Nota: Active Packages stats seriam ideais aqui, mas requeriam outra query
    // Por enquanto mostramos apenas as baseadas na lista de pacientes
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted/30 rounded-xl border border-muted/50 p-5 flex items-center justify-between gap-4 animate-pulse">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-muted rounded" />
              <div className="h-8 w-12 bg-muted rounded" />
              <div className="h-3 w-32 bg-muted rounded" />
            </div>
            <div className="h-11 w-11 bg-muted rounded-xl shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-muted/30 rounded-xl border border-muted/50 p-5 flex items-center justify-between gap-4 transition-colors hover:bg-muted/50"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              {card.title}
            </p>
            <p className="text-3xl font-black tracking-tighter text-foreground">
              {card.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {card.description}
            </p>
          </div>
          <div className={cn("p-3 rounded-xl shrink-0", card.bgColor)}>
            <card.icon className={cn("h-5 w-5", card.color)} />
          </div>
        </div>
      ))}
    </div>
  );
}
