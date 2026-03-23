import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import {
  Edit,
  Trash2,
  Clock,
  DollarSign,
  TestTube,
  Loader2,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLayoutTitle } from "@/hooks/useLayoutTitle";
import { NewExameDialog } from "@/components/schedule/NewExameDialog";
import { EditExameDialog } from "@/components/schedule/EditExameDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrencyBRL } from "@/lib/currency";

interface Exame {
  id: string;
  nome: string;
  codigo_tuss: string | null;
  descricao: string | null;
  tempo_preparo_minutos: number | null;
  tempo_jejum_horas: number | null;
  duracao_minutos: number | null;
  preco: number | null;
  instrucoes: string | null;
  requisitos: string | null;
  ativo: boolean;
  created_at: string;
}

const Exames = () => {
  const [exames, setExames] = useState<Exame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const { setTitle, setSubtitle } = useLayoutTitle();

  useEffect(() => {
    setTitle("Exames");
    setSubtitle("Gestão inteligente do catálogo de exames diagnósticos.");
  }, [setTitle, setSubtitle]);

  const fetchExames = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('exames')
        .select('*')
        .order('nome');

      if (error) throw error;
      setExames(data || []);
    } catch (error) {
      console.error('Erro ao buscar exames:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os exames.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchExames();
  }, [fetchExames]);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('exames')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setExames(prev => prev.map(exame =>
        exame.id === id ? { ...exame, ativo: !currentStatus } : exame
      ));

      toast({
        title: "Status atualizado",
        description: `Exame ${!currentStatus ? "ativado" : "desativado"} com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status.",
        variant: "destructive"
      });
    }
  };

  const deleteExame = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este exame? Esta ação não pode ser desfeita.")) return;

    try {
      const { error } = await supabase
        .from('exames')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExames(prev => prev.filter(exame => exame.id !== id));

      toast({
        title: "Exame excluído",
        description: "O exame foi removido com sucesso."
      });
    } catch (error) {
      console.error('Erro ao excluir exame:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o exame.",
        variant: "destructive"
      });
    }
  };

  const filteredExames = exames.filter(exame =>
    exame.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exame.codigo_tuss?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeExames = filteredExames.filter(e => e.ativo).length;

  return (
    <MainLayout>
      <div className="flex flex-col space-y-6 animate-in fade-in duration-500 pb-10 w-full px-4 md:px-0">
        {/* Compact Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card/30 py-3 px-4 md:px-5 rounded-xl border border-border/50 backdrop-blur-sm min-w-0 w-full">
          <div className="relative group flex-1 w-full md:max-w-[560px] min-w-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              placeholder="Buscar por nome ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-background/50 border-muted/20 rounded-xl shadow-sm focus-visible:ring-primary focus-visible:ring-offset-0 transition-all text-sm placeholder:text-muted-foreground/60 w-full min-w-0"
            />
          </div>

          <NewExameDialog onSuccess={fetchExames}>
            <Button className="w-full md:w-auto shrink-0 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-6 rounded-xl group min-w-0">
              <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
              Novo Exame
            </Button>
          </NewExameDialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0">
          <Card className="p-5 bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/10 shadow-sm relative overflow-hidden group min-w-0">
            <div className="absolute right-[-10%] top-[-10%] opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <Activity size={100} />
            </div>
            <div className="flex items-center gap-4 relative z-10 min-w-0">
              <div className="p-3 rounded-xl bg-primary/20 text-primary shrink-0">
                <TestTube className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">Ativos</p>
                <p className="text-3xl font-black text-foreground truncate">{activeExames}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-5 bg-gradient-to-br from-secondary/5 via-transparent to-transparent border-secondary/10 shadow-sm relative overflow-hidden group min-w-0">
            <div className="absolute right-[-10%] top-[-10%] opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <CheckCircle2 size={100} />
            </div>
            <div className="flex items-center gap-4 relative z-10 min-w-0">
              <div className="p-3 rounded-xl bg-secondary/20 text-secondary-foreground shrink-0">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate">Total</p>
                <p className="text-3xl font-black text-foreground truncate">{exames.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
          </div>
        ) : filteredExames.length === 0 ? (
          <Card className="py-12 px-4 bg-muted/10 border-dashed border-muted/50 border flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 rounded-xl">
            <div className="p-6 bg-muted/30 rounded-full shadow-inner mb-6 border border-muted/40">
              <Search className="h-12 w-12 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {searchTerm ? "Nenhum exame encontrado" : "Explore novas possibilidades"}
            </h3>
            <p className="text-muted-foreground max-w-sm mb-8">
              {searchTerm
                ? "Tente ajustar sua busca com termos menos específicos."
                : "Cadastre seu primeiro exame para começar a gerenciar sua clínica."
              }
            </p>
            {!searchTerm && (
              <NewExameDialog onSuccess={fetchExames}>
                <Button className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-8 rounded-xl group min-w-0">
                  Criar Primeiro Exame
                </Button>
              </NewExameDialog>
            )}
          </Card>
        ) : (
          <TooltipProvider>
            <div className={cn(
              "grid gap-6 w-full auto-rows-fr min-w-0",
              filteredExames.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
            )}>
              {filteredExames.map((exame, index) => (
                <div
                  key={exame.id}
                  className={cn(
                    "min-w-0",
                    filteredExames.length === 1 && "col-span-full max-w-2xl mx-auto w-full"
                  )}
                >
                  <Card 
                    className={cn(
                      "group/card relative overflow-hidden bg-muted/30 backdrop-blur-sm border-muted/50 shadow-sm transition-all duration-300 hover:shadow-md hover:bg-muted/50 rounded-xl p-4 md:p-5 flex flex-col h-full min-w-0",
                      "animate-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex justify-between items-start gap-4 mb-4 min-w-0">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap min-w-0">
                          <h3 className="text-lg md:text-xl font-bold tracking-tight text-foreground group-hover/card:text-primary transition-colors truncate">
                            {exame.nome}
                          </h3>
                        <Badge 
                          variant={exame.ativo ? "default" : "secondary"}
                          className={`
                            px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest
                            ${exame.ativo ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground"}
                          `}
                        >
                          {exame.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      
                      {exame.codigo_tuss && (
                        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/30 w-fit px-2 py-1 rounded-md">
                          <Badge variant="outline" className="h-4 p-0 px-1 text-[9px] border-primary/20 text-primary">TUSS</Badge>
                          {exame.codigo_tuss}
                        </div>
                      )}
                    </div>

                      <div className="flex gap-1 md:gap-2 shrink-0 opacity-100 lg:opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 mr-1 pr-2 border-r border-muted/50">
                          <Switch
                            checked={exame.ativo}
                            onCheckedChange={() => toggleStatus(exame.id, exame.ativo)}
                          />
                        </div>
                      
                      <div className="flex gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingId(exame.id)}
                              className="h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              <Edit className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar Exame</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteExame(exame.id)}
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

                  {exame.descricao && (
                    <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-6 leading-relaxed bg-muted/30 p-3 rounded-xl border border-muted/50 italic">
                      "{exame.descricao}"
                    </p>
                  )}

                    <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-background/50 border border-muted/50 backdrop-blur-md shadow-inner min-w-0 mt-auto">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-tighter min-w-0">
                          <Clock className="h-3 w-3 text-primary shrink-0" />
                          <span className="truncate">Duração</span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold truncate">{exame.duracao_minutos || "---"} min</p>
                      </div>
                      
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-tighter min-w-0">
                          <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                          <span className="truncate">Preparo</span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold truncate">{exame.tempo_preparo_minutos || "0"} min</p>
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-tighter min-w-0">
                          <Clock className="h-3 w-3 text-sky-500 shrink-0" />
                          <span className="truncate">Jejum</span>
                        </div>
                        <p className="text-xs sm:text-sm font-semibold truncate">{exame.tempo_jejum_horas || "0"}h</p>
                      </div>

                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-tighter min-w-0">
                          <DollarSign className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span className="truncate">Preço</span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-emerald-500 truncate">
                          {exame.preco ? formatCurrencyBRL(exame.preco) : "---"}
                        </p>
                      </div>
                    </div>

                  {(exame.instrucoes || exame.requisitos) && (
                    <div className="mt-6 flex gap-2">
                       {exame.instrucoes && (
                         <Tooltip>
                           <TooltipTrigger asChild>
                            <div className="h-8 w-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center cursor-help">
                              <Eye className="h-4 w-4 text-primary" />
                            </div>
                           </TooltipTrigger>
                           <TooltipContent className="max-w-[300px]">
                             <p className="font-bold mb-1">Instruções:</p>
                             <p className="text-xs text-muted-foreground leading-relaxed">{exame.instrucoes}</p>
                           </TooltipContent>
                         </Tooltip>
                       )}
                       {exame.requisitos && (
                         <Tooltip>
                           <TooltipTrigger asChild>
                            <div className="h-8 w-8 rounded-lg bg-orange-500/5 border border-orange-500/10 flex items-center justify-center cursor-help">
                              <Activity className="h-4 w-4 text-orange-500" />
                            </div>
                           </TooltipTrigger>
                           <TooltipContent className="max-w-[300px]">
                             <p className="font-bold mb-1">Requisitos:</p>
                             <p className="text-xs text-muted-foreground leading-relaxed">{exame.requisitos}</p>
                           </TooltipContent>
                         </Tooltip>
                       )}
                       <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mt-2 ml-1">Informações adicionais disponíveis</span>
                    </div>
                  )}
                  </Card>
                </div>
              ))}
            </div>
          </TooltipProvider>
        )}

        {editingId && (
          <EditExameDialog
            exameId={editingId}
            open={true}
            onOpenChange={(open) => !open && setEditingId(null)}
            onSuccess={fetchExames}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Exames;
