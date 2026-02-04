import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Edit, 
  Trash2, 
  Loader2,
  Search,
  FileText,
  Clock,
  DollarSign
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NewExameProcedimentoDialog } from "@/components/schedule/NewExameProcedimentoDialog";
import { EditExameProcedimentoDialog } from "@/components/schedule/EditExameProcedimentoDialog";

interface ExameProcedimento {
  id: string;
  nome: string;
  tipo: string;
  codigo_tuss: string | null;
  descricao: string | null;
  tempo_preparo_minutos: number | null;
  tempo_jejum_horas: number | null;
  duracao_minutos: number | null;
  valor: number | null;
  instrucoes: string | null;
  requisitos: string | null;
  ativo: boolean;
  created_at: string;
}

const tipoLabels: Record<string, string> = {
  exame_laboratorial: "Exame Laboratorial",
  exame_imagem: "Exame de Imagem",
  procedimento_cirurgico: "Procedimento Cirúrgico",
  procedimento_terapeutico: "Procedimento Terapêutico",
  procedimento_diagnostico: "Procedimento Diagnóstico"
};

const ExamesProcedimentos = () => {
  const [items, setItems] = useState<ExameProcedimento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchItems = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('exames_procedimentos')
        .select('*')
        .order('nome');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('exames_procedimentos')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ativo: !currentStatus } : item
      ));

      toast({
        title: "Status atualizado",
        description: `Item ${!currentStatus ? "ativado" : "desativado"} com sucesso.`
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

  const deleteItem = async (id: string) => {
    // Importar validação
    const { validateExameProcedimentoDelete } = await import('@/lib/deleteValidation');
    
    // Validar antes de excluir
    const validation = await validateExameProcedimentoDelete(id);
    
    if (!validation.canDelete) {
      toast({
        title: "Não é possível excluir",
        description: validation.message,
        variant: "destructive",
        duration: 10000
      });
      return;
    }

    if (!confirm("Tem certeza que deseja excluir este item?")) return;

    try {
      const { error } = await supabase
        .from('exames_procedimentos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "Item excluído",
        description: "O item foi removido com sucesso."
      });
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item.",
        variant: "destructive"
      });
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.codigo_tuss && item.codigo_tuss.includes(searchTerm));
    
    if (activeTab === "todos") return matchesSearch;
    if (activeTab === "exames") return matchesSearch && item.tipo.startsWith("exame_");
    if (activeTab === "procedimentos") return matchesSearch && item.tipo.startsWith("procedimento_");
    return matchesSearch;
  });

  const renderItem = (item: ExameProcedimento) => (
    <Card key={item.id} className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-light rounded-full">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">{item.nome}</h3>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{tipoLabels[item.tipo]}</Badge>
              {item.codigo_tuss && (
                <Badge variant="secondary">TUSS: {item.codigo_tuss}</Badge>
              )}
            </div>
            {item.descricao && (
              <p className="text-sm text-muted-foreground mt-2">{item.descricao}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={item.ativo ? "default" : "secondary"}>
            {item.ativo ? "Ativo" : "Inativo"}
          </Badge>
          <Switch
            checked={item.ativo}
            onCheckedChange={() => toggleStatus(item.id, item.ativo)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {item.duracao_minutos && (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{item.duracao_minutos} min</span>
          </div>
        )}
        {item.tempo_jejum_horas && (
          <div className="text-sm text-muted-foreground">
            Jejum: {item.tempo_jejum_horas}h
          </div>
        )}
        {item.tempo_preparo_minutos && (
          <div className="text-sm text-muted-foreground">
            Preparo: {item.tempo_preparo_minutos} min
          </div>
        )}
        {item.valor && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">R$ {item.valor.toFixed(2)}</span>
          </div>
        )}
      </div>

      {(item.instrucoes || item.requisitos) && (
        <div className="mb-4 space-y-2">
          {item.instrucoes && (
            <p className="text-sm"><strong>Instruções:</strong> {item.instrucoes}</p>
          )}
          {item.requisitos && (
            <p className="text-sm"><strong>Requisitos:</strong> {item.requisitos}</p>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant="outline"
          onClick={() => setEditingId(item.id)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Editar
        </Button>
        <Button
          size="sm" 
          variant="outline" 
          onClick={() => deleteItem(item.id)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir
        </Button>
      </div>
    </Card>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Exames e Procedimentos</h1>
            <p className="text-muted-foreground">
              Gerenciar exames e procedimentos disponíveis ({items.length})
            </p>
          </div>
          {!isLoading && items.length > 0 && (
            <NewExameProcedimentoDialog onSuccess={() => fetchItems()} />
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código TUSS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="todos">Todos ({items.length})</TabsTrigger>
            <TabsTrigger value="exames">
              Exames ({items.filter(i => i.tipo.startsWith("exame_")).length})
            </TabsTrigger>
            <TabsTrigger value="procedimentos">
              Procedimentos ({items.filter(i => i.tipo.startsWith("procedimento_")).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "Nenhum item encontrado" : "Nenhum item cadastrado"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm ? "Tente uma busca diferente" : "Comece adicionando seu primeiro item"}
                </p>
                {!searchTerm && <NewExameProcedimentoDialog onSuccess={() => fetchItems()} />}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredItems.map(renderItem)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {editingId && (
        <EditExameProcedimentoDialog
          itemId={editingId}
          open={!!editingId}
          onOpenChange={(open) => !open && setEditingId(null)}
          onSuccess={() => fetchItems()}
        />
      )}
    </MainLayout>
  );
};

export default ExamesProcedimentos;
