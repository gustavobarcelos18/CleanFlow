import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NewPacoteDialogProps {
  children?: React.ReactNode;
  onSuccess?: () => void;
}

export function NewPacoteDialog({ children, onSuccess }: NewPacoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [servicos, setServicos] = useState<any[]>([]);
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
    oferta_renovacao_ativa: true
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open && profile?.tenant_id) {
      fetchServicos();
    }
  }, [open, profile?.tenant_id]);

  const fetchServicos = async () => {
    try {
      const { data, error } = await supabase
        .from('servicos')
        .select('id, nome')
        .eq('tenant_id', profile.tenant_id)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setServicos(data || []);
    } catch (error) {
      console.error('Erro ao buscar procedimentos:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.numero_sessoes || !formData.preco) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Validações adicionais
    const numSessoes = parseInt(formData.numero_sessoes);
    const preco = parseFloat(formData.preco);
    const validadeDias = parseInt(formData.validade_dias);
    const descontoRenovacao = parseFloat(formData.desconto_renovacao);

    if (numSessoes <= 0) {
      toast({
        title: "Número de sessões inválido",
        description: "O número de sessões deve ser maior que zero.",
        variant: "destructive"
      });
      return;
    }

    if (preco <= 0) {
      toast({
        title: "Preço inválido",
        description: "O preço deve ser maior que zero.",
        variant: "destructive"
      });
      return;
    }

    if (validadeDias <= 0) {
      toast({
        title: "Validade inválida",
        description: "A validade deve ser maior que zero dias.",
        variant: "destructive"
      });
      return;
    }

    if (descontoRenovacao < 0 || descontoRenovacao > 100) {
      toast({
        title: "Desconto inválido",
        description: "O desconto deve estar entre 0% e 100%.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

      const { error } = await supabase
        .from('pacotes')
        .insert([{
          tenant_id: profile.tenant_id,
          nome: formData.nome.trim(),
          descricao: formData.descricao?.trim() || null,
          servico_id: formData.servico_id || null,
          numero_sessoes: numSessoes,
          preco: preco,
          validade_dias: validadeDias,
          renovacao_automatica: formData.renovacao_automatica,
          desconto_renovacao: descontoRenovacao,
          limiar_renovacao: parseInt(formData.limiar_renovacao),
          oferta_renovacao_ativa: formData.oferta_renovacao_ativa,
          ativo: true
        }]);

      if (error) {
        if (error.code === '23505') {
          throw new Error("Já existe um pacote com este nome");
        }
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Pacote criado com sucesso."
      });

      setOpen(false);
      setFormData({
        nome: "",
        descricao: "",
        servico_id: "",
        numero_sessoes: "",
        preco: "",
        validade_dias: "90",
        renovacao_automatica: false,
        desconto_renovacao: "0",
        limiar_renovacao: "2",
        oferta_renovacao_ativa: true
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Erro ao criar pacote:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o pacote.",
        variant: "destructive"
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
            <Plus className="h-4 w-4 mr-2" />
            Novo Pacote
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Novo Pacote de Tratamento</DialogTitle>
          <DialogDescription>
            Crie um pacote de sessões para oferecer aos seus clientes
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Pacote *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Pacote 10 Sessões Depilação a Laser"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva os benefícios e detalhes do pacote..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="servico">Procedimento Relacionado (Opcional)</Label>
            <Select
              value={formData.servico_id}
              onValueChange={(value) => setFormData({ ...formData, servico_id: value === "none" ? "" : value })}
            >
              <SelectTrigger id="servico">
                <SelectValue placeholder="Selecione um procedimento" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="none">Nenhum procedimento específico</SelectItem>
                {servicos.map((servico) => (
                  <SelectItem key={servico.id} value={servico.id}>
                    {servico.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_sessoes">Número de Sessões *</Label>
              <Input
                id="numero_sessoes"
                type="number"
                min="1"
                value={formData.numero_sessoes}
                onChange={(e) => setFormData({ ...formData, numero_sessoes: e.target.value })}
                placeholder="Ex: 10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco">Preço do Pacote (R$) *</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                placeholder="Ex: 1500.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="validade_dias">Validade (dias)</Label>
            <Input
              id="validade_dias"
              type="number"
              min="1"
              value={formData.validade_dias}
              onChange={(e) => setFormData({ ...formData, validade_dias: e.target.value })}
              placeholder="Ex: 90"
            />
            <p className="text-xs text-muted-foreground">
              Prazo para usar todas as sessões do pacote
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="renovacao_automatica">Renovação Automática</Label>
                <p className="text-xs text-muted-foreground">
                  Renovar automaticamente quando expirar
                </p>
              </div>
              <Switch
                id="renovacao_automatica"
                checked={formData.renovacao_automatica}
                onCheckedChange={(checked) => setFormData({ ...formData, renovacao_automatica: checked })}
              />
            </div>

            {formData.renovacao_automatica && (
              <div className="space-y-2">
                <Label htmlFor="desconto_renovacao">Desconto na Renovação (%)</Label>
                <Input
                  id="desconto_renovacao"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.desconto_renovacao}
                  onChange={(e) => setFormData({ ...formData, desconto_renovacao: e.target.value })}
                  placeholder="Ex: 10"
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="oferta_renovacao_ativa">Oferecer Renovação Automática</Label>
                <p className="text-xs text-muted-foreground">
                  Notificar paciente quando próximo ao término
                </p>
              </div>
              <Switch
                id="oferta_renovacao_ativa"
                checked={formData.oferta_renovacao_ativa}
                onCheckedChange={(checked) => setFormData({ ...formData, oferta_renovacao_ativa: checked })}
              />
            </div>

            {formData.oferta_renovacao_ativa && (
              <div className="space-y-2">
                <Label htmlFor="limiar_renovacao">
                  Sessões Restantes para Oferta de Renovação
                </Label>
                <Input
                  id="limiar_renovacao"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.limiar_renovacao}
                  onChange={(e) => setFormData({ ...formData, limiar_renovacao: e.target.value })}
                  placeholder="2"
                />
                <p className="text-xs text-muted-foreground">
                  Quando restarem este número de sessões, o sistema oferecerá renovação
                </p>
              </div>
            )}
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
              Criar Pacote
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}