import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-muted/30 pb-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-300 dark:to-gray-600 pr-2 pb-1">
              Exames
            </h1>
            <p className="text-muted-foreground font-medium">
              Gestão inteligente do catálogo de exames diagnósticos.
            </p>
          </div>
          <NewExameDialog onSuccess={fetchExames}>
            <Button className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-6 group">
              <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
              Novo Exame
            </Button>
          </NewExameDialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/10 shadow-sm relative overflow-hidden group">
            <div className="absolute right-[-10%] top-[-10%] opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <Activity size={120} />
            </div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-xl bg-primary/20 text-primary">
                <TestTube className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ativos</p>
                <p className="text-3xl font-black text-foreground">{activeExames}</p>
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
                <p className="text-3xl font-black text-foreground">{exames.length}</p>
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
                  placeholder="Filtrar por nome ou código..."
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
        ) : filteredExames.length === 0 ? (
          <Card className="p-20 bg-muted/10 border-dashed border-muted/50 border flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 rounded-xl">
            <div className="p-6 rounded-full bg-muted/10 mb-6">
              <Search className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {searchTerm ? "Nenhum exame encontrado" : "Explore novas possibilidades"}
            </h3>
            <p className="text-muted-foreground max-w-sm mb-8 text-lg">
              {searchTerm
                ? "Não encontramos resultados para sua busca. Tente termos menos específicos."
                : "Cadastre seu primeiro exame para começar a gerenciar sua clínica."
              }
            </p>
            {!searchTerm && (
              <NewExameDialog onSuccess={fetchExames}>
                <Button className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-8 rounded-xl group">
                  Criar Primeiro Exame
                </Button>
              </NewExameDialog>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TooltipProvider>
              {filteredExames.map((exame, index) => (
                <Card 
                  key={exame.id} 
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

                    <div className="flex gap-2">
                      <div className="flex items-center gap-2 mr-2 pr-4 border-r border-muted/50">
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

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-background/50 border border-muted/50 backdrop-blur-md shadow-inner">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                        <Clock className="h-3 w-3 text-primary" />
                        Duração
                      </div>
                      <p className="text-sm font-semibold">{exame.duracao_minutos || "---"} min</p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                        <Clock className="h-3 w-3 text-amber-500" />
                        Preparo
                      </div>
                      <p className="text-sm font-semibold">{exame.tempo_preparo_minutos || "0"} min</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                        <Clock className="h-3 w-3 text-sky-500" />
                        Jejum
                      </div>
                      <p className="text-sm font-semibold">{exame.tempo_jejum_horas || "0"}h</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                        <DollarSign className="h-3 w-3 text-emerald-500" />
                        Preço
                      </div>
                      <p className="text-sm font-bold text-emerald-500">
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
              ))}
            </TooltipProvider>
          </div>
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
