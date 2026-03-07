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
import { useAuth } from "@/hooks/useAuth";

interface Service {
  id: string;
  nome: string;
}

interface EditPacoteDialogProps {
  pacoteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditPacoteDialog({
  pacoteId,
  open,
  onOpenChange,
  onSuccess,
}: EditPacoteDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    servico_id: "",
    numero_sessoes: "",
    preco: "",
    validade_dias: "90",
    renovacao_automatica: false,
    desconto_renovacao: "0",
    limiar_renovacao: "2",
    oferta_renovacao_ativa: true,
    ativo: true,
  });

  const { toast } = useToast();

  const fetchServices = useCallback(async () => {
    if (!profile?.tenant_id) return;
    try {
      const { data, error } = await supabase
        .from("servicos")
        .select("id, nome")
        .eq("tenant_id", profile.tenant_id)
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Erro ao buscar procedimentos:", error);
    }
  }, [profile?.tenant_id]);

  const fetchPacote = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pacotes")
        .select("*")
        .eq("id", pacoteId)
        .single();

      if (error) throw error;

      setFormData({
        nome: data.nome || "",
        descricao: data.descricao || "",
        servico_id: data.servico_id || "",
        numero_sessoes: data.numero_sessoes?.toString() || "",
        preco: data.preco?.toString() || "",
        validade_dias: data.validade_dias?.toString() || "90",
        renovacao_automatica: data.renovacao_automatica || false,
        desconto_renovacao: data.desconto_renovacao?.toString() || "0",
        limiar_renovacao: data.limiar_renovacao?.toString() || "2",
        oferta_renovacao_ativa: data.oferta_renovacao_ativa !== false,
        ativo: data.ativo !== false,
      });
    } catch (error) {
      console.error("Erro ao buscar pacote:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do pacote.",
        variant: "destructive",
      });
    }
  }, [pacoteId, toast]);

  useEffect(() => {
    if (open && profile?.tenant_id) {
      fetchServices();
      if (pacoteId) {
        fetchPacote();
      }
    }
  }, [open, pacoteId, profile?.tenant_id, fetchServices, fetchPacote]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.numero_sessoes || !formData.preco) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome, número de sessões e preço são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("pacotes")
        .update({
          nome: formData.nome.trim(),
          descricao: formData.descricao.trim() || null,
          servico_id: formData.servico_id || null,
          numero_sessoes: parseInt(formData.numero_sessoes),
          preco: parseFloat(formData.preco),
          validade_dias: parseInt(formData.validade_dias),
          renovacao_automatica: formData.renovacao_automatica,
          desconto_renovacao: parseFloat(formData.desconto_renovacao),
          limiar_renovacao: parseInt(formData.limiar_renovacao),
          oferta_renovacao_ativa: formData.oferta_renovacao_ativa,
          ativo: formData.ativo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pacoteId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Pacote atualizado com sucesso.",
      });

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o pacote.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Editar Pacote</DialogTitle>
          <DialogDescription>
            Atualize as informações do pacote de tratamento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Pacote *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              placeholder="Ex: Pacote 10 Sessões"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              placeholder="Descrição do pacote..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="servico">Procedimento (Opcional)</Label>
            <Select
              value={formData.servico_id}
              onValueChange={(value) =>
                setFormData({ ...formData, servico_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um procedimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum procedimento específico</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_sessoes">Número de Sessões *</Label>
              <Input
                id="numero_sessoes"
                type="number"
                min="1"
                value={formData.numero_sessoes}
                onChange={(e) =>
                  setFormData({ ...formData, numero_sessoes: e.target.value })
                }
                placeholder="10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco">Preço (R$) *</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco}
                onChange={(e) =>
                  setFormData({ ...formData, preco: e.target.value })
                }
                placeholder="500.00"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="validade">Validade (dias)</Label>
            <Input
              id="validade"
              type="number"
              min="1"
              value={formData.validade_dias}
              onChange={(e) =>
                setFormData({ ...formData, validade_dias: e.target.value })
              }
              placeholder="90"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="renovacao">Renovação Automática</Label>
            <Switch
              id="renovacao"
              checked={formData.renovacao_automatica}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, renovacao_automatica: checked })
              }
            />
          </div>

          {formData.renovacao_automatica && (
            <div className="space-y-2">
              <Label htmlFor="desconto">Desconto na Renovação (%)</Label>
              <Input
                id="desconto"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.desconto_renovacao}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    desconto_renovacao: e.target.value,
                  })
                }
                placeholder="10"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="oferta">Oferecer Renovação Automática</Label>
            <Switch
              id="oferta"
              checked={formData.oferta_renovacao_ativa}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, oferta_renovacao_ativa: checked })
              }
            />
          </div>

          {formData.oferta_renovacao_ativa && (
            <div className="space-y-2">
              <Label htmlFor="limiar">
                Sessões Restantes para Oferta de Renovação
              </Label>
              <Input
                id="limiar"
                type="number"
                min="1"
                max="10"
                value={formData.limiar_renovacao}
                onChange={(e) =>
                  setFormData({ ...formData, limiar_renovacao: e.target.value })
                }
                placeholder="2"
              />
              <p className="text-xs text-muted-foreground">
                Quando restarem este número de sessões, o sistema oferecerá
                renovação
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label htmlFor="ativo">Pacote ativo?</Label>
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
