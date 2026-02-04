import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EditTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  onSuccess: () => void;
}

export const EditTenantDialog = ({ open, onOpenChange, tenantId, onSuccess }: EditTenantDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    plan_id: "",
    status: "active",
    billing_cycle: "monthly"
  });

  useEffect(() => {
    if (open) {
      loadPlans();
      loadCurrentSubscription();
    }
  }, [open, tenantId]);

  const loadPlans = async () => {
    const { data } = await supabase
      .from("plans")
      .select("*")
      .eq("active", true)
      .order("display_order");
    
    setPlans(data || []);
  };

  const loadCurrentSubscription = async () => {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("tenant_id", tenantId)
      .single();

    if (data) {
      setFormData({
        plan_id: data.plan_id,
        status: data.status,
        billing_cycle: data.billing_cycle
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if subscription exists
      const { data: existing } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("tenant_id", tenantId)
        .single();

      const subscriptionData = {
        tenant_id: tenantId,
        plan_id: formData.plan_id,
        status: formData.status,
        billing_cycle: formData.billing_cycle,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      if (existing) {
        const { error } = await supabase
          .from("subscriptions")
          .update(subscriptionData)
          .eq("tenant_id", tenantId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("subscriptions")
          .insert([subscriptionData]);

        if (error) throw error;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("support_actions_log").insert({
          support_user_id: user.id,
          action_type: "tenant_subscription_update",
          target_type: "tenant",
          target_id: tenantId,
          description: `Assinatura do tenant atualizada`,
        });
      }

      toast.success("Assinatura atualizada com sucesso");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast.error("Erro ao atualizar assinatura");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Assinatura do Tenant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="plan_id">Plano</Label>
            <Select
              value={formData.plan_id}
              onValueChange={(value) => setFormData({ ...formData, plan_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="trialing">Em Trial</SelectItem>
                <SelectItem value="past_due">Vencido</SelectItem>
                <SelectItem value="canceled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="billing_cycle">Ciclo de Cobrança</Label>
            <Select
              value={formData.billing_cycle}
              onValueChange={(value) => setFormData({ ...formData, billing_cycle: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="annual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};