import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiscoNoShowDashboard } from "@/components/admin/RiscoNoShowDashboard";
import { ChatUnificado } from "@/components/admin/ChatUnificado";
import { WhatsAppAlarms } from "@/components/admin/WhatsAppAlarms";
import { WhatsAppMetrics } from "@/components/admin/WhatsAppMetrics";
import { WhatsAppMetricsDashboard } from "@/components/admin/WhatsAppMetricsDashboard";
import { WhatsAppTemplateBuilder } from "@/components/admin/WhatsAppTemplateBuilder";
import { WhatsAppConnectionManager } from "@/components/admin/WhatsAppConnectionManager";
import { 
  AlertTriangle, 
  MessageSquare, 
  Activity, 
  Bell,
  FileText,
  Smartphone
} from "lucide-react";
import { useLayoutTitle } from "@/hooks/useLayoutTitle";
import { useEffect, useState } from "react";

export default function WhatsAppDashboard() {
  const { setTitle, setSubtitle } = useLayoutTitle();
  const [activeTab, setActiveTab] = useState("conexao");

  useEffect(() => {
    if (setTitle) setTitle("WhatsApp Business");
    if (setSubtitle) setSubtitle("No-show, métricas e conectividade empresarial");
  }, [setTitle, setSubtitle]);

  return (
    <MainLayout>
      <div className="animate-in fade-in duration-500 pb-12 html.app-auth">
        <span className="sr-only">Risco de no-show, chat unificado, métricas e observabilidade</span>
        
        <Tabs defaultValue="conexao" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-card/30 p-1 rounded-xl border border-border/50 backdrop-blur-md sticky top-0 z-10">
            <TabsList className="w-full justify-start bg-transparent h-12 gap-2 overflow-x-auto whitespace-nowrap scrollbar-none px-1">
              <TabsTrigger 
                value="conexao" 
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all px-4 h-10 gap-2 font-bold"
              >
                <Smartphone className="h-4 w-4" />
                Conexão
              </TabsTrigger>
              <TabsTrigger 
                value="risco" 
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all px-4 h-10 gap-2 font-bold"
              >
                <AlertTriangle className="h-4 w-4" />
                No-Show
              </TabsTrigger>
              <TabsTrigger 
                value="chat" 
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all px-4 h-10 gap-2 font-bold"
              >
                <MessageSquare className="h-4 w-4" />
                Chat Unificado
              </TabsTrigger>
              <TabsTrigger 
                value="metricas" 
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all px-4 h-10 gap-2 font-bold"
              >
                <Activity className="h-4 w-4" />
                Métricas
              </TabsTrigger>
              <TabsTrigger 
                value="templates" 
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all px-4 h-10 gap-2 font-bold"
              >
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger 
                value="alarmes" 
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all px-4 h-10 gap-2 font-bold"
              >
                <Bell className="h-4 w-4" />
                Alarmes
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="conexao" className="space-y-6">
            <WhatsAppConnectionManager isActiveTab={activeTab === 'conexao'} />
          </TabsContent>

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
