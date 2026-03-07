import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Check, Loader2, AlertTriangle } from "lucide-react";

interface Plan {
  codigo_plano: string;
  descricao: string;
  preco_mensal_brl: number;
  moeda: string;
  ativo: boolean;
  features: string[]; // Mocked for now
}

interface Subscription {
  id: string;
  codigo_plano: string;
  status: string;
  ciclo_fim: string;
  edition: string;
}

interface PreviewData {
  current_plan: { name: string; price: number };
  new_plan: { name: string; price: number };
  prorata_amount: number;
  total_now: number;
  next_cycle_total: number;
  effective_date: string;
}

const PlanosConfig = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [processingChange, setProcessingChange] = useState(false);

  const [companySeats, setCompanySeats] = useState(5); // Default included

  const fetchData = useCallback(async () => {
    if (!profile?.tenant_id) return;
    try {
      setLoading(true);

      // Fetch Plans
      const { data: plansData } = await supabase
        .from("planos_precos")
        .select("*")
        .eq("ativo", true)
        .order("preco_mensal_brl");

      // Add mock features
      const plansWithFeatures =
        plansData?.map((p) => ({
          ...p,
          features: getFeaturesForPlan(p.codigo_plano),
        })) || [];

      setPlans(plansWithFeatures);

      // Fetch Subscription
      const { data: subData } = await supabase
        .from("assinaturas")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .in("status", ["active", "trialing", "past_due"])
        .single();

      setSubscription(subData);

      // If company plan, fetch current seats
      if (subData?.codigo_plano === "company_base") {
        const { data: seatData } = await supabase
          .from("assinatura_seats")
          .select("quantidade")
          .eq("assinatura_id", subData.id)
          .eq("tipo", "profissional")
          .single();

        if (seatData) setCompanySeats(seatData.quantidade);
      }
    } catch (error) {
      console.error("Error fetching billing data:", error);
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getFeaturesForPlan = (code: string) => {
    switch (code) {
      case "free_solo":
        return ["1 Profissional", "Até 50 Clientes", "Agendamento Manual"];
      case "pro_solo":
        return [
          "1 Profissional",
          "Clientes Ilimitados",
          "WhatsApp Automático",
          "Agendamento Online",
        ];
      case "company_base":
        return [
          "Até 5 Profissionais (Inclusos)",
          "3 Secretárias",
          "Multi-usuário",
          "Relatórios Avançados",
        ];
      default:
        return [];
    }
  };

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsDialogOpen(true);
    // If selecting company, reset seats to min or current if already company
    if (plan.codigo_plano === "company_base") {
      // If already company, keep current seats, else default to 5
      if (subscription?.codigo_plano === "company_base") {
        // Keep current (already in state)
      } else {
        setCompanySeats(5);
      }
    }
    fetchPreview(
      plan,
      plan.codigo_plano === "company_base" ? companySeats : undefined,
    );
  };

  const fetchPreview = async (plan: Plan, seats?: number) => {
    if (!subscription) return;

    // Determine if downgrade
    const currentPlanPrice =
      plans.find((p) => p.codigo_plano === subscription.codigo_plano)
        ?.preco_mensal_brl || 0;
    const isDowngrade = plan.preco_mensal_brl < currentPlanPrice;
    const effective = isDowngrade ? "next_cycle" : "immediate";

    setLoadingPreview(true);
    try {
      const { data, error } = await supabase.functions.invoke("billing-ops", {
        body: {
          action: "preview_change",
          tenantId: profile?.tenant_id,
          subscriptionId: subscription.id,
          newPlanCode: plan.codigo_plano,
          newSeats: seats ? { profissional: seats } : {},
          effective: effective,
        },
      });

      if (error) throw error;
      setPreviewData(data);
    } catch (error) {
      console.error("Error fetching preview:", error);
      toast({
        title: "Erro ao calcular valores",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleConfirmChange = async () => {
    if (!subscription || !selectedPlan || !previewData) return;
    setProcessingChange(true);
    try {
      // If changing plan
      if (selectedPlan.codigo_plano !== subscription.codigo_plano) {
        const currentPlanPrice =
          plans.find((p) => p.codigo_plano === subscription.codigo_plano)
            ?.preco_mensal_brl || 0;
        const isDowngrade = selectedPlan.preco_mensal_brl < currentPlanPrice;
        const effective = isDowngrade ? "next_cycle" : "immediate";

        const { error } = await supabase.functions.invoke("billing-ops", {
          body: {
            action: "change_plan",
            tenantId: profile?.tenant_id,
            subscriptionId: subscription.id,
            newPlanCode: selectedPlan.codigo_plano,
            effective: effective,
          },
        });
        if (error) throw error;
      }

      // If company plan and seats changed (or just switched to company)
      if (selectedPlan.codigo_plano === "company_base") {
        const { error } = await supabase.functions.invoke("billing-ops", {
          body: {
            action: "change_seats",
            tenantId: profile?.tenant_id,
            subscriptionId: subscription.id,
            type: "profissional",
            newQuantity: companySeats,
          },
        });
        if (error) throw error;
      }

      toast({
        title: "Plano alterado com sucesso!",
        description: "As alterações já estão em vigor.",
      });
      setIsDialogOpen(false);
      fetchData(); // Refresh
    } catch (error) {
      console.error("Error changing plan:", error);
      toast({
        title: "Erro ao alterar plano",
        description: "Não foi possível processar a alteração.",
        variant: "destructive",
      });
    } finally {
      setProcessingChange(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = subscription?.codigo_plano === plan.codigo_plano;
          return (
            <Card
              key={plan.codigo_plano}
              className={`p-6 flex flex-col ${isCurrent ? "border-primary ring-1 ring-primary" : ""}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{plan.descricao}</h3>
                  <p className="text-2xl font-bold mt-2">
                    R$ {plan.preco_mensal_brl.toFixed(2)}
                    <span className="text-sm font-normal text-muted-foreground">
                      /mês
                    </span>
                  </p>
                </div>
                {isCurrent && <Badge>Atual</Badge>}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                variant={isCurrent ? "outline" : "default"}
                className="w-full"
                onClick={() => handleSelectPlan(plan)}
                disabled={isCurrent && plan.codigo_plano !== "company_base"} // Allow clicking current if company (to change seats)
              >
                {isCurrent
                  ? plan.codigo_plano === "company_base"
                    ? "Gerenciar Seats"
                    : "Plano Atual"
                  : "Selecionar Plano"}
              </Button>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmar Alteração de Plano</DialogTitle>
            <DialogDescription>
              Revise os detalhes da alteração antes de confirmar.
            </DialogDescription>
          </DialogHeader>

          {selectedPlan?.codigo_plano === "company_base" && (
            <div className="py-4 border-b">
              <Label>Número de Profissionais</Label>
              <div className="flex items-center gap-4 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newVal = Math.max(1, companySeats - 1);
                    setCompanySeats(newVal);
                    fetchPreview(selectedPlan, newVal);
                  }}
                >
                  -
                </Button>
                <span className="text-lg font-bold">{companySeats}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newVal = companySeats + 1;
                    setCompanySeats(newVal);
                    fetchPreview(selectedPlan, newVal);
                  }}
                >
                  +
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {companySeats <= 5
                  ? "Incluso no plano (até 5)"
                  : `${companySeats - 5} profissional(is) extra(s)`}
              </p>
            </div>
          )}

          {loadingPreview ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="animate-spin" />
            </div>
          ) : previewData ? (
            <div className="space-y-4 py-4">
              <div className="flex justify-between text-sm">
                <span>Plano Atual:</span>
                <span className="font-medium">
                  {previewData.current_plan.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Novo Plano:</span>
                <span className="font-medium">{previewData.new_plan.name}</span>
              </div>

              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between text-sm">
                  <span>Valor Pró-rata (Hoje):</span>
                  <span className="font-bold text-primary">
                    R$ {previewData.total_now.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cobrado imediatamente no cartão cadastrado.
                </p>
              </div>

              <div className="bg-muted p-3 rounded-md mt-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Próxima Mensalidade:</span>
                  <span>R$ {previewData.next_cycle_total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  A partir de{" "}
                  {new Date(previewData.effective_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-red-500">
              Erro ao carregar preview.
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmChange}
              disabled={processingChange || loadingPreview}
            >
              {processingChange ? (
                <Loader2 className="animate-spin mr-2" />
              ) : null}
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlanosConfig;
