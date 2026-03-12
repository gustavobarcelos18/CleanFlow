import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, AlertTriangle, Package } from "lucide-react";
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
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 w-24 bg-muted rounded" />
              <div className="h-4 w-4 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-12 bg-muted rounded mb-2" />
              <div className="h-3 w-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card, index) => (
        <Card
          key={index}
          className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow duration-300 bg-card border border-border/50"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={cn("p-2 rounded-full shrink-0", card.bgColor)}>
              <card.icon className={cn("h-4 w-4", card.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
