import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionLogs } from "@/components/admin/ActionLogs";
import { SegmentManager } from "@/components/admin/SegmentManager";
import { supabase } from "@/integrations/supabase/client";
import { Users, Building2, Ticket, Activity } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    tenants: 0,
    supportUsers: 0,
    openTickets: 0,
    actionsToday: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      // 1. Total Tenants
      const { count: tenantsCount } = await supabase
        .from("tenants" as any)
        .select("*", { count: "exact", head: true });

      // 2. Support Users
      const { count: usersCount } = await supabase
        .from("usuarios_suporte" as any)
        .select("*", { count: "exact", head: true });

      // 3. Open Tickets
      const { count: ticketsCount } = await supabase
        .from("support_tickets")
        .select("*", { count: "exact", head: true })
        .eq("status", "open");

      // 4. Actions Today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: actionsCount } = await supabase
        .from("auditoria_admin" as any)
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      setStats({
        tenants: tenantsCount || 0,
        supportUsers: usersCount || 0,
        openTickets: ticketsCount || 0,
        actionsToday: actionsCount || 0,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();

    const channel = supabase
      .channel("admin_dashboard_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => loadStats(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tenants" },
        () => loadStats(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "usuarios_suporte" },
        () => loadStats(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "auditoria_admin" },
        () => loadStats(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadStats]);

  return (
    <AdminLayout>
      <div className="space-y-6 p-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema CleanFlow Admin
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="segments">Segment Manager</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Tenants
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "-" : stats.tenants}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clínicas registradas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Usuários de Suporte
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "-" : stats.supportUsers}
                  </div>
                  <p className="text-xs text-muted-foreground">Equipe ativa</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tickets Abertos
                  </CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "-" : stats.openTickets}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Aguardando atendimento
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ações Hoje
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? "-" : stats.actionsToday}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Registros de auditoria
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Atividades Recentes</h2>
              <ActionLogs />
            </Card>
          </TabsContent>

          <TabsContent value="segments" className="space-y-4">
            <SegmentManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
