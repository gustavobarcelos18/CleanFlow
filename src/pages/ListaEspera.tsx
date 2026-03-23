import { MainLayout } from "@/components/layout/MainLayout";
import { ListaEsperaPanel } from "@/components/admin/ListaEsperaPanel";
import { OfertasVagaMonitor } from "@/components/admin/OfertasVagaMonitor";
import { CheckinWhatsAppManager } from "@/components/admin/CheckinWhatsAppManager";
import { MetricasListaEspera } from "@/components/admin/MetricasListaEspera";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLayoutTitle } from "@/hooks/useLayoutTitle";
import { useEffect } from "react";
import { Users, Zap, Bell, BarChart3 } from "lucide-react";

const ListaEspera = () => {
  const { setTitle, setSubtitle } = useLayoutTitle();

  useEffect(() => {
    if (setTitle) setTitle("Lista de Espera");
    if (setSubtitle) setSubtitle("Gerencie pacientes aguardando atendimento e ofertas de vagas");
  }, [setTitle, setSubtitle]);

  return (
    <MainLayout>
      <div className="animate-in fade-in duration-500 pb-12">
        <Tabs defaultValue="lista" className="space-y-6">
          <div className="bg-card/30 p-1 rounded-xl border border-border/50 backdrop-blur-md sticky top-0 z-10">
            <TabsList className="w-full justify-start bg-transparent h-12 gap-2 overflow-x-auto whitespace-nowrap scrollbar-none px-1">
              <TabsTrigger 
                value="lista" 
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all px-4 h-10 gap-2 font-bold"
              >
                <Users className="h-4 w-4" />
                Fila de Espera
              </TabsTrigger>
              <TabsTrigger 
                value="ofertas" 
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all px-4 h-10 gap-2 font-bold"
              >
                <Zap className="h-4 w-4" />
                Ofertas Ativas
              </TabsTrigger>
              <TabsTrigger 
                value="checkin" 
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all px-4 h-10 gap-2 font-bold"
              >
                <Bell className="h-4 w-4" />
                Check-in WhatsApp
              </TabsTrigger>
              <TabsTrigger 
                value="metricas" 
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg transition-all px-4 h-10 gap-2 font-bold"
              >
                <BarChart3 className="h-4 w-4" />
                Métricas
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="lista" className="mt-0 outline-none">
            <ListaEsperaPanel />
          </TabsContent>
          
          <TabsContent value="ofertas" className="mt-0 outline-none">
            <OfertasVagaMonitor />
          </TabsContent>
          
          <TabsContent value="checkin" className="mt-0 outline-none">
            <CheckinWhatsAppManager />
          </TabsContent>
          
          <TabsContent value="metricas" className="mt-0 outline-none">
            <MetricasListaEspera />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default ListaEspera;
