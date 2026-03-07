import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  CreditCard,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CreditPackage {
  id: string;
  nome: string;
  descricao: string;
  quantidade_creditos: number;
  preco_venda: number;
  markup_percentual: number;
  destaque: boolean;
}

export function WhatsAppCredits() {
  const [credits, setCredits] = useState<any>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(
    null,
  );

  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      // Carregar saldo de créditos
      const { data: creditsData } = await supabase
        .from("tenant_whatsapp_credits" as any)
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .single();

      setCredits(creditsData);

      // Carregar pacotes disponíveis
      const { data: packagesData } = await supabase
        .from("credit_packages" as any)
        .select("*")
        .eq("ativo", true)
        .order("quantidade_creditos", { ascending: true });

      setPackages((packagesData || []) as any);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePurchase = async (packageId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "comprar-creditos-stripe",
        {
          body: { package_id: packageId },
        },
      );

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success("Redirecionando para o pagamento...");
        setSelectedPackage(null);
      }
    } catch (error: any) {
      toast.error("Erro na compra: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCreditStatus = () => {
    if (!credits) return "unknown";
    if (credits.saldo_creditos === 0) return "empty";
    if (credits.saldo_creditos <= credits.limiar_alerta) return "low";
    return "good";
  };

  const statusConfig = {
    good: { color: "bg-green-500", icon: CheckCircle, text: "Saldo adequado" },
    low: { color: "bg-yellow-500", icon: AlertTriangle, text: "Saldo baixo" },
    empty: { color: "bg-red-500", icon: AlertTriangle, text: "Sem créditos" },
    unknown: { color: "bg-gray-500", icon: CreditCard, text: "Carregando..." },
  };

  const status = getCreditStatus();
  const StatusIcon = statusConfig[status].icon;

  return (
    <div className="space-y-6">
      {/* Saldo Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Créditos WhatsApp
          </CardTitle>
          <CardDescription>Seu saldo atual de mensagens</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold">
                {credits?.saldo_creditos?.toLocaleString("pt-BR") || "0"}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                mensagens disponíveis
              </p>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon
                className={`h-8 w-8 ${statusConfig[status].color.replace("bg-", "text-")}`}
              />
              <span className="text-sm">{statusConfig[status].text}</span>
            </div>
          </div>

          {credits && (
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total consumido:</span>
                <span className="ml-2 font-medium">
                  {credits.creditos_consumidos.toLocaleString("pt-BR")}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Último uso:</span>
                <span className="ml-2 font-medium">
                  {credits.ultimo_consumo_at
                    ? new Date(credits.ultimo_consumo_at).toLocaleDateString(
                        "pt-BR",
                      )
                    : "Nunca"}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pacotes Disponíveis */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Comprar Créditos</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg.id} className={pkg.destaque ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{pkg.nome}</CardTitle>
                  {pkg.destaque && (
                    <Badge variant="default">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                </div>
                <CardDescription>{pkg.descricao}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {pkg.quantidade_creditos.toLocaleString("pt-BR")}
                  </div>
                  <p className="text-sm text-muted-foreground">mensagens</p>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    R$ {pkg.preco_venda.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    R$ {(pkg.preco_venda / pkg.quantidade_creditos).toFixed(4)}{" "}
                    por mensagem
                  </p>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full"
                      variant={pkg.destaque ? "default" : "outline"}
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      Comprar Agora
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar Compra</DialogTitle>
                      <DialogDescription>
                        Você está prestes a comprar{" "}
                        {pkg.quantidade_creditos.toLocaleString("pt-BR")}{" "}
                        créditos
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span>Pacote:</span>
                          <span className="font-medium">{pkg.nome}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span>Créditos:</span>
                          <span className="font-medium">
                            {pkg.quantidade_creditos.toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                          <span>Total:</span>
                          <span>R$ {pkg.preco_venda.toFixed(2)}</span>
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => handlePurchase(pkg.id)}
                        disabled={loading}
                      >
                        {loading ? "Processando..." : "Confirmar Compra"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
