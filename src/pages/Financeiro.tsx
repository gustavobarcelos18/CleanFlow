import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, TrendingUp } from "lucide-react";
import ContasPix from "@/components/financeiro/ContasPix";
import PlanoSaudeValores from "@/components/financeiro/PlanoSaudeValores";
import ContasReceber from "@/components/financeiro/ContasReceber";
import { MainLayout } from "@/components/layout/MainLayout";

export default function Financeiro() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Módulo Financeiro</h1>
          <p className="text-muted-foreground">
            Gerencie formas de pagamento, valores de planos e contas a receber
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">A Receber</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 0,00</div>
              <p className="text-xs text-muted-foreground">Próximos 30 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Com valores cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas PIX</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Cadastradas</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="receber" className="space-y-4">
          <TabsList>
            <TabsTrigger value="receber">Contas a Receber</TabsTrigger>
            <TabsTrigger value="pix">Contas PIX</TabsTrigger>
            <TabsTrigger value="planos">Valores de Planos</TabsTrigger>
          </TabsList>

          <TabsContent value="receber" className="space-y-4">
            <ContasReceber />
          </TabsContent>

          <TabsContent value="pix" className="space-y-4">
            <ContasPix />
          </TabsContent>

          <TabsContent value="planos" className="space-y-4">
            <PlanoSaudeValores />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
