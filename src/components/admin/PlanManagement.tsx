import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import { NewPlanDialog } from "./NewPlanDialog";

interface Plan {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_annual: number;
  description: string;
  active: boolean;
  features: any;
}

export const PlanManagement = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("Error loading plans:", error);
      toast.error("Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("plans")
        .update({ active: !currentStatus })
        .eq("id", planId);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("support_actions_log").insert({
          support_user_id: user.id,
          action_type: "plan_status_change",
          target_type: "plan",
          target_id: planId,
          description: `Plano ${!currentStatus ? 'ativado' : 'desativado'}`,
        });
      }

      toast.success("Status do plano atualizado");
      loadPlans();
    } catch (error) {
      console.error("Error toggling plan status:", error);
      toast.error("Erro ao atualizar status do plano");
    }
  };

  return (
    <>
      <NewPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadPlans}
        editingPlan={editingPlan}
      />
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Gerenciar Planos</h2>
          <Button onClick={() => {
            setEditingPlan(null);
            setDialogOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Carregando...</p>
      ) : plans.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Nenhum plano encontrado</p>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <Badge variant={plan.active ? "default" : "secondary"}>
                      {plan.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-4">{plan.description}</p>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="font-semibold">Mensal:</span> R$ {plan.price_monthly}
                    </div>
                    <div>
                      <span className="font-semibold">Anual:</span> R$ {plan.price_annual}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setEditingPlan(plan);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={plan.active ? "destructive" : "default"}
                    size="sm"
                    onClick={() => togglePlanStatus(plan.id, plan.active)}
                  >
                    {plan.active ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      </Card>
    </>
  );
};
