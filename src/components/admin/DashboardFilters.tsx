import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { useDashboardPreferences, DashboardFilters as Filters } from "@/hooks/useDashboardPreferences";

interface Tenant {
  id: string;
  nome: string;
}

export const DashboardFilters = () => {
  const { filters, updateFilters } = useDashboardPreferences();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [localFilters, setLocalFilters] = useState<Filters>(filters);

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const loadTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, nome')
        .order('nome');

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error loading tenants:', error);
    }
  };

  const handleApplyFilters = () => {
    updateFilters(localFilters);
  };

  const handleClearFilters = () => {
    const emptyFilters = {};
    setLocalFilters(emptyFilters);
    updateFilters(emptyFilters);
  };

  const hasActiveFilters = Object.keys(localFilters).length > 0;

  return (
    <Card className="p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Filtros Rápidos</h3>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tenant-filter">Tenant</Label>
          <Select
            value={localFilters.tenant_id || "all"}
            onValueChange={(value) => {
              const newFilters = { ...localFilters };
              if (value === "all") {
                delete newFilters.tenant_id;
              } else {
                newFilters.tenant_id = value;
              }
              setLocalFilters(newFilters);
            }}
          >
            <SelectTrigger id="tenant-filter">
              <SelectValue placeholder="Todos os tenants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tenants</SelectItem>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority-filter">Prioridade</Label>
          <Select
            value={localFilters.priority || "all"}
            onValueChange={(value) => {
              const newFilters = { ...localFilters };
              if (value === "all") {
                delete newFilters.priority;
              } else {
                newFilters.priority = value;
              }
              setLocalFilters(newFilters);
            }}
          >
            <SelectTrigger id="priority-filter">
              <SelectValue placeholder="Todas as prioridades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as prioridades</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status-filter">Estado</Label>
          <Select
            value={localFilters.status || "all"}
            onValueChange={(value) => {
              const newFilters = { ...localFilters };
              if (value === "all") {
                delete newFilters.status;
              } else {
                newFilters.status = value;
              }
              setLocalFilters(newFilters);
            }}
          >
            <SelectTrigger id="status-filter">
              <SelectValue placeholder="Todos os estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="open">Novo</SelectItem>
              <SelectItem value="in_progress">Em Atendimento</SelectItem>
              <SelectItem value="resolved">Resolvido</SelectItem>
              <SelectItem value="closed">Fechado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button onClick={handleApplyFilters} className="w-full mt-4">
        Aplicar Filtros
      </Button>
    </Card>
  );
};
