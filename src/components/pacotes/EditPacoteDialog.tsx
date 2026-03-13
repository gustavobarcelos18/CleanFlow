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
import { Loader2, Edit, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrencyBRL, parseCurrencyToNumber } from "@/lib/currency";

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
    servico_id: "none",
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
        servico_id: data.servico_id || "none",
        numero_sessoes: data.numero_sessoes?.toString() || "",
        preco: data.preco ? formatCurrencyBRL(data.preco.toString()) : "",
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
        description: "Por favor, preencha todos os campos com asterisco (*).",
        variant: "destructive",
      });
      return;
    }

    const numSessoes = parseInt(formData.numero_sessoes);
    const preco = parseCurrencyToNumber(formData.preco);
    const validadeDias = parseInt(formData.validade_dias);
    const descontoRenovacao = parseFloat(formData.desconto_renovacao || "0");

    if (isNaN(numSessoes) || numSessoes <= 0) {
      toast({
        title: "Sessões inválidas",
        description: "O número de sessões deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(preco) || preco <= 0) {
      toast({
        title: "Preço inválido",
        description: "O preço deve ser superior a zero.",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(validadeDias) || validadeDias <= 0) {
      toast({
        title: "Validade inválida",
        description: "A validade deve ser maior que zero dias.",
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
          servico_id: formData.servico_id === "none" ? null : formData.servico_id,
          numero_sessoes: numSessoes,
          preco: preco,
          validade_dias: validadeDias,
          renovacao_automatica: formData.renovacao_automatica,
          desconto_renovacao: descontoRenovacao,
          limiar_renovacao: parseInt(formData.limiar_renovacao || "2"),
          oferta_renovacao_ativa: formData.oferta_renovacao_ativa,
          ativo: formData.ativo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pacoteId);

      if (error) {
        if (error.code === "23505") {
          throw new Error("Já existe outro pacote com este nome no seu catálogo.");
        }
        throw error;
      }

      toast({
        title: "Pacote atualizado",
        description: "As informações foram salvas com sucesso.",
      });

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Erro ao atualizar:", error);
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Não foi possível salvar as alterações no pacote.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0 border-0 rounded-2xl">
        <div className="bg-gradient-to-b from-primary/10 to-background px-6 pt-6 pb-4 border-b">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Editar Pacote
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Atualize as informações do pacote de tratamento.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Sessão 1: Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="w-6 border-t border-muted-foreground/30"></span> Informações Iniciais
            </h3>
            
            <div className="space-y-4 rounded-xl bg-muted/5 p-4 border border-muted/20">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-semibold">Nome do Pacote *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Combo 10 Sessões"
                  className="font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao" className="text-sm font-semibold">Resumo / Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do pacote..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="servico" className="text-sm font-semibold">Procedimento Relacionado (Opcional)</Label>
                <Select
                  value={formData.servico_id}
                  onValueChange={(value) => setFormData({ ...formData, servico_id: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Se não selecionar, servirá para qualquer procedimento" />
                  </SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="none" className="font-medium text-muted-foreground">Genérico (Qualquer procedimento)</SelectItem>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Sessão 2: Regras de Negócio e Valores */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <span className="w-6 border-t border-muted-foreground/30"></span> Valores e Regras
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero_sessoes" className="text-sm font-semibold">Nº Sessões *</Label>
                <Input
                  id="numero_sessoes"
                  type="number"
                  min="1"
                  value={formData.numero_sessoes}
                  onChange={(e) => setFormData({ ...formData, numero_sessoes: e.target.value })}
                  placeholder="10"
                  className="font-black text-lg text-center"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preco" className="text-sm font-semibold">Total do Pacote (R$) *</Label>
                <Input
                  id="preco"
                  type="text"
                  value={formData.preco}
                  onChange={(e) => setFormData({ ...formData, preco: formatCurrencyBRL(e.target.value) })}
                  placeholder="R$ 0,00"
                  className="font-black text-lg text-primary text-center"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="validade" className="text-sm font-semibold">Expira em (dias)</Label>
                <Input
                  id="validade"
                  type="number"
                  min="1"
                  value={formData.validade_dias}
                  onChange={(e) => setFormData({ ...formData, validade_dias: e.target.value })}
                  placeholder="90"
                  className="font-bold text-center"
                />
              </div>
            </div>
          </div>

          {/* Sessão 3: Configurações Avançadas de Renovação */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
               <span className="w-6 border-t border-muted-foreground/30"></span> Retenção e Renovação
            </h3>

            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-5 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="renovacao" className="font-bold text-indigo-900 dark:text-indigo-300">
                    Renovação Automática
                  </Label>
                  <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70 leading-relaxed max-w-sm">
                    Gera automaticamente cobrança e estende as sessões quando o pacote atual acaba.
                  </p>
                </div>
                <Switch
                  id="renovacao"
                  checked={formData.renovacao_automatica}
                  onCheckedChange={(checked) => setFormData({ ...formData, renovacao_automatica: checked })}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>

              {formData.renovacao_automatica && (
                <div className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-800 animate-in slide-in-from-top-2">
                  <div className="space-y-2 max-w-[200px]">
                    <Label htmlFor="desconto" className="text-xs font-semibold text-indigo-800 dark:text-indigo-400">
                      Incentivo / Desconto (%)
                    </Label>
                    <div className="relative">
                      <Input
                        id="desconto"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={formData.desconto_renovacao}
                        onChange={(e) => setFormData({ ...formData, desconto_renovacao: e.target.value })}
                        className="bg-white dark:bg-background border-indigo-200 dark:border-indigo-800 focus-visible:ring-indigo-500 pl-8 font-bold"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="h-px bg-indigo-100 dark:bg-indigo-900/50 w-full" />

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="oferta" className="font-bold text-indigo-900 dark:text-indigo-300">
                    Lembrete de Oferta
                  </Label>
                  <p className="text-xs text-indigo-700/70 dark:text-indigo-400/70 leading-relaxed max-w-sm">
                    Avisa o time para oferecer a renovação quando o pacote estiver quase no fim.
                  </p>
                </div>
                <Switch
                  id="oferta"
                  checked={formData.oferta_renovacao_ativa}
                  onCheckedChange={(checked) => setFormData({ ...formData, oferta_renovacao_ativa: checked })}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>

              {formData.oferta_renovacao_ativa && (
                <div className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-800 animate-in slide-in-from-top-2">
                  <div className="space-y-2 max-w-[200px]">
                    <Label htmlFor="limiar" className="text-xs font-semibold text-indigo-800 dark:text-indigo-400 flex items-center gap-1.5">
                       <AlertCircle className="h-3 w-3" /> Avisar faltando quantas sessões?
                    </Label>
                    <Input
                      id="limiar"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.limiar_renovacao}
                      onChange={(e) => setFormData({ ...formData, limiar_renovacao: e.target.value })}
                      className="bg-white dark:bg-background border-indigo-200 dark:border-indigo-800 focus-visible:ring-indigo-500 font-bold"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted/20 border border-muted rounded-xl">
             <div className="space-y-1">
               <Label htmlFor="ativo" className="font-bold">Listar no Catálogo?</Label>
               <p className="text-xs text-muted-foreground">Pacotes não listados se tornam "Arquivados" e não podem ser vendidos.</p>
             </div>
             <Switch
               id="ativo"
               checked={formData.ativo}
               onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
             />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-muted/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-full px-8 font-bold">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
