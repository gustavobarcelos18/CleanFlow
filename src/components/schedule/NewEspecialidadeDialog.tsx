import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus } from "lucide-react";

interface NewEspecialidadeDialogProps {
  onSuccess?: (id: string) => void;
}

export function NewEspecialidadeDialog({ onSuccess }: NewEspecialidadeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    codigo_cfm: "",
    descricao: ""
  });
  const [hasChanges, setHasChanges] = useState(false);
  const nomeRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    setHasChanges(!!(formData.nome || formData.codigo_cfm || formData.descricao));
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast({
        title: "Campo obrigatório não preenchido",
        description: "Por favor, preencha: Nome da especialidade",
        variant: "destructive"
      });
      nomeRef.current?.focus();
      return;
    }

    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile || !profile.tenant_id) {
        throw new Error("Perfil não configurado. Configure seu perfil em Configurações.");
      }

      const { data, error } = await supabase
        .from('especialidades')
        .insert([{
          nome: formData.nome.trim(),
          codigo_cfm: formData.codigo_cfm.trim() || null,
          descricao: formData.descricao.trim() || null,
          tenant_id: profile.tenant_id,
          ativo: true
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error("Já existe uma especialidade com este nome");
        }
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Especialidade cadastrada com sucesso."
      });

      setOpen(false);
      setFormData({ nome: "", codigo_cfm: "", descricao: "" });

      if (onSuccess && data) {
        onSuccess(data.id);
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      const description = (error as any)?.message || "Não foi possível cadastrar a especialidade.";
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Especialidade
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Cadastrar Nova Especialidade</DialogTitle>
          <DialogDescription>
            Cadastre uma especialidade médica reconhecida pelo CFM
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Especialidade *</Label>
            <Input
              id="nome"
              ref={nomeRef}
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
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !hasChanges}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
