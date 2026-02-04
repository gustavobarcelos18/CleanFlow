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
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NewProcedimentoDialog } from "@/components/schedule/NewProcedimentoDialog";
import { EditProcedimentoDialog } from "@/components/schedule/EditProcedimentoDialog";

interface Procedimento {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco: number | null;
  codigo_tuss: string | null;
  descricao: string | null;
  tempo_preparo_minutos: number | null;
  instrucoes: string | null;
  requisitos: string | null;
  confirmacao_24h: boolean;
  ativo: boolean;
  created_at: string;
}

const Procedimentos = () => {
  const [procedimentos, setProcedimentos] = useState<Procedimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProcedimentos = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('procedimentos')
        .select('*')
        .order('nome');

      if (error) throw error;
      setProcedimentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar procedimentos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os procedimentos.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProcedimentos();
  }, []);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('procedimentos')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setProcedimentos(prev => prev.map(proc => 
        proc.id === id ? { ...proc, ativo: !currentStatus } : proc
      ));

      toast({
        title: "Status atualizado",
        description: `Procedimento ${!currentStatus ? "ativado" : "desativado"} com sucesso.`
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

  const deleteProcedimento = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este procedimento? Esta ação não pode ser desfeita.")) return;

    try {
      const { error } = await supabase
        .from('procedimentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProcedimentos(prev => prev.filter(proc => proc.id !== id));
      
      toast({
        title: "Procedimento excluído",
        description: "O procedimento foi removido com sucesso."
      });
    } catch (error) {
      console.error('Erro ao excluir procedimento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o procedimento.",
        variant: "destructive"
      });
    }
  };

  const filteredProcedimentos = procedimentos.filter(proc =>
    proc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proc.codigo_tuss?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeProcedimentos = filteredProcedimentos.filter(p => p.ativo).length;

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Procedimentos</h1>
            <p className="text-muted-foreground">
              Gerencie os procedimentos oferecidos
            </p>
          </div>
          <NewProcedimentoDialog onSuccess={fetchProcedimentos}>
            <Button size="lg">
              <Settings className="mr-2 h-5 w-5" />
              Novo Procedimento
            </Button>
          </NewProcedimentoDialog>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar procedimentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/10">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Procedimentos Ativos</p>
                <p className="text-2xl font-bold">{activeProcedimentos}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-secondary/10">
                <CheckCircle2 className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Procedimentos</p>
                <p className="text-2xl font-bold">{procedimentos.length}</p>
              </div>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredProcedimentos.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Settings className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "Nenhum procedimento encontrado" : "Nenhum procedimento cadastrado"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? "Tente ajustar sua busca"
                  : "Comece adicionando seu primeiro procedimento"
                }
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredProcedimentos.map((procedimento) => (
              <Card key={procedimento.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{procedimento.nome}</h3>
                        {procedimento.codigo_tuss && (
                          <p className="text-sm text-muted-foreground">
                            TUSS: {procedimento.codigo_tuss}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={procedimento.ativo ? "default" : "secondary"}>
                          {procedimento.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        {procedimento.confirmacao_24h && (
                          <Badge variant="outline">Confirmação 24h</Badge>
                        )}
                      </div>
                    </div>

                    {procedimento.descricao && (
                      <p className="text-sm text-muted-foreground">{procedimento.descricao}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{procedimento.duracao_minutos} minutos</span>
                      </div>
                      {procedimento.tempo_preparo_minutos && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Preparo: {procedimento.tempo_preparo_minutos} min</span>
                        </div>
                      )}
                      {procedimento.preco && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>R$ {Number(procedimento.preco).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2 justify-end">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={procedimento.ativo}
                        onCheckedChange={() => toggleStatus(procedimento.id, procedimento.ativo)}
                      />
                    </div>
                    <EditProcedimentoDialog
                      procedimentoId={procedimento.id}
                      open={editingId === procedimento.id}
                      onOpenChange={(open) => setEditingId(open ? procedimento.id : null)}
                      onSuccess={fetchProcedimentos}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(procedimento.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </EditProcedimentoDialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteProcedimento(procedimento.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
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
    </MainLayout>
  );
};

export default Procedimentos;
