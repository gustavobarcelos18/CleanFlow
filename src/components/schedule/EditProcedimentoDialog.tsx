import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { formatCurrencyBRL, parseCurrencyToNumber } from "@/lib/currency";

interface EditProcedimentoDialogProps {
  procedimentoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function EditProcedimentoDialog({
  procedimentoId,
  open,
  onOpenChange,
  onSuccess,
  children,
}: EditProcedimentoDialogProps) {
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

  const fetchProcedimento = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .eq("id", procedimentoId)
        .single();

      if (error) throw error;

      setFormData({
        nome: data.nome || "",
        duracao_minutos: data.duracao_minutos?.toString() || "",
        valor: data.preco ? formatCurrencyBRL(data.preco) : "",
        codigo_tuss: data.codigo_tuss || "",
        descricao: data.descricao || "",
        instrucoes_preparo: data.instrucoes_preparo || "",
        instrucoes_pos: data.instrucoes_pos || "",
        anestesia_necessaria: data.anestesia_necessaria || false,
        tipo_anestesia: data.tipo_anestesia || "",
        ativo: data.ativo !== false,
      });
    } catch (error) {
      console.error("Erro ao buscar procedimento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do procedimento.",
        variant: "destructive",
      });
    }
  }, [procedimentoId, toast]);

  useEffect(() => {
    if (open && procedimentoId) {
      fetchProcedimento();
    }
  }, [open, procedimentoId, fetchProcedimento]);

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

      const { error } = await supabase
        .from("servicos")
        .update({
          nome: formData.nome.trim().toUpperCase(),
          duracao_minutos: parseInt(formData.duracao_minutos),
          preco: formData.valor ? parseCurrencyToNumber(formData.valor) : null,
          codigo_tuss: formData.codigo_tuss.trim() || null,
          descricao: formData.descricao.trim() || null,
          instrucoes_preparo: formData.instrucoes_preparo.trim() || null,
          instrucoes_pos: formData.instrucoes_pos.trim() || null,
          anestesia_necessaria: formData.anestesia_necessaria,
          tipo_anestesia: formData.tipo_anestesia.trim() || null,
          ativo: formData.ativo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", procedimentoId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Procedimento atualizado com sucesso.",
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Erro ao atualizar procedimento:", error);

      let errorMessage = "Não foi possível atualizar o procedimento.";
      if (error.code === "23505") {
        errorMessage = "Já existe um procedimento cadastrado com este nome.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Procedimento</DialogTitle>
          <DialogDescription>
            Altere as informações do procedimento
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
                  setFormData((prev) => ({
                    ...prev,
                    nome: e.target.value.toUpperCase(),
                  }))
                }
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
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="text"
                value={formData.valor}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    valor: formatCurrencyBRL(e.target.value),
                  }))
                }
                placeholder="R$ 0,00"
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
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
