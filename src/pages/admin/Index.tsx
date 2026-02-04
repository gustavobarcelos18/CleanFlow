import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TicketList } from "@/components/admin/TicketList";
import { ActionLogs } from "@/components/admin/ActionLogs";
import { TenantManagement } from "@/components/admin/TenantManagement";
import { PlanManagement } from "@/components/admin/PlanManagement";
import { SupportTeamManagement } from "@/components/admin/SupportTeamManagement";
import { SupportPermissionsManagement } from "@/components/admin/SupportPermissionsManagement";
import { MacroManager } from "@/components/admin/MacroManager";
import { AdminWhatsAppManagement } from "@/components/admin/AdminWhatsAppManagement";
import { IntegrationsConfig } from "@/components/admin/IntegrationsConfig";
import { Ticket, Activity, Users, Package, UserCog, Shield, FileText, BarChart3, MessageSquare, Settings } from "lucide-react";
import { toast } from "sonner";
import { ChatNotificationBell } from "@/components/admin/ChatNotificationBell";
import { DashboardCards } from "@/components/admin/DashboardCards";
import { MyQueueList } from "@/components/admin/MyQueueList";
import { DashboardFilters } from "@/components/admin/DashboardFilters";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

const AdminIndex = () => {
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    openTickets: 0,
    inProgressTickets: 0,
    totalTenants: 0,
    activePlans: 0,
  });

  // Keyboard shortcuts
  useKeyboardShortcuts();

  useEffect(() => {
    checkAccess();
    loadStats();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Você precisa estar logado para acessar esta página");
        navigate("/login");
        return;
      }

      const { data: systemUser, error } = await supabase
        .from("system_users")
        .select("system_role, active")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking access:", error);
        toast.error("Erro ao verificar permissões");
        navigate("/");
        return;
      }

      if (!systemUser) {
        toast.error("Acesso negado: você não é um usuário de suporte");
        navigate("/");
        return;
      }

      if (!systemUser.active) {
        toast.error("Acesso negado: sua conta de suporte está inativa");
        navigate("/");
        return;
      }

      if (!['master', 'support', 'support_basic', 'support_intermediate'].includes(systemUser.system_role)) {
        toast.error("Acesso negado: permissões insuficientes");
        navigate("/");
        return;
      }

      setHasAccess(true);
    } catch (error) {
      console.error("Error checking access:", error);
      toast.error("Erro ao verificar acesso");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [ticketsOpen, ticketsProgress, tenants, plans] = await Promise.all([
        supabase.from("support_tickets").select("id", { count: "exact" }).eq("status", "open"),
        supabase.from("support_tickets").select("id", { count: "exact" }).eq("status", "in_progress"),
        supabase.from("tenants").select("id", { count: "exact" }),
        supabase.from("subscriptions").select("id", { count: "exact" }).eq("status", "active"),
      ]);

      setStats({
        openTickets: ticketsOpen.count || 0,
        inProgressTickets: ticketsProgress.count || 0,
        totalTenants: tenants.count || 0,
        activePlans: plans.count || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">Painel de Suporte</h1>
                <p className="text-muted-foreground">Gerencie tickets, usuários e configurações do sistema</p>
              </div>
            </div>
          </header>

          <DashboardCards />

          <DashboardFilters />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1">
              <MyQueueList />
            </div>

            <div className="lg:col-span-2">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Estatísticas Gerais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tickets Abertos</p>
                    <p className="text-2xl font-bold">{stats.openTickets}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Em Progresso</p>
                    <p className="text-2xl font-bold">{stats.inProgressTickets}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Tenants</p>
                    <p className="text-2xl font-bold">{stats.totalTenants}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Planos Ativos</p>
                    <p className="text-2xl font-bold">{stats.activePlans}</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <Tabs defaultValue="tickets" className="space-y-4">
            <TabsList className="grid grid-cols-9 w-full">
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="macros">Macros</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="tenants">Tenants</TabsTrigger>
              <TabsTrigger value="plans">Planos</TabsTrigger>
              <TabsTrigger value="team">Equipe</TabsTrigger>
              <TabsTrigger value="permissions">Permissões</TabsTrigger>
              <TabsTrigger value="whatsapp">
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp
              </TabsTrigger>
              <TabsTrigger value="integrations">
                <Settings className="h-4 w-4 mr-2" />
                Integrações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tickets">
              <TicketList onStatsUpdate={loadStats} />
            </TabsContent>

            <TabsContent value="macros">
              <MacroManager />
            </TabsContent>

            <TabsContent value="logs">
              <ActionLogs />
            </TabsContent>

            <TabsContent value="tenants">
              <TenantManagement />
            </TabsContent>

            <TabsContent value="plans">
              <PlanManagement />
            </TabsContent>

            <TabsContent value="team">
              <SupportTeamManagement />
            </TabsContent>

            <TabsContent value="permissions">
              <SupportPermissionsManagement />
            </TabsContent>

            <TabsContent value="whatsapp">
              <AdminWhatsAppManagement />
            </TabsContent>

            <TabsContent value="integrations">
              <IntegrationsConfig />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminIndex;
