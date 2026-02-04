import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface NewTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function NewTenantDialog({ open, onOpenChange, onSuccess }: NewTenantDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cidade: "",
    uf: "",
    tipo: "consultorio" as "consultorio" | "clinica",
    cnpj: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("tenants")
        .insert({
          ...formData,
          status: 'ativo'
        });

      if (error) throw error;

      // Log action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("support_actions_log").insert({
          support_user_id: user.id,
          action_type: "tenant_created",
          target_type: "tenant",
          description: `Tenant criado: ${formData.nome}`,
        });
      }

      toast.success("Tenant criado com sucesso");
      onSuccess();
      onOpenChange(false);
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        cidade: "",
        uf: "",
        tipo: "consultorio",
        cnpj: ""
      });
    } catch (error: any) {
      console.error("Error creating tenant:", error);
      toast.error(error.message || "Erro ao criar tenant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Tenant</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: "consultorio" | "clinica") => setFormData({ ...formData, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultorio">Consultório</SelectItem>
                  <SelectItem value="clinica">Clínica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="cidade">Cidade *</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="uf">UF *</Label>
              <Input
                id="uf"
                value={formData.uf}
                onChange={(e) => setFormData({ ...formData, uf: e.target.value })}
                maxLength={2}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Tenant
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}