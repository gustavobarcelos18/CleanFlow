import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Eye,
  Edit,
  Plus,
  XCircle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditTenantDialog } from "./EditTenantDialog";
import { NewTenantDialog } from "./NewTenantDialog";
import { ChangeSegmentDialog } from "./ChangeSegmentDialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Tenant {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  tipo: string;
  status?: string;
  created_at: string;
}

export const TenantManagement = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendTenant, setSuspendTenant] = useState<Tenant | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [changeSegmentOpen, setChangeSegmentOpen] = useState(false);

  const loadTenants = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error("Error loading tenants:", error);
      toast.error("Erro ao carregar tenants");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  const filterTenants = useCallback(() => {
    let filtered = tenants;

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((tenant) => tenant.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (tenant) =>
          tenant.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredTenants(filtered);
  }, [searchTerm, statusFilter, tenants]);

  useEffect(() => {
    filterTenants();
  }, [filterTenants]);

  const handleSuspendTenant = async () => {
    if (!suspendTenant || !suspendReason.trim()) {
      toast.error("Por favor, informe o motivo da suspensão");
      return;
    }

    try {
      const newStatus = suspendTenant.status === "ativo" ? "suspenso" : "ativo";

      const { error } = await supabase
        .from("tenants")
        .update({ status: newStatus })
        .eq("id", suspendTenant.id);

      if (error) throw error;

      await logAction(
        "tenant_status_alterado",
        suspendTenant.id,
        `Tenant ${newStatus}: ${suspendReason}`,
      );

      toast.success(
        `Tenant ${newStatus === "ativo" ? "reativado" : "suspenso"} com sucesso`,
      );
      setSuspendDialogOpen(false);
      setSuspendTenant(null);
      setSuspendReason("");
      loadTenants();
    } catch (error: any) {
      console.error("Error updating tenant status:", error);
      toast.error(error.message || "Erro ao atualizar status do tenant");
    }
  };

  const logAction = async (
    action: string,
    tenantId: string,
    description: string,
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("support_actions_log").insert({
        support_user_id: user.id,
        action_type: action,
        target_type: "tenant",
        target_id: tenantId,
        description,
      });
    }
  };

  return (
    <>
      <NewTenantDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        onSuccess={loadTenants}
      />

      {editingTenantId && (
        <EditTenantDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          tenantId={editingTenantId}
          onSuccess={loadTenants}
        />
      )}

      {selectedTenant && (
        <ChangeSegmentDialog
          open={changeSegmentOpen}
          onOpenChange={setChangeSegmentOpen}
          tenantId={selectedTenant.id}
          onSuccess={() => {
            loadTenants();
            setSelectedTenant(null);
          }}
        />
      )}

      {/* Suspend/Reactivate Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {suspendTenant?.status === "ativo" ? "Suspender" : "Reativar"}{" "}
              Tenant
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tenant</Label>
              <p className="text-sm text-muted-foreground">
                {suspendTenant?.nome}
              </p>
            </div>
            <div>
              <Label htmlFor="reason">Motivo *</Label>
              <Textarea
                id="reason"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder={`Informe o motivo da ${suspendTenant?.status === "ativo" ? "suspensão" : "reativação"}...`}
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSuspendDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant={
                  suspendTenant?.status === "ativo" ? "destructive" : "default"
                }
                onClick={handleSuspendTenant}
              >
                {suspendTenant?.status === "ativo" ? "Suspender" : "Reativar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Tenants</h2>
            <Button onClick={() => setNewDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Tenant
            </Button>
          </div>

          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-full"
          >
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="ativo">Ativos</TabsTrigger>
              <TabsTrigger value="suspenso">Suspensos</TabsTrigger>
              <TabsTrigger value="trial">Trial</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tenants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <p className="text-center py-8 text-muted-foreground">
              Carregando...
            </p>
          ) : filteredTenants.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Nenhum tenant encontrado
            </p>
          ) : (
            <div className="space-y-2">
              {filteredTenants.map((tenant) => (
                <Card key={tenant.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{tenant.nome}</h3>
                        <Badge variant="outline">{tenant.tipo}</Badge>
                        <Badge
                          variant={
                            tenant.status === "ativo"
                              ? "default"
                              : tenant.status === "suspenso"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {tenant.status || "ativo"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {tenant.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Criado em:{" "}
                        {new Date(tenant.created_at).toLocaleDateString(
                          "pt-BR",
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTenant(tenant)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingTenantId(tenant.id);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant={
                          tenant.status === "ativo" ? "destructive" : "default"
                        }
                        size="sm"
                        onClick={() => {
                          setSuspendTenant(tenant);
                          setSuspendDialogOpen(true);
                        }}
                      >
                        {tenant.status === "ativo" ? (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Suspender
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Reativar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Dialog
        open={!!selectedTenant}
        onOpenChange={() => setSelectedTenant(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Tenant</DialogTitle>
          </DialogHeader>
          {selectedTenant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedTenant.nome}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Tipo</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedTenant.tipo}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedTenant.email}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Telefone</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedTenant.telefone}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.setItem(
                      "support_impersonation_tenant_id",
                      selectedTenant.id,
                    );
                    window.location.href = "/dashboard";
                  }}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Acessar Painel
                </Button>
                <Button
                  variant="outline"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                  onClick={() => setChangeSegmentOpen(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Trocar Segmento
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
