import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Plus, 
  Info, 
  Clock, 
  DollarSign, 
  ClipboardList, 
  Settings2,
  AlertCircle,
  Stethoscope,
  Activity
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrencyBRL, parseCurrencyToNumber } from "@/lib/currency";

interface NewProcedimentoDialogProps {
  children?: React.ReactNode;
  inline?: boolean;
  onSuccess?: (id?: string) => void;
}

export function NewProcedimentoDialog({
  children,
  inline = false,
  onSuccess,
}: NewProcedimentoDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    duracao_minutos: "",
    valor: "",
    codigo_tuss: "",
    descricao: "",
    instrucoes_preparo: "",
    instrucoes_pos: "",
    anestesia_necessaria: false,
    tipo_anestesia: "",
    ativo: true,
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

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

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

      const { data, error } = await supabase
        .from("servicos")
        .insert([
          {
            tenant_id: profile.tenant_id,
            nome: formData.nome.trim().toUpperCase(),
            duracao_minutos: parseInt(formData.duracao_minutos),
            preco: formData.valor
              ? parseCurrencyToNumber(formData.valor)
              : null,
            codigo_tuss: formData.codigo_tuss.trim() || null,
            descricao: formData.descricao.trim() || null,
            instrucoes_preparo: formData.instrucoes_preparo.trim() || null,
            instrucoes_pos: formData.instrucoes_pos.trim() || null,
            anestesia_necessaria: formData.anestesia_necessaria,
            tipo_anestesia: formData.tipo_anestesia.trim() || null,
            ativo: formData.ativo,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Procedimento criado com sucesso.",
      });

      setFormData({
        nome: "",
        duracao_minutos: "",
        valor: "",
        codigo_tuss: "",
        descricao: "",
        instrucoes_preparo: "",
        instrucoes_pos: "",
        anestesia_necessaria: false,
        tipo_anestesia: "",
        ativo: true,
      });

      setOpen(false);
      if (onSuccess) onSuccess(data?.id);
    } catch (error: any) {
      console.error("Erro ao criar procedimento:", error);

      let errorMessage = "Não foi possível criar o procedimento.";
      if (error.code === "23505") {
        errorMessage = "Já existe um procedimento cadastrado com este nome.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const trigger = inline ? (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-auto p-0 text-xs text-primary font-medium hover:bg-transparent hover:text-primary/80 gap-1"
    >
      <Plus className="h-3 w-3" />
      Novo Procedimento
    </Button>
  ) : (
    <Button className="rounded-xl shadow-lg shadow-primary/10 transition-all hover:scale-[1.02]">
      <Plus className="mr-2 h-4 w-4" />
      Novo Procedimento
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children || trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto rounded-xl border-muted/60 bg-background/95 backdrop-blur-md shadow-2xl">
        <DialogHeader className="pb-4 border-b border-muted/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-primary/10">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight">Novo Procedimento</DialogTitle>
          </div>
          <DialogDescription className="text-base text-muted-foreground">
            Configure os detalhes clínicos e operacionais do procedimento.
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
                  <Label htmlFor="nome" className="text-sm font-semibold">Nome do Procedimento <span className="text-destructive">*</span></Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value.toUpperCase() }))}
                    placeholder="EX: DEPILAÇÃO A LASER - AXILAS"
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
                    placeholder="Ex: 31101012"
                    className="rounded-xl bg-background/50 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duracao" className="text-sm font-semibold">Duração Estimada <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="duracao"
                      type="text"
                      inputMode="numeric"
                      value={formData.duracao_minutos}
                      onChange={(e) => setFormData(prev => ({ ...prev, duracao_minutos: e.target.value.replace(/\D/g, "") }))}
                      placeholder="30"
                      className="rounded-xl bg-background/50 h-11 pr-12"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground select-none">MIN</span>
                  </div>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="descricao" className="text-sm font-semibold">Resumo do Procedimento</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Breve descrição dos objetivos e técnica..."
                    className="rounded-xl bg-background/50 min-h-[80px]"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Seção: Logística e Cuidados */}
            <div className="p-6 rounded-xl bg-muted/30 border border-muted/50 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Logística e Cuidados</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="instrucoes_preparo" className="text-sm font-semibold">Orientações de Pré-Preparo</Label>
                  <Textarea
                    id="instrucoes_preparo"
                    value={formData.instrucoes_preparo}
                    onChange={(e) => setFormData(prev => ({ ...prev, instrucoes_preparo: e.target.value }))}
                    placeholder="Instruções fundamentais antes de iniciar o procedimento..."
                    className="rounded-xl bg-background/50"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="instrucoes_pos" className="text-sm font-semibold">Cuidados Pós-Procedimento</Label>
                  <Textarea
                    id="instrucoes_pos"
                    value={formData.instrucoes_pos}
                    onChange={(e) => setFormData(prev => ({ ...prev, instrucoes_pos: e.target.value }))}
                    placeholder="Orientações de recuperação e cuidados domiciliares..."
                    className="rounded-xl bg-background/50"
                  />
                </div>

                <div className="col-span-2 p-4 rounded-xl border border-sky-500/20 bg-sky-500/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="anestesia_necessaria" className="text-sm font-bold text-sky-700 dark:text-sky-400">Suporte de Anestesia</Label>
                      <p className="text-[10px] text-muted-foreground">O procedimento requer algum nível de sedação/anestesia?</p>
                    </div>
                    <Switch
                      id="anestesia_necessaria"
                      checked={formData.anestesia_necessaria}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, anestesia_necessaria: checked }))}
                    />
                  </div>

                  {formData.anestesia_necessaria && (
                    <div className="space-y-2 pt-2 border-t border-sky-500/10">
                      <Label htmlFor="tipo_anestesia" className="text-sm font-semibold">Modalidade de Anestesia</Label>
                      <Input
                        id="tipo_anestesia"
                        value={formData.tipo_anestesia}
                        onChange={(e) => setFormData(prev => ({ ...prev, tipo_anestesia: e.target.value }))}
                        placeholder="Ex: Local, Sedação Consciente, Geral..."
                        className="rounded-xl bg-background/50 h-11 border-sky-500/20"
                      />
                    </div>
                  )}
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
                  <Label htmlFor="valor" className="text-sm font-semibold text-emerald-500/80">Valor Particular Base</Label>
                  <div className="relative">
                    <Input
                      id="valor"
                      value={formData.valor}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor: formatCurrencyBRL(e.target.value) }))}
                      placeholder="R$ 0,00"
                      className="rounded-xl bg-background/50 h-11 border-emerald-500/20 focus-visible:ring-emerald-500/30 font-bold"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-muted/50 flex items-center justify-between bg-muted/20">
                  <div className="space-y-0.5">
                    <Label htmlFor="ativo" className="text-sm font-bold">Status do Registro</Label>
                    <p className="text-[10px] text-muted-foreground">Disponível para venda e agenda</p>
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

          <div className="flex gap-4 pt-4 border-t border-muted/50">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={() => setOpen(false)} 
              className="flex-1 h-12 rounded-xl text-muted-foreground hover:bg-muted font-semibold transition-all"
            >
              Descartar
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-[2] h-12 rounded-xl shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 font-bold text-base transition-all active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Plus className="mr-2 h-5 w-5" />
              )}
              Confirmar Cadastro
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
