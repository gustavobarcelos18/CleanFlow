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
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        <div className="flex justify-end">
          <NewProcedimentoDialog onSuccess={fetchProcedimentos}>
            <Button className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-8 rounded-xl group">
              <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
              Novo Procedimento
            </Button>
          </NewProcedimentoDialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/10 shadow-sm relative overflow-hidden group">
            <div className="absolute right-[-10%] top-[-10%] opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <Activity size={120} />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-xl bg-primary/20 text-primary">
                <Settings className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ativos</p>
                <p className="text-3xl font-black text-foreground">{activeProcedimentos}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-secondary/5 via-transparent to-transparent border-secondary/10 shadow-sm relative overflow-hidden group">
            <div className="absolute right-[-10%] top-[-10%] opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <CheckCircle2 size={120} />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-xl bg-secondary/20 text-secondary-foreground">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total</p>
                <p className="text-3xl font-black text-foreground">{procedimentos.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-muted/5 via-transparent to-transparent border-muted/10 shadow-sm relative overflow-hidden group">
            <div className="absolute right-[-10%] top-[-10%] opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <Filter size={120} />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-xl bg-muted/20 text-muted-foreground">
                <Search className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Filtrar por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none shadow-none text-base focus-visible:ring-0 px-0 h-10"
                />
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TooltipProvider>
              {filteredProcedimentos.map((procedimento, index) => (
                <Card 
                  key={procedimento.id} 
                  className={`
                    relative group/card overflow-hidden bg-muted/30 backdrop-blur-sm border-muted/50 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-muted/50 rounded-xl p-6
                    animate-in slide-in-from-bottom-4 duration-500 fill-mode-both
                  `}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex justify-between items-start gap-4 mb-6">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-xl font-bold tracking-tight text-foreground group-hover/card:text-primary transition-colors">
                          {procedimento.nome}
                        </h3>
                        <Badge 
                          variant={procedimento.ativo ? "default" : "secondary"}
                          className={`
                            px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest
                            ${procedimento.ativo ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground"}
                          `}
                        >
                          {procedimento.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        {procedimento.anestesia_necessaria && (
                           <Badge variant="outline" className="bg-amber-500/5 text-amber-500 border-amber-500/20 rounded-full text-[10px] uppercase font-bold px-2 py-0.5">
                             Anestesia
                           </Badge>
                        )}
                      </div>
                      
                      {procedimento.codigo_tuss && (
                        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/30 w-fit px-2 py-1 rounded-md">
                          <Badge variant="outline" className="h-4 p-0 px-1 text-[9px] border-primary/20 text-primary">TUSS</Badge>
                          {procedimento.codigo_tuss}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 mr-2 pr-4 border-r border-muted/50">
                        <Switch
                          checked={procedimento.ativo}
                          onCheckedChange={() => toggleStatus(procedimento.id, procedimento.ativo)}
                        />
                      </div>
                      
                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingId(procedimento.id)}
                              className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              <Edit className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar Procedimento</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteProcedimento(procedimento.id)}
                              className="h-10 w-10 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir permanentemente</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  {procedimento.descricao && (
                    <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-6 leading-relaxed bg-muted/5 p-3 rounded-xl border border-border/10 italic">
                      "{procedimento.descricao}"
                    </p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-background/50 border border-muted/50 backdrop-blur-md shadow-inner">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                        <Clock className="h-3 w-3 text-primary" />
                        Duração
                      </div>
                      <p className="text-sm font-semibold">{procedimento.duracao_minutos || "---"} min</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                        <DollarSign className="h-3 w-3 text-emerald-500" />
                        Valor Base
                      </div>
                      <p className="text-sm font-bold text-emerald-500">
                        {procedimento.preco ? formatCurrencyBRL(procedimento.preco) : "---"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                        <ShieldCheck className="h-3 w-3 text-sky-500" />
                        Segurança
                      </div>
                      <p className="text-sm font-semibold">{procedimento.anestesia_necessaria ? "Req. Anestesia" : "Simples"}</p>
                    </div>
                  </div>

                  {(procedimento.instrucoes_preparo || procedimento.instrucoes_pos) && (
                    <div className="mt-6 flex gap-2">
                       {procedimento.instrucoes_preparo && (
                         <Tooltip>
                           <TooltipTrigger asChild>
                            <div className="h-8 w-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center cursor-help">
                              <Eye className="h-4 w-4 text-primary" />
                            </div>
                           </TooltipTrigger>
                           <TooltipContent className="max-w-[300px]">
                             <p className="font-bold mb-1">Preparo:</p>
                             <p className="text-xs text-muted-foreground leading-relaxed">{procedimento.instrucoes_preparo}</p>
                           </TooltipContent>
                         </Tooltip>
                       )}
                       {procedimento.instrucoes_pos && (
                         <Tooltip>
                           <TooltipTrigger asChild>
                            <div className="h-8 w-8 rounded-lg bg-orange-500/5 border border-orange-500/10 flex items-center justify-center cursor-help">
                              <Activity className="h-4 w-4 text-orange-500" />
                            </div>
                           </TooltipTrigger>
                           <TooltipContent className="max-w-[300px]">
                             <p className="font-bold mb-1">Cuidados Pós:</p>
                             <p className="text-xs text-muted-foreground leading-relaxed">{procedimento.instrucoes_pos}</p>
                           </TooltipContent>
                         </Tooltip>
                       )}
                       <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-2 ml-1">Instruções clínicas disponíveis</span>
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
