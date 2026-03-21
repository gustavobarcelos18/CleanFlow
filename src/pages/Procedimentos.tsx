import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Edit,
  Trash2,
  Clock,
  DollarSign,
  Settings,
  Loader2,
  CheckCircle2,
  Search,
  Filter,
  Plus,
  Eye,
  Activity,
  ShieldCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLayoutTitle } from "@/hooks/useLayoutTitle";
import { NewProcedimentoDialog } from "@/components/schedule/NewProcedimentoDialog";
import { EditProcedimentoDialog } from "@/components/schedule/EditProcedimentoDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrencyBRL } from "@/lib/currency";

interface Procedimento {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco: number | null;
  codigo_tuss?: string | null;
  descricao: string | null;
  instrucoes_preparo?: string | null;
  instrucoes_pos?: string | null;
  anestesia_necessaria?: boolean;
  tipo_anestesia?: string | null;
  ativo: boolean;
  created_at: string;
}

const Procedimentos = () => {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [procedimentoToDelete, setProcedimentoToDelete] =
    useState<Procedimento | null>(null);
  const { toast } = useToast();
  const { setTitle, setSubtitle } = useLayoutTitle();

  const fetchProcedimentos = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .order("nome");

      if (error) throw error;
      setProcedimentos(data || []);
    } catch (error) {
      console.error("Erro ao buscar procedimentos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os procedimentos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProcedimentos();
  }, [fetchProcedimentos]);

  useEffect(() => {
    setTitle("Procedimentos");
    setSubtitle("Gestão clínica de procedimentos e intervenções");
  }, [setTitle, setSubtitle]);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("servicos")
        .update({ ativo: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setProcedimentos((prev) =>
        prev.map((proc) =>
          proc.id === id ? { ...proc, ativo: !currentStatus } : proc,
        ),
      );

      toast({
        title: "Status atualizado",
        description: `Procedimento ${!currentStatus ? "ativado" : "desativado"} com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive",
      });
    }
  };

  const deleteProcedimento = async (id: string) => {
    const procedimento = procedimentos.find((p) => p.id === id);
    if (procedimento) {
      setProcedimentoToDelete(procedimento);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!procedimentoToDelete) return;

    try {
      const { error } = await supabase
        .from("servicos")
        .delete()
        .eq("id", procedimentoToDelete.id);

      if (error) throw error;

      setProcedimentos((prev) =>
        prev.filter((proc) => proc.id !== procedimentoToDelete.id),
      );

      toast({
        title: "Procedimento excluído",
        description: "O procedimento foi removido com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir procedimento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o procedimento.",
        variant: "destructive",
      });
    } finally {
      setProcedimentoToDelete(null);
    }
  };

  const filteredProcedimentos = procedimentos.filter((proc) =>
    proc.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const activeProcedimentos = filteredProcedimentos.filter(
    (p) => p.ativo,
  ).length;

  return (
    <MainLayout>
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        {/* Slim Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/30 backdrop-blur-md border border-muted/50 p-4 rounded-xl shadow-sm">
          <div className="relative flex-1 w-full max-w-[560px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-muted/50 focus-visible:ring-primary/20 h-10 w-full"
            />
          </div>
          <NewProcedimentoDialog onSuccess={fetchProcedimentos}>
            <Button className="w-full sm:w-auto shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-6 rounded-lg group shrink-0">
              <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
              Novo Procedimento
            </Button>
          </NewProcedimentoDialog>
        </div>

        {/* Compact KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          <Card className="p-4 md:p-5 bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/10 shadow-sm relative overflow-hidden group">
            <div className="absolute right-[-5%] top-[-5%] opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <Activity size={80} />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-2.5 rounded-lg bg-primary/20 text-primary">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ativos</p>
                <p className="text-2xl font-black text-foreground">{activeProcedimentos}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 md:p-5 bg-gradient-to-br from-secondary/5 via-transparent to-transparent border-secondary/10 shadow-sm relative overflow-hidden group">
            <div className="absolute right-[-5%] top-[-5%] opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <CheckCircle2 size={80} />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-2.5 rounded-lg bg-secondary/20 text-secondary-foreground">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total</p>
                <p className="text-2xl font-black text-foreground">{procedimentos.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
          </div>
        ) : filteredProcedimentos.length === 0 ? (
          <Card className="p-20 bg-muted/10 border-dashed border-muted/50 border flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 rounded-xl">
            <div className="p-6 rounded-full bg-muted/10 mb-6">
              <Search className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {searchTerm ? "Nenhum procedimento encontrado" : "Pronto para começar?"}
            </h3>
            <p className="text-muted-foreground max-w-sm mb-8 text-lg">
              {searchTerm
                ? "Não encontramos resultados para sua busca. Tente outro termo."
                : "Cadastre seu primeiro procedimento para gerenciar os serviços da sua clínica."
              }
            </p>
            {!searchTerm && (
              <NewProcedimentoDialog onSuccess={fetchProcedimentos}>
                <Button className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-8 rounded-xl group">
                  <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                  Criar Primeiro Procedimento
                </Button>
              </NewProcedimentoDialog>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
            <TooltipProvider>
              {filteredProcedimentos.map((procedimento, index) => (
                <Card 
                  key={procedimento.id} 
                  className={`
                    relative group/card overflow-hidden bg-muted/30 backdrop-blur-sm border-muted/50 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-muted/50 rounded-xl p-5 md:p-6
                    animate-in slide-in-from-bottom-4 duration-500 fill-mode-both
                    ${filteredProcedimentos.length === 1 ? 'md:col-span-2 xl:col-span-3 max-w-2xl mx-auto w-full' : ''}
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold tracking-tight text-foreground group-hover/card:text-primary transition-colors truncate">
                          {procedimento.nome}
                        </h3>
                        <Badge 
                          variant={procedimento.ativo ? "default" : "secondary"}
                          className={`
                            px-2 py-0.5 rounded-full text-[9px] uppercase font-black tracking-widest
                            ${procedimento.ativo ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground"}
                          `}
                        >
                          {procedimento.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      
                      {procedimento.codigo_tuss && (
                        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground bg-muted/30 w-fit px-2 py-0.5 rounded-md">
                          <span className="text-primary font-bold">TUSS</span>
                          {procedimento.codigo_tuss}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2 h-8 px-2 border-r border-muted/50 mr-1">
                        <Switch
                          checked={procedimento.ativo}
                          onCheckedChange={() => toggleStatus(procedimento.id, procedimento.ativo)}
                        />
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingId(procedimento.id)}
                              className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteProcedimento(procedimento.id)}
                              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  {procedimento.descricao && (
                    <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-4 leading-relaxed italic bg-muted/5 p-2 rounded-lg border border-border/5">
                      "{procedimento.descricao}"
                    </p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 rounded-lg bg-background/40 border border-muted/30 backdrop-blur-sm shadow-inner">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Clock className="h-3 w-3 text-primary" />
                        Duração
                      </div>
                      <p className="text-xs font-bold truncate">{procedimento.duracao_minutos || "---"} min</p>
                    </div>
                    
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        <DollarSign className="h-3 w-3 text-emerald-500" />
                        Valor
                      </div>
                      <p className="text-xs font-bold text-emerald-500 truncate">
                        {procedimento.preco ? formatCurrencyBRL(procedimento.preco) : "---"}
                      </p>
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                        <ShieldCheck className="h-3 w-3 text-sky-500" />
                        Nível
                      </div>
                      <p className="text-xs font-bold truncate">{procedimento.anestesia_necessaria ? "Anestesia" : "Simples"}</p>
                    </div>
                  </div>

                  {(procedimento.instrucoes_preparo || procedimento.instrucoes_pos) && (
                    <div className="mt-4 pt-4 border-t border-muted/30 flex items-center justify-between">
                       <div className="flex gap-2">
                          {procedimento.instrucoes_preparo && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="h-7 w-7 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center cursor-help">
                                  <Eye className="h-3.5 w-3.5 text-primary" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[280px]">
                                <p className="font-bold text-xs mb-1">Preparo:</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">{procedimento.instrucoes_preparo}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          {procedimento.instrucoes_pos && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="h-7 w-7 rounded-lg bg-orange-500/5 border border-orange-500/10 flex items-center justify-center cursor-help">
                                  <Activity className="h-3.5 w-3.5 text-orange-500" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[280px]">
                                <p className="font-bold text-xs mb-1">Pós-Procedimento:</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">{procedimento.instrucoes_pos}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                       </div>
                       <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest opacity-60">Instruções OK</span>
                    </div>
                  )}
                </Card>
              ))}
            </TooltipProvider>
          </div>
        )}

        {editingId && (
          <EditProcedimentoDialog
            procedimentoId={editingId}
            open={true}
            onOpenChange={(open) => !open && setEditingId(null)}
            onSuccess={fetchProcedimentos}
          />
        )}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Procedimento"
        description={`Tem certeza que deseja excluir o procedimento "${procedimentoToDelete?.nome}"? Esta ação não pode ser desfeita.`}
      />
    </MainLayout>
  );
};

export default Procedimentos;
