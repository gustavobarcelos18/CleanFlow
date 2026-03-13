import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiscoNoShowDashboard } from "@/components/admin/RiscoNoShowDashboard";
import { ChatUnificado } from "@/components/admin/ChatUnificado";
import { WhatsAppAlarms } from "@/components/admin/WhatsAppAlarms";
import { WhatsAppMetrics } from "@/components/admin/WhatsAppMetrics";
import { WhatsAppMetricsDashboard } from "@/components/admin/WhatsAppMetricsDashboard";
import { WhatsAppTemplateBuilder } from "@/components/admin/WhatsAppTemplateBuilder";
import { 
  AlertTriangle, 
  MessageSquare, 
  Activity, 
  Bell,
  FileText
} from "lucide-react";

export default function WhatsAppDashboard() {
  return (
    <MainLayout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        <div className="border-b border-muted/30 pb-6">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-300 dark:to-gray-600 pr-2 pb-1">
            WhatsApp Business
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Risco de no-show, chat unificado, métricas e observabilidade
          </p>
        </div>

        <Tabs defaultValue="risco" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-[1000px]">
            <TabsTrigger value="risco" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risco No-Show
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="metricas" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Métricas
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="alarmes" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Alarmes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="risco" className="space-y-6">
            <RiscoNoShowDashboard />
          </TabsContent>

          <TabsContent value="chat" className="space-y-6">
            <ChatUnificado />
          </TabsContent>

          <TabsContent value="metricas" className="space-y-6">
            <WhatsAppMetricsDashboard />
            <WhatsAppMetrics />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <WhatsAppTemplateBuilder />
          </TabsContent>

          <TabsContent value="alarmes" className="space-y-6">
            <WhatsAppAlarms />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
