import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface NewPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingPlan?: any;
}

export const NewPlanDialog = ({ open, onOpenChange, onSuccess, editingPlan }: NewPlanDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: editingPlan?.name || "",
    slug: editingPlan?.slug || "",
    description: editingPlan?.description || "",
    price_monthly: editingPlan?.price_monthly || "",
    price_annual: editingPlan?.price_annual || "",
    features: editingPlan?.features?.join("\n") || "",
    max_professionals: editingPlan?.max_professionals || "",
    max_messages_per_month: editingPlan?.max_messages_per_month || "",
    is_custom: editingPlan?.is_custom || false,
    active: editingPlan?.active ?? true,
    display_order: editingPlan?.display_order || "0"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const featuresArray = formData.features
        .split("\n")
        .filter(f => f.trim())
        .map(f => f.trim());

      const planData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        price_monthly: parseFloat(formData.price_monthly) || 0,
        price_annual: parseFloat(formData.price_annual) || 0,
        features: featuresArray,
        max_professionals: formData.max_professionals ? parseInt(formData.max_professionals) : null,
        max_messages_per_month: formData.max_messages_per_month ? parseInt(formData.max_messages_per_month) : null,
        is_custom: formData.is_custom,
        active: formData.active,
        display_order: parseInt(formData.display_order) || 0
      };

      if (editingPlan) {
        const { error } = await supabase
          .from("plans")
          .update(planData)
          .eq("id", editingPlan.id);

        if (error) throw error;

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("support_actions_log").insert({
            support_user_id: user.id,
            action_type: "plan_update",
            target_type: "plan",
            target_id: editingPlan.id,
            description: `Plano ${formData.name} atualizado`,
          });
        }

        toast.success("Plano atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("plans")
          .insert([planData]);

        if (error) throw error;

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("support_actions_log").insert({
            support_user_id: user.id,
            action_type: "plan_create",
            target_type: "plan",
            description: `Novo plano ${formData.name} criado`,
          });
        }

        toast.success("Plano criado com sucesso");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Erro ao salvar plano");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPlan ? "Editar Plano" : "Novo Plano"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome do Plano</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug (identificador único)</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price_monthly">Preço Mensal (R$)</Label>
              <Input
                id="price_monthly"
                type="number"
                step="0.01"
                value={formData.price_monthly}
                onChange={(e) => setFormData({ ...formData, price_monthly: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="price_annual">Preço Anual (R$)</Label>
              <Input
                id="price_annual"
                type="number"
                step="0.01"
                value={formData.price_annual}
                onChange={(e) => setFormData({ ...formData, price_annual: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="features">Funcionalidades (uma por linha)</Label>
            <Textarea
              id="features"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              rows={6}
              placeholder="Ex:&#10;Agenda ilimitada&#10;Confirmações automáticas&#10;Relatórios básicos"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="max_professionals">Máx. Profissionais</Label>
              <Input
                id="max_professionals"
                type="number"
                value={formData.max_professionals}
                onChange={(e) => setFormData({ ...formData, max_professionals: e.target.value })}
                placeholder="Deixe vazio para ilimitado"
              />
            </div>
            <div>
              <Label htmlFor="max_messages_per_month">Máx. Mensagens/Mês</Label>
              <Input
                id="max_messages_per_month"
                type="number"
                value={formData.max_messages_per_month}
                onChange={(e) => setFormData({ ...formData, max_messages_per_month: e.target.value })}
                placeholder="Deixe vazio para ilimitado"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="display_order">Ordem de Exibição</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_custom"
                checked={formData.is_custom}
                onCheckedChange={(checked) => setFormData({ ...formData, is_custom: checked })}
              />
              <Label htmlFor="is_custom">Plano Customizado</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              />
              <Label htmlFor="active">Ativo</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : editingPlan ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};