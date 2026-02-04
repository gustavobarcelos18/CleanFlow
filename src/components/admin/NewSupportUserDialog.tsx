import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface NewSupportUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const roleOptions = [
  { value: "leitura", label: "Leitura" },
  { value: "agente", label: "Agente" },
  { value: "financeiro", label: "Financeiro" },
  { value: "admin", label: "Admin" },
  { value: "master", label: "Master" }
];

export function NewSupportUserDialog({ open, onOpenChange, onSuccess }: NewSupportUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    funcoes: [] as string[]
  });

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      funcoes: prev.funcoes.includes(role)
        ? prev.funcoes.filter(r => r !== role)
        : [...prev.funcoes, role]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.funcoes.length === 0) {
      toast.error("Selecione pelo menos uma função");
      return;
    }

    setLoading(true);

    try {
      // Create auth user
      const tempPassword = Math.random().toString(36).slice(-12);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: tempPassword,
        options: {
          data: {
            nome: formData.nome
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Usuário não criado");

      // Create support user record in usuarios_suporte table
      const { error: supportUserError } = await supabase
        .from("usuarios_suporte")
        .insert({
          auth_user_id: authData.user.id,
          nome: formData.nome,
          email: formData.email,
          telefone: formData.telefone,
          status: 'ativo',
          funcoes: formData.funcoes,
          forcar_troca_senha: true
        } as any);

      if (supportUserError) throw supportUserError;

      // Log action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("support_actions_log").insert({
          support_user_id: user.id,
          action_type: "usuario_criado",
          target_type: "usuarios_suporte",
          target_id: authData.user.id,
          description: `Usuário de suporte criado: ${formData.nome}`,
        });
      }

      toast.success("Usuário criado com sucesso. Um email foi enviado com instruções.");
      onSuccess();
      onOpenChange(false);
      setFormData({ nome: "", email: "", telefone: "", funcoes: [] });
    } catch (error: any) {
      console.error("Error creating support user:", error);
      toast.error(error.message || "Erro ao criar usuário");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Usuário de Suporte</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Funções *</Label>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map((role) => (
                <div key={role.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={role.value}
                    checked={formData.funcoes.includes(role.value)}
                    onCheckedChange={() => handleRoleToggle(role.value)}
                  />
                  <label
                    htmlFor={role.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {role.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Usuário
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}