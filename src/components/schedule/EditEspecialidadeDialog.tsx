import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface EditEspecialidadeDialogProps {
  especialidadeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditEspecialidadeDialog({ 
  especialidadeId, 
  open, 
  onOpenChange, 
  onSuccess 
}: EditEspecialidadeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    codigo_cfm: "",
    descricao: ""
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open && especialidadeId) {
      fetchEspecialidade();
    }
  }, [open, especialidadeId]);

  const fetchEspecialidade = async () => {
    try {
      const { data, error } = await supabase
        .from('especialidades')
        .select('*')
        .eq('id', especialidadeId)
        .single();

      if (error) throw error;

      setFormData({
        nome: data.nome || "",
        codigo_cfm: data.codigo_cfm || "",
        descricao: data.descricao || ""
      });
    } catch (error) {
      console.error('Erro ao buscar especialidade:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados da especialidade.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome) {
      toast({
        title: "Campo obrigatório",
        description: "Nome da especialidade é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from('especialidades')
        .update({
          nome: formData.nome.trim(),
          codigo_cfm: formData.codigo_cfm.trim() || null,
          descricao: formData.descricao.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', especialidadeId);

      if (error) {
        if (error.code === '23505') {
          throw new Error("Já existe uma especialidade com este nome");
        }
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Especialidade atualizada com sucesso."
      });

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      const description = (error as any)?.message || "Não foi possível atualizar a especialidade.";
      toast({
        title: "Erro",
        description,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Editar Especialidade</DialogTitle>
          <DialogDescription>
            Atualize as informações da especialidade médica
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Especialidade *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Cardiologia, Pediatria, Ortopedia"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="codigo_cfm">Código CFM</Label>
            <Input
              id="codigo_cfm"
              value={formData.codigo_cfm}
              onChange={(e) => setFormData({ ...formData, codigo_cfm: e.target.value })}
              placeholder="Código de referência do CFM"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição sobre a especialidade..."
              rows={3}
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
