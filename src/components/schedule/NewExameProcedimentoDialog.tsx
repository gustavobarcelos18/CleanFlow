import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus } from "lucide-react";

interface NewExameProcedimentoDialogProps {
  onSuccess?: (id: string) => void;
}

type TipoExameProcedimento = "exame_laboratorial" | "exame_imagem" | "procedimento_cirurgico" | "procedimento_terapeutico" | "procedimento_diagnostico";

export function NewExameProcedimentoDialog({ onSuccess }: NewExameProcedimentoDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<{
    nome: string;
    tipo: TipoExameProcedimento;
    codigo_tuss: string;
    descricao: string;
    tempo_preparo_minutos: string;
    tempo_jejum_horas: string;
    duracao_minutos: string;
    valor: string;
    instrucoes: string;
    requisitos: string;
  }>({
    nome: "",
    tipo: "exame_laboratorial",
    codigo_tuss: "",
    descricao: "",
    tempo_preparo_minutos: "",
    tempo_jejum_horas: "",
    duracao_minutos: "",
    valor: "",
    instrucoes: "",
    requisitos: ""
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.tipo) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e tipo são obrigatórios.",
        variant: "destructive"
      });
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
        .from('exames_procedimentos')
        .insert([{
          nome: formData.nome.trim(),
          tipo: formData.tipo,
          codigo_tuss: formData.codigo_tuss.trim() || null,
          descricao: formData.descricao.trim() || null,
          tempo_preparo_minutos: formData.tempo_preparo_minutos ? parseInt(formData.tempo_preparo_minutos) : null,
          tempo_jejum_horas: formData.tempo_jejum_horas ? parseInt(formData.tempo_jejum_horas) : null,
          duracao_minutos: formData.duracao_minutos ? parseInt(formData.duracao_minutos) : null,
          valor: formData.valor ? parseFloat(formData.valor) : null,
          instrucoes: formData.instrucoes.trim() || null,
          requisitos: formData.requisitos.trim() || null,
          tenant_id: profile.tenant_id,
          ativo: true
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error("Já existe um exame/procedimento com este nome");
        }
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Item cadastrado com sucesso."
      });

      setOpen(false);
      setFormData({
        nome: "", tipo: "exame_laboratorial", codigo_tuss: "", descricao: "",
        tempo_preparo_minutos: "", tempo_jejum_horas: "", duracao_minutos: "",
        valor: "", instrucoes: "", requisitos: ""
      });

      if (onSuccess && data) {
        onSuccess(data.id);
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      const description = (error as any)?.message || "Não foi possível cadastrar o item.";
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
          Novo Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Cadastrar Exame ou Procedimento</DialogTitle>
          <DialogDescription>
            Cadastre um exame laboratorial, de imagem ou procedimento médico
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Hemograma completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value as TipoExameProcedimento })}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="exame_laboratorial">Exame Laboratorial</SelectItem>
                  <SelectItem value="exame_imagem">Exame de Imagem</SelectItem>
                  <SelectItem value="procedimento_cirurgico">Procedimento Cirúrgico</SelectItem>
                  <SelectItem value="procedimento_terapeutico">Procedimento Terapêutico</SelectItem>
                  <SelectItem value="procedimento_diagnostico">Procedimento Diagnóstico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codigo_tuss">Código TUSS</Label>
              <Input
                id="codigo_tuss"
                value={formData.codigo_tuss}
                onChange={(e) => setFormData({ ...formData, codigo_tuss: e.target.value })}
                placeholder="Código da tabela TUSS"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duracao">Duração (min)</Label>
              <Input
                id="duracao"
                type="number"
                value={formData.duracao_minutos}
                onChange={(e) => setFormData({ ...formData, duracao_minutos: e.target.value })}
                placeholder="30"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preparo">Preparo (min)</Label>
              <Input
                id="preparo"
                type="number"
                value={formData.tempo_preparo_minutos}
                onChange={(e) => setFormData({ ...formData, tempo_preparo_minutos: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jejum">Jejum (horas)</Label>
              <Input
                id="jejum"
                type="number"
                value={formData.tempo_jejum_horas}
                onChange={(e) => setFormData({ ...formData, tempo_jejum_horas: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Breve descrição..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instrucoes">Instruções para o Paciente</Label>
            <Textarea
              id="instrucoes"
              value={formData.instrucoes}
              onChange={(e) => setFormData({ ...formData, instrucoes: e.target.value })}
              placeholder="Ex: Comparecer em jejum de 8 horas..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="requisitos">Requisitos/Pré-requisitos</Label>
            <Textarea
              id="requisitos"
              value={formData.requisitos}
              onChange={(e) => setFormData({ ...formData, requisitos: e.target.value })}
              placeholder="Ex: Exames anteriores necessários..."
              rows={2}
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
