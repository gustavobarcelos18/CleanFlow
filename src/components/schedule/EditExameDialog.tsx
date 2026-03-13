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
import { 
  Loader2, 
  Settings2, 
  Clock, 
  DollarSign, 
  ClipboardList, 
  AlertCircle,
  Pencil
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrencyBRL, parseCurrencyToNumber } from "@/lib/currency";

interface EditExameDialogProps {
  exameId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function EditExameDialog({
  exameId,
  open,
  onOpenChange,
  onSuccess,
  children,
}: EditExameDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    codigo_tuss: "",
    descricao: "",
    tempo_preparo_minutos: "",
    tempo_jejum_horas: "",
    duracao_minutos: "",
    preco: "",
    instrucoes: "",
    requisitos: "",
    ativo: true,
  });

  const { toast } = useToast();

  const fetchExame = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("exames")
        .select("*")
        .eq("id", exameId)
        .single();

      if (error) throw error;

      setFormData({
        nome: data.nome || "",
        codigo_tuss: data.codigo_tuss || "",
        descricao: data.descricao || "",
        tempo_preparo_minutos: data.tempo_preparo_minutos?.toString() || "",
        tempo_jejum_horas: data.tempo_jejum_horas?.toString() || "",
        duracao_minutos: data.duracao_minutos?.toString() || "",
        preco: data.preco ? formatCurrencyBRL(data.preco) : "",
        instrucoes: data.instrucoes || "",
        requisitos: data.requisitos || "",
        ativo: data.ativo !== false,
      });
    } catch (error) {
      console.error("Erro ao buscar exame:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do exame.",
        variant: "destructive",
      });
    }
  }, [exameId, toast]);

  useEffect(() => {
    if (open && exameId) {
      fetchExame();
    }
  }, [open, exameId, fetchExame]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome) {
      toast({
        title: "Campo obrigatório",
        description: "Nome é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const { error } = await supabase
        .from("exames")
        .update({
          nome: formData.nome.trim().toUpperCase(),
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
          preco: formData.preco ? parseCurrencyToNumber(formData.preco) : null,
          instrucoes: formData.instrucoes.trim() || null,
          requisitos: formData.requisitos.trim() || null,
          ativo: formData.ativo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", exameId);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Exame atualizado com sucesso.",
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Erro ao atualizar exame:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o exame.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto rounded-2xl border-white/10 bg-card/95 backdrop-blur-md shadow-2xl">
        <DialogHeader className="pb-4 border-b border-border/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Pencil className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">Editar Exame</DialogTitle>
          </div>
          <DialogDescription className="text-base text-muted-foreground">
            Atualize as configurações técnicas e financeiras deste exame.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 pt-6">
          <TooltipProvider>
            {/* Seção: Informações Básicas */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Informações Gerais</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="nome" className="text-sm font-semibold">Nome do Exame <span className="text-destructive">*</span></Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))}
                    placeholder="EX: RESSONÂNCIA MAGNÉTICA DE CRÂNIO"
                    className="rounded-xl bg-background/50 h-11 uppercase"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="codigo_tuss" className="text-sm font-semibold">Código TUSS</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>Referência da Terminologia Unificada em Saúde Suplementar</TooltipContent>
                    </Tooltip>
                  </div>
                  <Input
                    id="codigo_tuss"
                    value={formData.codigo_tuss}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigo_tuss: e.target.value }))}
                    placeholder="Ex: 40301010"
                    className="rounded-xl bg-background/50 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duracao" className="text-sm font-semibold">Duração Média</Label>
                  <div className="relative">
                    <Input
                      id="duracao"
                      type="text"
                      inputMode="numeric"
                      value={formData.duracao_minutos}
                      onChange={(e) => setFormData(prev => ({ ...prev, duracao_minutos: e.target.value.replace(/\D/g, "") }))}
                      placeholder="30"
                      className="rounded-xl bg-background/50 h-11 pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground select-none">MIN</span>
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="descricao" className="text-sm font-semibold">Resumo Informativo</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Breve descrição clínica do exame..."
                    className="rounded-xl bg-background/50 min-h-[80px]"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Seção: Logística e Preparo */}
            <div className="p-6 rounded-2xl bg-muted/30 border border-border/50 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Logística e Preparo</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="preparo" className="text-sm font-semibold text-amber-500/80">Tempo de Preparo</Label>
                  <div className="relative">
                    <Input
                      id="preparo"
                      type="text"
                      inputMode="numeric"
                      value={formData.tempo_preparo_minutos}
                      onChange={(e) => setFormData(prev => ({ ...prev, tempo_preparo_minutos: e.target.value.replace(/\D/g, "") }))}
                      placeholder="0"
                      className="rounded-xl bg-background/50 h-11 border-amber-500/20 focus-visible:ring-amber-500/30 pr-12"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground select-none">MIN</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jejum" className="text-sm font-semibold text-sky-500/80">Jejum Necessário</Label>
                  <div className="relative">
                    <Input
                      id="jejum"
                      type="text"
                      inputMode="numeric"
                      value={formData.tempo_jejum_horas}
                      onChange={(e) => setFormData(prev => ({ ...prev, tempo_jejum_horas: e.target.value.replace(/\D/g, "") }))}
                      placeholder="0"
                      className="rounded-xl bg-background/50 h-11 border-sky-500/20 focus-visible:ring-sky-500/30 pr-16"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground select-none">HORAS</span>
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="instrucoes" className="text-sm font-semibold">Instruções Pré-Exame</Label>
                  <Textarea
                    id="instrucoes"
                    value={formData.instrucoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, instrucoes: e.target.value }))}
                    placeholder="Orientações específicas que o paciente deve seguir..."
                    className="rounded-xl bg-background/50"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="requisitos" className="text-sm font-semibold">Requisitos de Segurança</Label>
                  <Textarea
                    id="requisitos"
                    value={formData.requisitos}
                    onChange={(e) => setFormData(prev => ({ ...prev, requisitos: e.target.value }))}
                    placeholder="Ex: Não utilizar marcapasso, sem adornos metálicos..."
                    className="rounded-xl bg-background/50 border-orange-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Seção: Gestão Financeira */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Gestão Financeira</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6 items-end">
                <div className="space-y-2">
                  <Label htmlFor="preco" className="text-sm font-semibold text-emerald-500/80">Preço Particular Base</Label>
                  <div className="relative">
                    <Input
                      id="preco"
                      value={formData.preco}
                      onChange={(e) => setFormData(prev => ({ ...prev, preco: formatCurrencyBRL(e.target.value) }))}
                      placeholder="R$ 0,00"
                      className="rounded-xl bg-background/50 h-11 border-emerald-500/20 focus-visible:ring-emerald-500/30 font-bold"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border/50 flex items-center justify-between bg-muted/20">
                  <div className="space-y-0.5">
                    <Label htmlFor="ativo" className="text-sm font-bold">Status do Exame</Label>
                    <p className="text-[10px] text-muted-foreground">Disponível para agendamento</p>
                  </div>
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                  />
                </div>
              </div>
            </div>
          </TooltipProvider>

          <div className="flex gap-4 pt-4 border-t border-border/50">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => onOpenChange(false)} 
              className="flex-1 h-12 rounded-xl text-muted-foreground hover:bg-muted font-semibold transition-all"
            >
              Descartar Alterações
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-[2] h-12 rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 font-bold text-base transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Pencil className="mr-2 h-5 w-5" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
