import { MainLayout } from "@/components/layout/MainLayout";
import { ListaEsperaPanel } from "@/components/admin/ListaEsperaPanel";
import { OfertasVagaMonitor } from "@/components/admin/OfertasVagaMonitor";
import { CheckinWhatsAppManager } from "@/components/admin/CheckinWhatsAppManager";
import { MetricasListaEspera } from "@/components/admin/MetricasListaEspera";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ListaEspera() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Lista de Espera Inteligente</h1>
          <p className="text-muted-foreground mt-2">
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
