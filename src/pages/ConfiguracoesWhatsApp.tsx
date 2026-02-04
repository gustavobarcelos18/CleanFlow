import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/layout/MainLayout";
import { WhatsAppCredits } from "@/components/admin/WhatsAppCredits";
import { WhatsAppPhoneManager } from "@/components/admin/WhatsAppPhoneManager";
import { LembreteTemplateManager } from "@/components/admin/LembreteTemplateManager";
import { RemarcacaoGuiada } from "@/components/admin/RemarcacaoGuiada";
import { CreditCard, Bell, Calendar, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ConfiguracoesWhatsApp() {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const payment = searchParams.get("payment");
    const packageId = searchParams.get("package_id");
    const sessionId = searchParams.get("session_id");
    const phoneSuccess = searchParams.get("phone_success");

    if (payment === "success" && packageId && sessionId) {
      processPayment(sessionId);
    } else if (payment === "canceled") {
      toast.error("Pagamento cancelado");
    } else if (phoneSuccess === "true") {
      toast.success("Número contratado com sucesso! Aguarde a ativação.");
      window.history.replaceState({}, '', '/configuracoes-whatsapp');
    }
  }, [searchParams]);

  const processPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('processar-pagamento-creditos', {
        body: { session_id: sessionId }
      });

      if (error) throw error;

      toast.success("Créditos adicionados com sucesso!");
      window.history.replaceState({}, '', '/configuracoes-whatsapp');
    } catch (error: any) {
      console.error('Erro ao processar pagamento:', error);
      toast.error(error.message || "Erro ao processar pagamento");
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">WhatsApp Business</h1>
          <p className="text-muted-foreground mt-2">
            Configure sua integração, números e gerencie seus créditos
          </p>
        </div>

        <Tabs defaultValue="phones" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[800px]">
            <TabsTrigger value="phones" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Números
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Créditos
            </TabsTrigger>
            <TabsTrigger value="lembretes" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Lembretes
            </TabsTrigger>
            <TabsTrigger value="remarcacao" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Remarcação
            </TabsTrigger>
          </TabsList>

          <TabsContent value="phones" className="space-y-6">
            <WhatsAppPhoneManager />
          </TabsContent>

          <TabsContent value="credits" className="space-y-6">
            <WhatsAppCredits />
          </TabsContent>

          <TabsContent value="lembretes" className="space-y-6">
            <LembreteTemplateManager />
          </TabsContent>

          <TabsContent value="remarcacao" className="space-y-6">
            <RemarcacaoGuiada />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
