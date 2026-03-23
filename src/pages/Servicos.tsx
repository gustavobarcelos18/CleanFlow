import React, { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
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
  Search,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLayoutTitle } from "@/hooks/useLayoutTitle";
import { NewServiceDialog } from "@/components/schedule/NewServiceDialog";
import { EditServiceDialog } from "@/components/schedule/EditServiceDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface Service {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco: number | null;
  ativo: boolean;
  confirmacao_24h?: boolean;
  created_at: string;
}

const Servicos = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const { toast } = useToast();
  const { setTitle, setSubtitle } = useLayoutTitle();

  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .order("nome");

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os serviços.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    setTitle("Serviços");
    setSubtitle("Gerencie os serviços oferecidos e configurações de agendamento");
  }, [setTitle, setSubtitle]);

  const toggleServiceStatus = async (
    serviceId: string,
    currentStatus: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("servicos")
        .update({ ativo: !currentStatus })
        .eq("id", serviceId);

      if (error) throw error;

      setServices((prev) =>
        prev.map((service) =>
          service.id === serviceId
            ? { ...service, ativo: !currentStatus }
            : service,
        ),
      );

      toast({
        title: "Status atualizado",
        description: `Serviço ${!currentStatus ? "ativado" : "desativado"} com sucesso.`,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do serviço.",
        variant: "destructive",
      });
    }
  };

  const deleteService = async (serviceId: string) => {
    const { validateServicoDelete } = await import("@/lib/deleteValidation");

    const validation = await validateServicoDelete(serviceId);

    if (!validation.canDelete) {
      toast({
        title: "Não é possível excluir",
        description: validation.message,
        variant: "destructive",
        duration: 10000,
      });
      return;
    }

    const service = services.find((s) => s.id === serviceId);
    if (service) {
      setServiceToDelete(service);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;

    try {
      const { error } = await supabase
        .from("servicos")
        .delete()
        .eq("id", serviceToDelete.id);

      if (error) throw error;

      setServices((prev) =>
        prev.filter((service) => service.id !== serviceToDelete.id),
      );

      toast({
        title: "Serviço excluído",
        description: "O serviço foi removido com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o serviço.",
        variant: "destructive",
      });
    } finally {
      setServiceToDelete(null);
    }
  };

  const filteredServices = services.filter((s) =>
    s.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const activeServices = filteredServices.filter((s) => s.ativo);
  const avgDuration =
    filteredServices.length > 0
      ? Math.round(
          filteredServices.reduce((acc, s) => acc + s.duracao_minutos, 0) /
            filteredServices.length,
        )
      : 0;
  const totalRevenue = filteredServices
    .filter((s) => s.preco)
    .reduce((acc, s) => acc + (s.preco || 0), 0);

  return (
    <MainLayout>
      <div className="space-y-6 animate-in fade-in duration-500 pb-10">
        {/* Slim Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card/30 backdrop-blur-md border border-muted/50 p-4 rounded-xl shadow-sm">
          <div className="relative flex-1 w-full max-w-[560px] min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-muted/50 focus-visible:ring-primary/20 h-10 w-full"
            />
          </div>
          <div className="shrink-0 w-full sm:w-auto">
            <NewServiceDialog onSuccess={() => fetchServices()} />
          </div>
        </div>

        {/* Estatísticas */}
        {!isLoading && filteredServices.length > 0 && (
          <div className="bg-muted/30 rounded-xl border border-muted/50 p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Estatísticas</p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {activeServices.length}
                </p>
                <p className="text-sm text-muted-foreground">Serviços Ativos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">
                  {avgDuration} min
                </p>
                <p className="text-sm text-muted-foreground">Duração Média</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-warning">
                  R$ {totalRevenue.toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Receita Potencial
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">
                  {services.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  Total de Serviços
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Serviços */}
        {isLoading ? (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-50" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-muted/50 rounded-xl bg-muted/10">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm
                ? "Nenhum serviço encontrado"
                : "Nenhum serviço cadastrado"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm
                ? "Tente uma busca diferente"
                : "Comece adicionando os serviços médicos e exames oferecidos"}
            </p>
            {!searchTerm && (
              <NewServiceDialog onSuccess={() => fetchServices()} />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className={filteredServices.length === 1 ? "sm:col-span-2 xl:col-span-3 max-w-2xl mx-auto w-full" : ""}
              >
                <div className="bg-muted/30 rounded-xl border border-muted/50 p-5 transition-colors hover:bg-muted/50 h-full">
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 bg-primary-light rounded-lg shrink-0">
                        <Settings className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-foreground truncate">
                          {service.nome}
                        </h3>
                        {!!service.confirmacao_24h && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                            <p className="text-xs text-muted-foreground truncate">
                              Confirmação 24h antes
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={service.ativo ? "default" : "secondary"}>
                        {service.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                      <Switch
                        checked={service.ativo}
                        onCheckedChange={() =>
                          toggleServiceStatus(service.id, service.ativo)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate">
                        {service.duracao_minutos} minutos
                      </span>
                    </div>
                    {service.preco && service.preco > 0 && (
                      <div className="flex items-center gap-2 min-w-0">
                        <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">
                          R$ {service.preco.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground truncate">
                      Criado em{" "}
                      {new Date(service.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(service.id)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteService(service.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingId && (
        <EditServiceDialog
          serviceId={editingId}
          open={!!editingId}
          onOpenChange={(open) => !open && setEditingId(null)}
          onSuccess={() => fetchServices()}
        />
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Serviço"
        description={`Tem certeza que deseja excluir o serviço "${serviceToDelete?.nome}"? Esta ação não pode ser desfeita.`}
      />
    </MainLayout>
  );
};

export default Servicos;
