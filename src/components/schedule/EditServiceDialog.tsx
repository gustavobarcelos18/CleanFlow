import React, { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface EditServiceDialogProps {
  serviceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditServiceDialog({
  serviceId,
  open,
  onOpenChange,
  onSuccess,
}: EditServiceDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    duracao_minutos: "",
    preco: "",
    confirmacao_24h: false,
    ativo: true,
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open && serviceId) {
      fetchService();
    }
  }, [open, serviceId]);

  const fetchService = async () => {
    try {
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .eq("id", serviceId)
        .single();

      if (error) throw error;

      setFormData({
        nome: data.nome || "",
        duracao_minutos: data.duracao_minutos?.toString() || "",
        preco: data.preco?.toString() || "",
        confirmacao_24h: data.confirmacao_24h || false,
        ativo: data.ativo !== false,
      });
    } catch (error) {
      console.error("Erro ao buscar serviço:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do serviço.",
        variant: "destructive",
      });
    }
  };

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
          preco: formData.preco ? parseFloat(formData.preco) : null,
          confirmacao_24h: formData.confirmacao_24h,
          ativo: formData.ativo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", serviceId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Serviço atualizado com sucesso.",
      });

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o serviço.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Editar Serviço</DialogTitle>
          <DialogDescription>
            Atualize as informações do serviço
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Serviço *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value.toUpperCase() })
              }
              placeholder="EX: CONSULTA, PROCEDIMENTO, EXAME"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duracao">Duração (minutos) *</Label>
              <Input
                id="duracao"
                type="number"
                min="1"
                value={formData.duracao_minutos}
                onChange={(e) =>
                  setFormData({ ...formData, duracao_minutos: e.target.value })
                }
                placeholder="30"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco">Preço (R$)</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco}
                onChange={(e) =>
                  setFormData({ ...formData, preco: e.target.value })
                }
                placeholder="150.00"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="confirmacao">Confirmar 24h antes?</Label>
            <Switch
              id="confirmacao"
              checked={formData.confirmacao_24h}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, confirmacao_24h: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="ativo">Serviço ativo?</Label>
            <Switch
              id="ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, ativo: checked })
              }
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
