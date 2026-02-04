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
  Package,
  Loader2,
  DollarSign,
  Calendar as CalendarIcon,
  Users,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NewPacoteDialog } from "@/components/pacotes/NewPacoteDialog";
import { EditPacoteDialog } from "@/components/pacotes/EditPacoteDialog";

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

const Pacotes = () => {
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPacotes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('pacotes')
        .select('*, procedimentos:servico_id(nome)')
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
  };

  useEffect(() => {
    fetchPacotes();
  }, []);

  const togglePacoteStatus = async (pacoteId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('pacotes')
        .update({ ativo: !currentStatus })
        .eq('id', pacoteId);

      if (error) throw error;

      setPacotes(prev => prev.map(pacote => 
        pacote.id === pacoteId 
          ? { ...pacote, ativo: !currentStatus }
          : pacote
      ));

      toast({
        title: "Status atualizado",
        description: `Pacote ${!currentStatus ? "ativado" : "desativado"} com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do pacote.",
        variant: "destructive"
      });
    }
  };

  const deletePacote = async (pacoteId: string) => {
    // Importar validação
    const { validatePacoteDelete } = await import('@/lib/deleteValidation');
    
    // Validar antes de excluir
    const validation = await validatePacoteDelete(pacoteId);
    
    if (!validation.canDelete) {
      toast({
        title: "Não é possível excluir",
        description: validation.message,
        variant: "destructive",
        duration: 10000
      });
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
        description: "O pacote foi removido com sucesso."
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
  const totalRevenue = filteredPacotes.reduce((acc, p) => acc + p.preco, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Pacotes de Tratamentos</h1>
            <p className="text-muted-foreground">
              Gerencie pacotes de sessões para tratamentos estéticos e de beleza ({pacotes.length})
            </p>
          </div>
          {!isLoading && pacotes.length > 0 && (
            <NewPacoteDialog onSuccess={() => fetchPacotes()} />
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pacotes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Estatísticas dos Pacotes */}
        {!isLoading && filteredPacotes.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Estatísticas dos Pacotes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{activePacotes.length}</p>
                <p className="text-sm text-muted-foreground">Pacotes Ativos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">R$ {totalRevenue.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Receita Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">{pacotes.length}</p>
                <p className="text-sm text-muted-foreground">Total de Pacotes</p>
              </div>
            </div>
          </Card>
        )}

        {/* Lista de Pacotes */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPacotes.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "Nenhum pacote encontrado" : "Nenhum pacote cadastrado"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Tente uma busca diferente" : "Crie pacotes de tratamentos para oferecer aos seus clientes"}
            </p>
            {!searchTerm && <NewPacoteDialog onSuccess={() => fetchPacotes()} />}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPacotes.map((pacote) => (
              <Card key={pacote.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-light rounded-lg">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{pacote.nome}</h3>
                      {pacote.descricao && (
                        <p className="text-sm text-muted-foreground mt-1">{pacote.descricao}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={pacote.ativo ? "default" : "secondary"}>
                      {pacote.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    <Switch
                      checked={pacote.ativo}
                      onCheckedChange={() => togglePacoteStatus(pacote.id, pacote.ativo)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Sessões</p>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{pacote.numero_sessoes} sessões</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Preço</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium">R$ {pacote.preco.toFixed(2)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Validade</p>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-warning" />
                      <span className="text-sm font-medium">{pacote.validade_dias} dias</span>
                    </div>
                  </div>
                  {pacote.renovacao_automatica && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Renovação</p>
                      <Badge variant="outline" className="text-xs">
                        Automática {pacote.desconto_renovacao > 0 && `(-${pacote.desconto_renovacao}%)`}
                      </Badge>
                    </div>
                  )}
                </div>

                {pacote.procedimentos && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-1">Procedimento vinculado</p>
                    <Badge variant="secondary">{pacote.procedimentos.nome}</Badge>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditingId(pacote.id)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    size="sm" 
                    variant="outline" 
                    onClick={() => deletePacote(pacote.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
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
};

export default Pacotes;