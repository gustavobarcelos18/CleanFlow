import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Pencil, Trash2, Search } from "lucide-react";
import { NewPlanoSaudeDialog } from "@/components/planos/NewPlanoSaudeDialog";
import { EditPlanoSaudeDialog } from "@/components/planos/EditPlanoSaudeDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface PlanoSaude {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
}

export default function PlanosSaude() {
  const [planos, setPlanos] = useState<PlanoSaude[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planoToDelete, setPlanoToDelete] = useState<PlanoSaude | null>(null);
  const { toast } = useToast();

  const fetchPlanos = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

      const { data, error } = await supabase
        .from("planos_saude")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .order("nome");

      if (error) throw error;
      setPlanos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar planos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanos();
  }, []);

  const handleDelete = async (id: string, nome: string) => {
    setPlanoToDelete(planos.find((p) => p.id === id) || null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!planoToDelete) return;

    try {
      const { error } = await supabase
        .from("planos_saude")
        .delete()
        .eq("id", planoToDelete.id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Plano excluído com sucesso.",
      });
      fetchPlanos();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir plano",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPlanoToDelete(null);
    }
  };

  const filteredPlanos = planos.filter((plano) =>
    plano.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Planos de Saúde
            </h1>
            <p className="text-muted-foreground">
              Gerencie os planos de saúde aceitos pela clínica
            </p>
          </div>
          <NewPlanoSaudeDialog onSuccess={fetchPlanos}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Plano
            </Button>
          </NewPlanoSaudeDialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar planos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredPlanos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Nenhum plano encontrado"
                  : "Nenhum plano cadastrado"}
              </p>
              {!searchTerm && (
                <NewPlanoSaudeDialog onSuccess={fetchPlanos}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Primeiro Plano
                  </Button>
                </NewPlanoSaudeDialog>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlanos.map((plano) => (
              <Card key={plano.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">
                    {plano.nome}
                  </CardTitle>
                  <Badge variant={plano.ativo ? "default" : "secondary"}>
                    {plano.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plano.descricao && (
                    <p className="text-sm text-muted-foreground">
                      {plano.descricao}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(plano.id)}
                      className="flex-1"
                    >
                      <Pencil className="mr-2 h-3 w-3" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(plano.id, plano.nome)}
                      className="flex-1"
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {editingId && (
          <EditPlanoSaudeDialog
            planoId={editingId}
            open={!!editingId}
            onOpenChange={(open) => !open && setEditingId(null)}
            onSuccess={fetchPlanos}
          />
        )}
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Plano de Saúde"
        description={`Tem certeza que deseja excluir o plano "${planoToDelete?.nome}"? Esta ação não pode ser desfeita.`}
      />
    </MainLayout>
  );
}
