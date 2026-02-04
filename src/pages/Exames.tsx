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
  TestTube,
  Loader2,
  CheckCircle2,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NewExameDialog } from "@/components/schedule/NewExameDialog";
import { EditExameDialog } from "@/components/schedule/EditExameDialog";

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

  const fetchExames = async () => {
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
  };

  useEffect(() => {
    fetchExames();
  }, []);

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
      <div className="space-y-6 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Exames</h1>
            <p className="text-muted-foreground">
              Gerencie os exames oferecidos
            </p>
          </div>
          <NewExameDialog onSuccess={fetchExames}>
            <Button size="lg">
              <TestTube className="mr-2 h-5 w-5" />
              Novo Exame
            </Button>
          </NewExameDialog>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar exames..."
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
                <TestTube className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Exames Ativos</p>
                <p className="text-2xl font-bold">{activeExames}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-secondary/10">
                <CheckCircle2 className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Exames</p>
                <p className="text-2xl font-bold">{exames.length}</p>
              </div>
            </div>
          </div>
        </Card>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredExames.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <TestTube className="mx-auto h-24 w-24 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? "Nenhum exame encontrado" : "Nenhum exame cadastrado"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Tente ajustar sua busca"
                  : "Comece adicionando seu primeiro exame"
                }
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredExames.map((exame) => (
              <Card key={exame.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{exame.nome}</h3>
                        {exame.codigo_tuss && (
                          <p className="text-sm text-muted-foreground">
                            TUSS: {exame.codigo_tuss}
                          </p>
                        )}
                      </div>
                      <Badge variant={exame.ativo ? "default" : "secondary"}>
                        {exame.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>

                    {exame.descricao && (
                      <p className="text-sm text-muted-foreground">{exame.descricao}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm">
                      {exame.duracao_minutos && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{exame.duracao_minutos} minutos</span>
                        </div>
                      )}
                      {exame.tempo_preparo_minutos && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Preparo: {exame.tempo_preparo_minutos} min</span>
                        </div>
                      )}
                      {exame.tempo_jejum_horas && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Jejum: {exame.tempo_jejum_horas}h</span>
                        </div>
                      )}
                      {exame.preco && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>R$ {Number(exame.preco).toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {(exame.instrucoes || exame.requisitos) && (
                      <div className="text-sm space-y-1">
                        {exame.instrucoes && (
                          <p className="text-muted-foreground"><strong>Instruções:</strong> {exame.instrucoes}</p>
                        )}
                        {exame.requisitos && (
                          <p className="text-muted-foreground"><strong>Requisitos:</strong> {exame.requisitos}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex sm:flex-col gap-2 justify-end">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={exame.ativo}
                        onCheckedChange={() => toggleStatus(exame.id, exame.ativo)}
                      />
                    </div>
                    <EditExameDialog
                      exameId={exame.id}
                      open={editingId === exame.id}
                      onOpenChange={(open) => setEditingId(open ? exame.id : null)}
                      onSuccess={fetchExames}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(exame.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </EditExameDialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteExame(exame.id)}
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
