import { MainLayout } from "@/components/layout/MainLayout";
import { ListaEsperaPanel } from "@/components/admin/ListaEsperaPanel";
import { OfertasVagaMonitor } from "@/components/admin/OfertasVagaMonitor";
import { CheckinWhatsAppManager } from "@/components/admin/CheckinWhatsAppManager";
import { MetricasListaEspera } from "@/components/admin/MetricasListaEspera";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ListaEspera() {
  return (
    <MainLayout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        <div className="border-b border-muted/30 pb-6">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-300 dark:to-gray-600 pr-2 pb-1">
            Lista de Espera
          </h1>
          <p className="text-muted-foreground font-medium mt-1">
            Gerencie a lista de espera, monitore ofertas em tempo real e acompanhe check-ins pelo WhatsApp
          </p>
        </div>

        <MetricasListaEspera />

        <Tabs defaultValue="lista" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="lista">Lista de Espera</TabsTrigger>
            <TabsTrigger value="ofertas">Monitor de Ofertas</TabsTrigger>
            <TabsTrigger value="checkin">Check-ins</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-4">
            <ListaEsperaPanel />
          </TabsContent>

          <TabsContent value="ofertas" className="space-y-4">
            <OfertasVagaMonitor />
          </TabsContent>

          <TabsContent value="checkin" className="space-y-4">
            <CheckinWhatsAppManager />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
