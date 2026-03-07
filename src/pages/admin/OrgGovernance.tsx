import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizationContext } from "@/hooks/useOrganizationContext";
import {
  Building2,
  Settings,
  TrendingUp,
  Users,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { OrgSettingsForm } from "@/components/organization/OrgSettingsForm";
import { UnitSettingsDialog } from "@/components/organization/UnitSettingsDialog";

interface Unit {
  id: string;
  organization_id: string;
  nome: string;
  created_at: string;
}

interface UnitAnalytics {
  unit_id: string;
  unit_name: string;
  taxa_ocupacao_mensal_estimada: number;
  taxa_no_show: number;
  total_agendamentos: number;
}

export default function OrgGovernance() {
  const { profile } = useAuth();
  const { isOrgAdmin, hasRole, isMaster } = useOrganizationContext();
  const [units, setUnits] = useState<Unit[]>([]);
  const [analytics, setAnalytics] = useState<UnitAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [unitSettingsOpen, setUnitSettingsOpen] = useState(false);

  const canAccess = isOrgAdmin || hasRole(["org_finance"]) || isMaster;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Carregar unidades
      const { data: unitsData } = await (supabase as any)
        .from("units")
        .select("*")
        .eq("organization_id", profile?.organization_id);
      setUnits((unitsData as any) || []);

      // Carregar analytics consolidados
      const { data: analyticsData } = await (supabase as any)
        .from("view_org_analytics")
        .select("*")
        .eq("organization_id", profile?.organization_id);
      setAnalytics((analyticsData as any) || []);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar dados da organização.");
    } finally {
      setLoading(false);
    }
  }, [profile?.organization_id]);

  useEffect(() => {
    if (profile?.organization_id && canAccess) {
      loadData();
    }
  }, [profile?.organization_id, canAccess, loadData]);

  const handleConfigureUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
    setUnitSettingsOpen(true);
  };

  if (!canAccess) {
    return (
      <div className="container mx-auto p-6 flex flex-col items-center justify-center h-[50vh] space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold">Acesso Negado</h1>
        <p className="text-muted-foreground">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Governança da Organização
        </h1>
        <p className="text-muted-foreground">
          Gerencie suas unidades e visualize o desempenho consolidado.
        </p>
      </div>

      {/* KPIs Consolidados */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard
          title="Total de Unidades"
          value={units.length.toString()}
          icon={Building2}
        />
        <KPICard
          title="Ocupação Média"
          value={`${(analytics.reduce((acc, curr) => acc + Number(curr.taxa_ocupacao_mensal_estimada || 0), 0) / (analytics.length || 1)).toFixed(1)}%`}
          icon={TrendingUp}
        />
        <KPICard
          title="Taxa de No-Show Global"
          value={`${(analytics.reduce((acc, curr) => acc + Number(curr.taxa_no_show || 0), 0) / (analytics.length || 1)).toFixed(1)}%`}
          icon={AlertTriangle}
          trend="down"
        />
        <KPICard
          title="Total de Agendamentos"
          value={analytics
            .reduce(
              (acc, curr) => acc + Number(curr.total_agendamentos || 0),
              0,
            )
            .toString()}
          icon={Users}
        />
      </div>

      <Tabs defaultValue="units" className="space-y-4">
        <TabsList>
          <TabsTrigger value="units">Unidades</TabsTrigger>
          <TabsTrigger value="settings">Configurações Globais</TabsTrigger>
        </TabsList>

        <TabsContent value="units">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Unidade</CardTitle>
              <CardDescription>
                Visão detalhada de cada unidade da rede.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Ocupação</TableHead>
                    <TableHead>No-Show</TableHead>
                    <TableHead>Agendamentos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.map((unit) => (
                    <TableRow key={unit.unit_id}>
                      <TableCell className="font-medium">
                        {unit.unit_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            Number(unit.taxa_ocupacao_mensal_estimada) > 70
                              ? "default"
                              : "secondary"
                          }
                        >
                          {unit.taxa_ocupacao_mensal_estimada}%
                        </Badge>
                      </TableCell>
                      <TableCell>{unit.taxa_no_show}%</TableCell>
                      <TableCell>{unit.total_agendamentos}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleConfigureUnit(unit.unit_id)}
                        >
                          <Settings className="mr-2 h-4 w-4" /> Configurar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {analytics.length === 0 && !loading && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground py-8"
                      >
                        Nenhuma unidade encontrada ou sem dados recentes.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          {profile?.organization_id && (
            <OrgSettingsForm organizationId={profile.organization_id} />
          )}
        </TabsContent>
      </Tabs>

      <UnitSettingsDialog
        open={unitSettingsOpen}
        onOpenChange={setUnitSettingsOpen}
        unitId={selectedUnitId}
        organizationId={profile?.organization_id || ""}
      />
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down";
}

function KPICard({ title, value, icon: Icon, trend }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
