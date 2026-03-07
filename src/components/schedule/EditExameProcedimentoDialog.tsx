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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type TipoExameProcedimento =
  | "exame_laboratorial"
  | "exame_imagem"
  | "procedimento_cirurgico"
  | "procedimento_terapeutico"
  | "procedimento_diagnostico";

interface EditExameProcedimentoDialogProps {
  itemId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditExameProcedimentoDialog({
  itemId,
  open,
  onOpenChange,
  onSuccess,
}: EditExameProcedimentoDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "" as TipoExameProcedimento | "",
    codigo_tuss: "",
    descricao: "",
    tempo_preparo_minutos: "",
    tempo_jejum_horas: "",
    duracao_minutos: "",
    valor: "",
    instrucoes: "",
    requisitos: "",
  });

  const { toast } = useToast();

  const fetchItem = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("exames_procedimentos")
        .select("*")
        .eq("id", itemId)
        .single();

      if (error) throw error;

      setFormData({
        nome: data.nome || "",
        tipo: data.tipo || "",
        codigo_tuss: data.codigo_tuss || "",
        descricao: data.descricao || "",
        tempo_preparo_minutos: data.tempo_preparo_minutos?.toString() || "",
        tempo_jejum_horas: data.tempo_jejum_horas?.toString() || "",
        duracao_minutos: data.duracao_minutos?.toString() || "",
        valor: data.valor?.toString() || "",
        instrucoes: data.instrucoes || "",
        requisitos: data.requisitos || "",
      });
    } catch (error) {
      console.error("Erro ao buscar item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do item.",
        variant: "destructive",
      });
    }
  }, [itemId, toast]);

  useEffect(() => {
    if (open && itemId) {
      fetchItem();
    }
  }, [open, itemId, fetchItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.tipo) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e tipo são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("exames_procedimentos")
        .update({
          nome: formData.nome.trim().toUpperCase(),
          tipo: formData.tipo,
          codigo_tuss: formData.codigo_tuss.trim() || null,
          descricao: formData.descricao.trim() || null,
          tempo_preparo_minutos: formData.tempo_preparo_minutos
            ? parseInt(formData.tempo_preparo_minutos)
            : null,
          tempo_jejum_horas: formData.tempo_jejum_horas
            ? parseInt(formData.tempo_jejum_horas)
            : null,
          duracao_minutos: formData.duracao_minutos
            ? parseInt(formData.duracao_minutos)
            : null,
          valor: formData.valor ? parseFloat(formData.valor) : null,
          instrucoes: formData.instrucoes.trim() || null,
          requisitos: formData.requisitos.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", itemId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Item atualizado com sucesso.",
      });

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o item.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Editar Exame/Procedimento
          </DialogTitle>
          <DialogDescription>
            Atualize as informações do exame ou procedimento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    nome: e.target.value.toUpperCase(),
                  })
                }
                placeholder="NOME DO EXAME OU PROCEDIMENTO"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    tipo: value as TipoExameProcedimento,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exame_laboratorial">
                    Exame Laboratorial
                  </SelectItem>
                  <SelectItem value="exame_imagem">Exame de Imagem</SelectItem>
                  <SelectItem value="procedimento_cirurgico">
                    Procedimento Cirúrgico
                  </SelectItem>
                  <SelectItem value="procedimento_terapeutico">
                    Procedimento Terapêutico
                  </SelectItem>
                  <SelectItem value="procedimento_diagnostico">
                    Procedimento Diagnóstico
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo_tuss">Código TUSS</Label>
              <Input
                id="codigo_tuss"
                value={formData.codigo_tuss}
                onChange={(e) =>
                  setFormData({ ...formData, codigo_tuss: e.target.value })
                }
                placeholder="Código TUSS"
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
                  setFormData({ ...formData, valor: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              placeholder="Descrição detalhada"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tempo_preparo">Tempo Preparo (min)</Label>
              <Input
                id="tempo_preparo"
                type="number"
                min="0"
                value={formData.tempo_preparo_minutos}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tempo_preparo_minutos: e.target.value,
                  })
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tempo_jejum">Tempo Jejum (horas)</Label>
              <Input
                id="tempo_jejum"
                type="number"
                min="0"
                value={formData.tempo_jejum_horas}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tempo_jejum_horas: e.target.value,
                  })
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracao">Duração (min)</Label>
              <Input
                id="duracao"
                type="number"
                min="0"
                value={formData.duracao_minutos}
                onChange={(e) =>
                  setFormData({ ...formData, duracao_minutos: e.target.value })
                }
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instrucoes">Instruções</Label>
            <Textarea
              id="instrucoes"
              value={formData.instrucoes}
              onChange={(e) =>
                setFormData({ ...formData, instrucoes: e.target.value })
              }
              placeholder="Instruções para o paciente"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requisitos">Requisitos</Label>
            <Textarea
              id="requisitos"
              value={formData.requisitos}
              onChange={(e) =>
                setFormData({ ...formData, requisitos: e.target.value })
              }
              placeholder="Requisitos necessários"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
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
