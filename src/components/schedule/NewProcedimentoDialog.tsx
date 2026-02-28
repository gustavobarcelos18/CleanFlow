import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus } from "lucide-react";

interface NewProcedimentoDialogProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function NewProcedimentoDialog({
  children,
  onSuccess,
}: NewProcedimentoDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    duracao_minutos: "",
    valor: "",
    codigo_tuss: "",
    descricao: "",
    instrucoes_preparo: "",
    instrucoes_pos: "",
    anestesia_necessaria: false,
    tipo_anestesia: "",
    ativo: true,
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.duracao_minutos) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e duração são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

      const { error } = await supabase.from("procedimentos").insert([
        {
          tenant_id: profile.tenant_id,
          nome: formData.nome.trim(),
          duracao_minutos: parseInt(formData.duracao_minutos),
          valor: formData.valor ? parseFloat(formData.valor) : null,
          codigo_tuss: formData.codigo_tuss.trim() || null,
          descricao: formData.descricao.trim() || null,
          instrucoes_preparo: formData.instrucoes_preparo.trim() || null,
          instrucoes_pos: formData.instrucoes_pos.trim() || null,
          anestesia_necessaria: formData.anestesia_necessaria,
          tipo_anestesia: formData.tipo_anestesia.trim() || null,
          ativo: formData.ativo,
        },
      ]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Procedimento criado com sucesso.",
      });

      setFormData({
        nome: "",
        duracao_minutos: "",
        valor: "",
        codigo_tuss: "",
        descricao: "",
        instrucoes_preparo: "",
        instrucoes_pos: "",
        anestesia_necessaria: false,
        tipo_anestesia: "",
        ativo: true,
      });

      setOpen(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Erro ao criar procedimento:", error);
      toast({
        title: "Erro",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível criar o procedimento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Procedimento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Procedimento</DialogTitle>
          <DialogDescription>
            Adicione um novo procedimento ao sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Ex: Depilação a Laser"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo_tuss">Código TUSS</Label>
              <Input
                id="codigo_tuss"
                value={formData.codigo_tuss}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    codigo_tuss: e.target.value,
                  }))
                }
                placeholder="Ex: 31101012"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracao">Duração (minutos) *</Label>
              <Input
                id="duracao"
                type="number"
                min="1"
                value={formData.duracao_minutos}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    duracao_minutos: e.target.value,
                  }))
                }
                placeholder="30"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                value={formData.valor}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, valor: e.target.value }))
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
                placeholder="Descrição do procedimento..."
                rows={2}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="instrucoes_preparo">Instruções de Preparo</Label>
              <Textarea
                id="instrucoes_preparo"
                value={formData.instrucoes_preparo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    instrucoes_preparo: e.target.value,
                  }))
                }
                placeholder="Instruções de preparo para o paciente..."
                rows={2}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="instrucoes_pos">
                Instruções Pós-Procedimento
              </Label>
              <Textarea
                id="instrucoes_pos"
                value={formData.instrucoes_pos}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    instrucoes_pos: e.target.value,
                  }))
                }
                placeholder="Instruções pós-procedimento..."
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between col-span-2">
              <Label htmlFor="anestesia_necessaria">Anestesia Necessária</Label>
              <Switch
                id="anestesia_necessaria"
                checked={formData.anestesia_necessaria}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    anestesia_necessaria: checked,
                  }))
                }
              />
            </div>

            {formData.anestesia_necessaria && (
              <div className="space-y-2 col-span-2">
                <Label htmlFor="tipo_anestesia">Tipo de Anestesia</Label>
                <Input
                  id="tipo_anestesia"
                  value={formData.tipo_anestesia}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      tipo_anestesia: e.target.value,
                    }))
                  }
                  placeholder="Ex: Local, Sedação..."
                />
              </div>
            )}

            <div className="flex items-center justify-between col-span-2">
              <Label htmlFor="ativo">Ativo</Label>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, ativo: checked }))
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Procedimento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
