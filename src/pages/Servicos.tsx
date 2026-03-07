import React, { useState, useEffect, useCallback } from "react";
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
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { NewServiceDialog } from "@/components/schedule/NewServiceDialog";
import { EditServiceDialog } from "@/components/schedule/EditServiceDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface Service {
  id: string;
  nome: string;
  duracao_minutos: number;
  preco: number | null;
  ativo: boolean;
  confirmacao_24h: boolean;
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
    // Importar validação
    const { validateServicoDelete } = await import("@/lib/deleteValidation");

    // Validar antes de excluir
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Serviços da Clínica
            </h1>
            <p className="text-muted-foreground">
              Gerencie os serviços oferecidos e configurações de agendamento (
              {services.length})
            </p>
          </div>
          {!isLoading && services.length > 0 && (
            <NewServiceDialog onSuccess={() => fetchServices()} />
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Estatísticas dos Serviços */}
        {!isLoading && filteredServices.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Estatísticas dos Serviços
            </h3>
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
          </Card>
        )}

        {/* Lista de Serviços */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12">
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
          <div className="grid gap-4">
            {filteredServices.map((service) => (
              <Card key={service.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-light rounded-lg">
                      <Settings className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {service.nome}
                      </h3>
                      {service.confirmacao_24h && (
                        <div className="flex items-center gap-1 mt-1">
                          <CheckCircle2 className="h-3 w-3 text-success" />
                          <p className="text-xs text-muted-foreground">
                            Confirmação 24h antes
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {service.duracao_minutos} minutos
                    </span>
                  </div>
                  {service.preco && service.preco > 0 && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        R$ {service.preco.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
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
              </Card>
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
