import React, { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { 
  Edit, 
  Trash2, 
  Package,
  Loader2,
  DollarSign,
  Calendar as CalendarIcon,
  Users,
  Search,
  RefreshCw,
  Zap,
  Tag,
  Clock,
  Archive,
  Star
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NewPacoteDialog } from "@/components/pacotes/NewPacoteDialog";
import { EditPacoteDialog } from "@/components/pacotes/EditPacoteDialog";
import { formatCurrencyBRL } from "@/lib/currency";

interface Pacote {
  id: string;
  nome: string;
  descricao: string | null;
  numero_sessoes: number;
  preco: number;
  validade_dias: number;
  renovacao_automatica: boolean;
  desconto_renovacao: number;
  ativo: boolean;
  servico_id: string | null;
  procedimentos?: { nome: string };
}

export default function Pacotes() {
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPacotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('pacotes')
        .select('*, procedimentos:servico_id(nome)')
        .order('ativo', { ascending: false }) // Ativos primeiro
        .order('nome');

      if (error) throw error;
      setPacotes(data || []);
    } catch (error) {
      console.error('Erro ao buscar pacotes:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pacotes.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPacotes();
  }, [fetchPacotes]);

  const togglePacoteStatus = async (pacoteId: string, currentStatus: boolean) => {
    // UI Otimística
    setPacotes(prev => prev.map(pacote => 
      pacote.id === pacoteId 
        ? { ...pacote, ativo: !currentStatus }
        : pacote
    ));

    try {
      const { error } = await supabase
        .from('pacotes')
        .update({ ativo: !currentStatus })
        .eq('id', pacoteId);

      if (error) throw error;

      toast({
        title: !currentStatus ? "Pacote Ativado" : "Pacote Arquivado",
        description: `O pacote foi ${!currentStatus ? "ativado" : "arquivado"} com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      // Reverter UI em caso de erro
      setPacotes(prev => prev.map(pacote => 
        pacote.id === pacoteId 
          ? { ...pacote, ativo: currentStatus }
          : pacote
      ));
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do pacote.",
        variant: "destructive"
      });
    }
  };

  const deletePacote = async (pacoteId: string) => {
    const { validatePacoteDelete } = await import('@/lib/deleteValidation');
    const validation = await validatePacoteDelete(pacoteId);
    
    if (!validation.canDelete) {
      if (confirm(`Este pacote já tem histórico de vendas (${validation.message}). Deseja apenas arquivá-lo para que não seja mais vendido?`)) {
        togglePacoteStatus(pacoteId, true);
      }
      return;
    }

    if (!confirm("Tem certeza que deseja excluir este pacote? Esta ação não pode ser desfeita.")) return;

    try {
      const { error } = await supabase
        .from('pacotes')
        .delete()
        .eq('id', pacoteId);

      if (error) throw error;

      setPacotes(prev => prev.filter(pacote => pacote.id !== pacoteId));
      
      toast({
        title: "Pacote excluído",
        description: "O pacote foi removido permanentemente."
      });
    } catch (error) {
      console.error('Erro ao excluir pacote:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o pacote.",
        variant: "destructive"
      });
    }
  };

  const filteredPacotes = pacotes.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.descricao && p.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activePacotes = filteredPacotes.filter(p => p.ativo);
  const archivedPacotes = filteredPacotes.filter(p => !p.ativo);

  return (
    <MainLayout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-12">
        {/* Massive Typographic Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-muted/30 pb-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-300 dark:to-gray-600 pr-2 pb-1">
              Catálogo de Pacotes
            </h1>
            <p className="text-muted-foreground font-medium flex items-center gap-2">
              <Package className="h-4 w-4" /> 
              Gerencie seus combos e pacotes de serviços ({pacotes.length} no total)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Buscar pacotes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-muted/20 border-muted/50 focus:bg-background transition-all rounded-full h-10"
              />
            </div>
            {!isLoading && (
              <NewPacoteDialog onSuccess={() => fetchPacotes()}>
                <Button className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-6 rounded-xl group">
                  <Zap className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  Criar Pacote
                </Button>
              </NewPacoteDialog>
            )}
          </div>
        </div>

        {/* Estatísticas / Quick Insights */}
        {!isLoading && pacotes.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-muted/20 border border-muted/40 rounded-xl p-5 flex flex-col justify-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total Ativos</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black">{activePacotes.length}</span>
                <span className="text-sm font-medium text-emerald-500 mb-1 flex items-center"><Star className="h-3 w-3 mr-1" fill="currentColor" /> Prontos para Venda</span>
              </div>
            </div>
            <div className="bg-muted/20 border border-muted/40 rounded-xl p-5 flex flex-col justify-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Arquivados / Inativos</p>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-muted-foreground">{archivedPacotes.length}</span>
                <span className="text-sm font-medium text-amber-500 mb-1 flex items-center"><Archive className="h-3 w-3 mr-1" /> Fora de catálogo</span>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Pacotes (Grid Brutalista Moderna) */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium animate-pulse">Carregando catálogo...</p>
          </div>
        ) : filteredPacotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center border border-dashed border-muted/50 rounded-xl bg-muted/10">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {searchTerm ? "Nenhum pacote encontrado" : "Catálogo Vazio"}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              {searchTerm 
                ? "Tente usar outros termos para encontrar o pacote desejado." 
                : "Pacotes são conjuntos de sessões vendidos antecipadamente. Crie seu primeiro pacote para começar a lucrar com recorrência."}
            </p>
            {!searchTerm && (
              <NewPacoteDialog onSuccess={() => fetchPacotes()}>
                <Button className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-8 rounded-xl group">
                  <Zap className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                  Criar Meu Primeiro Pacote
                </Button>
              </NewPacoteDialog>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPacotes.map((pacote) => (
              <Card 
                key={pacote.id} 
                className={`relative overflow-hidden group transition-all duration-300 border
                  ${pacote.ativo 
                    ? 'bg-muted/30 border-muted/50 hover:bg-muted/50 hover:shadow-md' 
                    : 'bg-muted/10 border-muted/30 opacity-70 grayscale-[0.2]'}
                  rounded-xl`
                }
              >
                {/* Ribbon Tag for Auto-Renew */}
                {pacote.renovacao_automatica && pacote.ativo && (
                  <div className="absolute top-0 right-0">
                     <div className="bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-bl-xl flex items-center gap-1 shadow-sm">
                        <RefreshCw className="h-3 w-3" /> Auto
                     </div>
                  </div>
                )}
                
                {/* Inactive Overlay Badge */}
                {!pacote.ativo && (
                  <div className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm border border-muted px-3 py-1 rounded-full flex items-center gap-1.5 z-10">
                    <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Arquivado</span>
                  </div>
                )}

                <CardContent className="p-0">
                  <div className="p-6 md:p-8 space-y-6">
                    {/* Header */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                         <Badge variant="outline" className={`rounded-md font-mono text-[10px] uppercase tracking-wider ${pacote.ativo ? 'border-primary/30 text-primary' : 'border-muted-foreground/30 text-muted-foreground'}`}>
                           ID: {pacote.id.substring(0,6)}
                         </Badge>
                         {pacote.procedimentos && (
                            <Badge variant="secondary" className="rounded-md font-medium text-xs truncate max-w-[150px]">
                              {pacote.procedimentos.nome}
                            </Badge>
                         )}
                      </div>
                      <h3 className={`text-2xl font-black leading-tight tracking-tight ${pacote.ativo ? 'text-foreground' : 'text-muted-foreground'} line-clamp-2 min-h-[56px] flex items-center`}>
                        {pacote.nome}
                      </h3>
                      {pacote.descricao ? (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2 h-10">{pacote.descricao}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground/50 italic mt-2 h-10">Sem descrição detalhada.</p>
                      )}
                    </div>

                    {/* Pricing Highlight */}
                    <div className="bg-gradient-to-br from-muted/30 to-muted/10 p-4 rounded-xl border border-muted/50 flex justify-between items-center">
                       <div>
                         <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Valor do Pacote</p>
                         <p className={`text-3xl font-black tracking-tighter ${pacote.ativo ? 'text-primary' : 'text-muted-foreground'}`}>
                           <span className="text-lg font-bold opacity-50 mr-1">R$</span>
                           {formatCurrencyBRL(pacote.preco).replace("R$", "").trim()}
                         </p>
                       </div>
                       
                       {pacote.renovacao_automatica && pacote.desconto_renovacao > 0 && (
                          <div className="text-right">
                             <div className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded-md inline-block">
                               -{pacote.desconto_renovacao}% Off
                             </div>
                             <p className="text-[10px] text-muted-foreground font-medium uppercase mt-1">na renovação</p>
                          </div>
                       )}
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-muted/40 shadow-sm">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-500">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Sessões</p>
                          <p className="text-base font-bold text-foreground leading-none mt-0.5">{pacote.numero_sessoes} <span className="text-xs font-medium text-muted-foreground normal-case">x</span></p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-muted/40 shadow-sm">
                        <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-500">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Validade</p>
                          <p className="text-base font-bold text-foreground leading-none mt-0.5">{pacote.validade_dias} <span className="text-xs font-medium text-muted-foreground normal-case">dias</span></p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="border-t border-muted/50 p-4 bg-muted/10 group-hover:bg-muted/30 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Switch
                         checked={pacote.ativo}
                         onCheckedChange={(checked) => togglePacoteStatus(pacote.id, checked)}
                         className="data-[state=checked]:bg-primary"
                       />
                       <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                         {pacote.ativo ? "Catálogo" : "Arquivado"}
                       </span>
                    </div>

                    <div className="flex gap-1">
                      <Button 
                        size="icon" 
                        variant="ghost"
                        className="h-8 w-8 rounded-full hover:bg-background hover:shadow-sm"
                        onClick={() => setEditingId(pacote.id)}
                        title="Editar Pacote"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        onClick={() => deletePacote(pacote.id)}
                        title={pacote.ativo ? "Excluir Pacote" : "Excluir Definitivamente"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {editingId && (
        <EditPacoteDialog
          pacoteId={editingId}
          open={!!editingId}
          onOpenChange={(open) => !open && setEditingId(null)}
          onSuccess={() => fetchPacotes()}
        />
      )}
    </MainLayout>
  );
}