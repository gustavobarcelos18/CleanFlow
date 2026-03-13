import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Shield, FileX, ArrowRight, Activity } from "lucide-react";
import { NewPlanoSaudeDialog } from "@/components/planos/NewPlanoSaudeDialog";
import { EditPlanoSaudeDialog } from "@/components/planos/EditPlanoSaudeDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PlanoSaude {
  id: string;
  nome: string;
  observacoes: string | null;
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

  const handleDelete = async (id: string) => {
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

  return (
    <MainLayout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-[1400px] mx-auto px-4 md:px-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-muted/30 pb-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-300 dark:to-gray-600 pr-2 pb-1">
              Planos de Saúde
            </h1>
            <p className="text-muted-foreground font-medium">
              Gerencie os convênios e planos aceitos pela clínica
            </p>
          </div>
          <NewPlanoSaudeDialog onSuccess={fetchPlanos}>
            <Button className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-6 rounded-xl group">
              <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
              Novo Plano
            </Button>
          </NewPlanoSaudeDialog>
        </div>

        {/* Search and Filters Section */}
        <div className="relative group max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <Input
            placeholder="Buscar por nome do convênio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 bg-muted/20 border-muted/50 rounded-xl shadow-sm focus-visible:ring-primary focus-visible:ring-offset-0 transition-all text-base placeholder:text-muted-foreground/60 w-full"
          />
        </div>

        {/* content Section */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="rounded-xl border-muted/40 shadow-sm bg-muted/30">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full rounded-md" />
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Skeleton className="h-9 flex-1 rounded-xl" />
                    <Skeleton className="h-9 flex-1 rounded-xl" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPlanos.length === 0 ? (
          <Card className="rounded-xl border-dashed border border-muted/50 bg-muted/10">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="p-6 bg-muted/30 rounded-full shadow-inner mb-6 border border-muted/40">
                <FileX className="h-12 w-12 text-muted-foreground/30" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">
                {searchTerm ? "Nenhum plano encontrado" : "Nenhum plano cadastrado ainda"}
              </h3>
              <p className="text-muted-foreground max-w-xs mb-8">
                {searchTerm 
                  ? "Tente ajustar sua busca para encontrar o que procura."
                  : "Comece cadastrando os convênios que sua clínica atende."}
              </p>
              {!searchTerm && (
                <NewPlanoSaudeDialog onSuccess={fetchPlanos}>
                  <Button className="shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-8 rounded-xl group">
                    <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
                    Cadastrar Primeiro Plano
                  </Button>
                </NewPlanoSaudeDialog>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {filteredPlanos.map((plano) => (
              <Card 
                key={plano.id} 
                className={cn(
                  "group relative rounded-xl border border-muted/50 bg-muted/30 overflow-hidden transition-all duration-300 hover:shadow-md hover:bg-muted/50",
                  !plano.ativo && "grayscale-[0.4] bg-muted/10 opacity-80"
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                       <div className={cn(
                        "p-2 rounded-xl border transition-colors",
                        plano.ativo ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-muted border-border/50 text-muted-foreground"
                      )}>
                        <Shield className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                        {plano.nome}
                      </CardTitle>
                    </div>
                    <Badge 
                      className={cn(
                        "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        plano.ativo 
                          ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20 shadow-sm" 
                          : "bg-muted text-muted-foreground border-muted/50"
                      )}
                    >
                      {plano.ativo ? "ATIVO" : "INATIVO"}
                    </Badge>
                  </div>
                  {plano.observacoes && (
                    <CardDescription className="line-clamp-2 text-sm leading-relaxed text-muted-foreground min-h-[2.5rem]">
                      {plano.observacoes}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0 pb-6 mt-auto">
                  <div className="flex items-center gap-2 pt-4 border-t border-muted/40">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(plano.id)}
                      className="flex-1 rounded-xl h-10 font-semibold border-muted/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all gap-2"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(plano.id)}
                      className="flex-1 rounded-xl h-10 font-semibold border-muted/60 text-muted-foreground hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30 transition-all gap-2"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
