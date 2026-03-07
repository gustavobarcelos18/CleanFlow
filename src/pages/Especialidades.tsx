import React, { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Edit, Trash2, Loader2, Search, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NewEspecialidadeDialog } from "@/components/schedule/NewEspecialidadeDialog";
import { EditEspecialidadeDialog } from "@/components/schedule/EditEspecialidadeDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface Especialidade {
  id: string;
  nome: string;
  descricao: string | null;
  codigo_cfm: string | null;
  ativo: boolean;
  created_at: string;
}

const Especialidades = () => {
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [especialidadeToDelete, setEspecialidadeToDelete] =
    useState<Especialidade | null>(null);
  const { toast } = useToast();

  const fetchEspecialidades = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("especialidades")
        .select("*")
        .order("nome");

      if (error) throw error;
      setEspecialidades(data || []);
    } catch (error) {
      console.error("Erro ao buscar especialidades:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as especialidades.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEspecialidades();
  }, []);

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("especialidades")
        .update({ ativo: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setEspecialidades((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ativo: !currentStatus } : e)),
      );

      toast({
        title: "Status atualizado",
        description: `Especialidade ${!currentStatus ? "ativada" : "desativada"} com sucesso.`,
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

  const deleteEspecialidade = async (id: string) => {
    // Importar validação
    const { validateEspecialidadeDelete } =
      await import("@/lib/deleteValidation");

    // Validar antes de excluir
    const validation = await validateEspecialidadeDelete(id);

    if (!validation.canDelete) {
      toast({
        title: "Não é possível excluir",
        description: validation.message,
        variant: "destructive",
        duration: 10000,
      });
      return;
    }

    setEspecialidadeToDelete(especialidades.find((e) => e.id === id) || null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!especialidadeToDelete) return;

    try {
      const { error } = await supabase
        .from("especialidades")
        .delete()
        .eq("id", especialidadeToDelete.id);

      if (error) throw error;

      setEspecialidades((prev) =>
        prev.filter((e) => e.id !== especialidadeToDelete.id),
      );

      toast({
        title: "Especialidade excluída",
        description: "A especialidade foi removida com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a especialidade.",
        variant: "destructive",
      });
    } finally {
      setEspecialidadeToDelete(null);
    }
  };

  const filteredEspecialidades = especialidades.filter(
    (e) =>
      e.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.codigo_cfm && e.codigo_cfm.includes(searchTerm)),
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Especialidades Médicas
            </h1>
            <p className="text-muted-foreground">
              Gerenciar especialidades reconhecidas ({especialidades.length})
            </p>
          </div>
          {!isLoading && especialidades.length > 0 && (
            <NewEspecialidadeDialog onSuccess={() => fetchEspecialidades()} />
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código CFM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredEspecialidades.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm
                ? "Nenhuma especialidade encontrada"
                : "Nenhuma especialidade cadastrada"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? "Tente uma busca diferente"
                : "Comece adicionando sua primeira especialidade"}
            </p>
            {!searchTerm && (
              <NewEspecialidadeDialog onSuccess={() => fetchEspecialidades()} />
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredEspecialidades.map((especialidade) => (
              <Card key={especialidade.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-light rounded-full">
                      <Stethoscope className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {especialidade.nome}
                      </h3>
                      {especialidade.codigo_cfm && (
                        <p className="text-sm text-muted-foreground">
                          Código CFM: {especialidade.codigo_cfm}
                        </p>
                      )}
                      {especialidade.descricao && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {especialidade.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={especialidade.ativo ? "default" : "secondary"}
                    >
                      {especialidade.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                    <Switch
                      checked={especialidade.ativo}
                      onCheckedChange={() =>
                        toggleStatus(especialidade.id, especialidade.ativo)
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingId(especialidade.id)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteEspecialidade(especialidade.id)}
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
        <EditEspecialidadeDialog
          especialidadeId={editingId}
          open={!!editingId}
          onOpenChange={(open) => !open && setEditingId(null)}
          onSuccess={() => fetchEspecialidades()}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Especialidade"
        description={`Tem certeza que deseja excluir a especialidade "${especialidadeToDelete?.nome}"? Esta ação não pode ser desfeita.`}
      />
    </MainLayout>
  );
};

export default Especialidades;
