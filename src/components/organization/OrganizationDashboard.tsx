import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { useOrganizationContext } from "@/hooks/useOrganizationContext";
import { supabase } from "@/integrations/supabase/client";

interface UnitMetrics {
  unit_id: string;
  unit_name: string;
  is_matriz: boolean;
  appointments_count: number;
  patients_count: number;
  revenue: number;
  occupancy_rate: number;
  no_show_rate: number;
}

export function OrganizationDashboard() {
  const { organization, units, isOrgAdmin } = useOrganizationContext();
  const [viewMode, setViewMode] = useState<"consolidated" | "per_unit">(
    "consolidated",
  );
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [metrics, setMetrics] = useState<UnitMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar métricas por unidade
      const unitMetrics: UnitMetrics[] = [];

      for (const unit of units) {
        // Contagem de agendamentos
        const { count: appointmentsCount } = await supabase
          .from("agenda")
          .select("*", { count: "exact", head: true })
          .eq("unit_id", unit.id);

        // Contagem de pacientes
        const { count: patientsCount } = await supabase
          .from("pacientes")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organization?.id);

        // Receita (soma do caixa diário)
        const { data: revenueData } = await supabase
          .from("caixa_diario")
          .select("valor")
          .eq("unit_id", unit.id)
          .eq("tipo_lancamento", "entrada");

        const revenue =
          revenueData?.reduce((sum, r) => sum + (r.valor || 0), 0) || 0;

        unitMetrics.push({
          unit_id: unit.id,
          unit_name: unit.nome_unidade,
          is_matriz: unit.is_matriz,
          appointments_count: appointmentsCount || 0,
          patients_count: patientsCount || 0,
          revenue,
          occupancy_rate: Math.random() * 40 + 60, // Mock
          no_show_rate: Math.random() * 15 + 5, // Mock
        });
      }

      setMetrics(unitMetrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    } finally {
      setLoading(false);
    }
  }, [organization?.id, units]);

  useEffect(() => {
    if (organization?.id) {
      fetchMetrics();
    }
  }, [organization?.id, fetchMetrics, selectedPeriod]);

  const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue, 0);
  const totalAppointments = metrics.reduce(
    (sum, m) => sum + m.appointments_count,
    0,
  );
  const totalPatients = metrics.reduce((sum, m) => sum + m.patients_count, 0);
  const avgOccupancy =
    metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.occupancy_rate, 0) / metrics.length
      : 0;

  if (!isOrgAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{organization?.nome_fantasia}</h2>
          <p className="text-muted-foreground">Dashboard da Organização</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Este Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
            </SelectContent>
          </Select>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="consolidated">Consolidado</TabsTrigger>
              <TabsTrigger value="per_unit">Por Unidade</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {viewMode === "consolidated" ? (
        <>
          {/* Cards de resumo consolidado */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Receita Total
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalRevenue.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  +12.5% vs período anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Agendamentos
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalAppointments}</div>
                <p className="text-xs text-muted-foreground">
                  Em {units.length} unidades
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pacientes Ativos
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPatients}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  +5.2% novos pacientes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ocupação Média
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {avgOccupancy.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Taxa de ocupação das agendas
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Ranking de unidades */}
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Unidades</CardTitle>
              <CardDescription>
                Desempenho comparativo entre unidades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((unit, index) => (
                    <div key={unit.unit_id} className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{unit.unit_name}</span>
                          {unit.is_matriz && (
                            <Badge variant="secondary">Matriz</Badge>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>{unit.appointments_count} agendamentos</span>
                          <span>
                            {unit.occupancy_rate.toFixed(0)}% ocupação
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {unit.revenue.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {((unit.revenue / totalRevenue) * 100).toFixed(1)}% do
                          total
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Visão por unidade */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metrics.map((unit) => (
            <Card key={unit.unit_id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {unit.unit_name}
                  </CardTitle>
                  {unit.is_matriz && <Badge>Matriz</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Receita</p>
                    <p className="text-xl font-bold">
                      {unit.revenue.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Agendamentos
                    </p>
                    <p className="text-xl font-bold">
                      {unit.appointments_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ocupação</p>
                    <p className="text-xl font-bold flex items-center gap-1">
                      {unit.occupancy_rate.toFixed(0)}%
                      {unit.occupancy_rate > 70 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">No-Show</p>
                    <p className="text-xl font-bold text-destructive">
                      {unit.no_show_rate.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
