import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { MetricsDashboard } from "@/components/admin/MetricsDashboard";
import { SystemLogsViewer } from "@/components/admin/SystemLogsViewer";
import { ErrorDashboard } from "@/components/admin/ErrorDashboard";
import { TwoFactorSettings } from "@/components/admin/TwoFactorSettings";
import { AccountLockManagement } from "@/components/admin/AccountLockManagement";
import { AnonymizationManager } from "@/components/admin/AnonymizationManager";
import { ActionLogs } from "@/components/admin/ActionLogs";
import { ConsentManagement } from "@/components/admin/ConsentManagement";
import { MessageAuditViewer } from "@/components/admin/MessageAuditViewer";
import { RetentionPolicyManager } from "@/components/admin/RetentionPolicyManager";
import { WhatsAppMetrics } from "@/components/admin/WhatsAppMetrics";
import { WhatsAppAlarms } from "@/components/admin/WhatsAppAlarms";

const Observability = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Observabilidade e Segurança</h1>
          <p className="text-muted-foreground">
            Métricas, logs, segurança e conformidade LGPD
          </p>
        </div>

        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-12">
            <TabsTrigger value="metrics">Métricas</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="alarms">Alarmes</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
            <TabsTrigger value="errors">Erros</TabsTrigger>
            <TabsTrigger value="2fa">2FA</TabsTrigger>
            <TabsTrigger value="locks">Bloqueios</TabsTrigger>
            <TabsTrigger value="lgpd">LGPD</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
            <TabsTrigger value="consent">Consentimentos</TabsTrigger>
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
            <TabsTrigger value="retention">Retenção</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <MetricsDashboard />
          </TabsContent>

          <TabsContent value="whatsapp" className="space-y-4">
            <WhatsAppMetrics />
          </TabsContent>

          <TabsContent value="alarms" className="space-y-4">
            <WhatsAppAlarms />
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <SystemLogsViewer />
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <ErrorDashboard />
          </TabsContent>

          <TabsContent value="2fa" className="space-y-4">
            <TwoFactorSettings />
          </TabsContent>

          <TabsContent value="locks" className="space-y-4">
            <AccountLockManagement />
          </TabsContent>

          <TabsContent value="lgpd" className="space-y-4">
            <AnonymizationManager />
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <ActionLogs />
          </TabsContent>

          <TabsContent value="consent" className="space-y-4">
            <ConsentManagement />
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <MessageAuditViewer />
          </TabsContent>

          <TabsContent value="retention" className="space-y-4">
            <RetentionPolicyManager />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default Observability;
