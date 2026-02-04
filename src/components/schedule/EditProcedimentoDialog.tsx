import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

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
  children
}: EditProcedimentoDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    duracao_minutos: "",
    preco: "",
    codigo_tuss: "",
    descricao: "",
    tempo_preparo_minutos: "",
    instrucoes: "",
    requisitos: "",
    confirmacao_24h: false,
    ativo: true
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open && procedimentoId) {
      fetchProcedimento();
    }
  }, [open, procedimentoId]);

  const fetchProcedimento = async () => {
    try {
      const { data, error } = await supabase
        .from('procedimentos')
        .select('*')
        .eq('id', procedimentoId)
        .single();

      if (error) throw error;

      setFormData({
        nome: data.nome || "",
        duracao_minutos: data.duracao_minutos?.toString() || "",
        preco: data.preco?.toString() || "",
        codigo_tuss: data.codigo_tuss || "",
        descricao: data.descricao || "",
        tempo_preparo_minutos: data.tempo_preparo_minutos?.toString() || "",
        instrucoes: data.instrucoes || "",
        requisitos: data.requisitos || "",
        confirmacao_24h: data.confirmacao_24h || false,
        ativo: data.ativo !== false
      });
    } catch (error) {
      console.error('Erro ao buscar procedimento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do procedimento.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.duracao_minutos) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e duração são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('procedimentos')
        .update({
          nome: formData.nome.trim(),
          duracao_minutos: parseInt(formData.duracao_minutos),
          preco: formData.preco ? parseFloat(formData.preco) : null,
          codigo_tuss: formData.codigo_tuss.trim() || null,
          descricao: formData.descricao.trim() || null,
          tempo_preparo_minutos: formData.tempo_preparo_minutos ? parseInt(formData.tempo_preparo_minutos) : null,
          instrucoes: formData.instrucoes.trim() || null,
          requisitos: formData.requisitos.trim() || null,
          confirmacao_24h: formData.confirmacao_24h,
          ativo: formData.ativo,
          updated_at: new Date().toISOString()
        })
        .eq('id', procedimentoId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Procedimento atualizado com sucesso."
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar procedimento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o procedimento.",
        variant: "destructive"
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
          <DialogDescription>Altere as informações do procedimento</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="codigo_tuss">Código TUSS</Label>
              <Input
                id="codigo_tuss"
                value={formData.codigo_tuss}
                onChange={(e) => setFormData(prev => ({ ...prev, codigo_tuss: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracao">Duração (minutos) *</Label>
              <Input
                id="duracao"
                type="number"
                min="1"
                value={formData.duracao_minutos}
                onChange={(e) => setFormData(prev => ({ ...prev, duracao_minutos: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preparo">Tempo de Preparo (minutos)</Label>
              <Input
                id="preparo"
                type="number"
                min="0"
                value={formData.tempo_preparo_minutos}
                onChange={(e) => setFormData(prev => ({ ...prev, tempo_preparo_minutos: e.target.value }))}
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
                onChange={(e) => setFormData(prev => ({ ...prev, preco: e.target.value }))}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="instrucoes">Instruções</Label>
              <Textarea
                id="instrucoes"
                value={formData.instrucoes}
                onChange={(e) => setFormData(prev => ({ ...prev, instrucoes: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="requisitos">Requisitos</Label>
              <Textarea
                id="requisitos"
                value={formData.requisitos}
                onChange={(e) => setFormData(prev => ({ ...prev, requisitos: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between col-span-2">
              <Label htmlFor="confirmacao">Confirmar 24h antes</Label>
              <Switch
                id="confirmacao"
                checked={formData.confirmacao_24h}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, confirmacao_24h: checked }))}
              />
            </div>

            <div className="flex items-center justify-between col-span-2">
              <Label htmlFor="ativo">Ativo</Label>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
