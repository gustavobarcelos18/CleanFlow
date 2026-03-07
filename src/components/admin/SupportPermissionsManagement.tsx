import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Save } from "lucide-react";

interface RolePermissions {
  role: string;
  permissions: {
    can_view_tickets: boolean;
    can_respond_tickets: boolean;
    can_close_tickets: boolean;
    can_assign_tickets: boolean;
    can_manage_tenants: boolean;
    can_manage_plans: boolean;
    can_manage_team: boolean;
    can_view_logs: boolean;
  };
}

const defaultPermissions: Record<string, RolePermissions["permissions"]> = {
  support_basic: {
    can_view_tickets: true,
    can_respond_tickets: true,
    can_close_tickets: false,
    can_assign_tickets: false,
    can_manage_tenants: false,
    can_manage_plans: false,
    can_manage_team: false,
    can_view_logs: false,
  },
  support_intermediate: {
    can_view_tickets: true,
    can_respond_tickets: true,
    can_close_tickets: true,
    can_assign_tickets: true,
    can_manage_tenants: false,
    can_manage_plans: false,
    can_manage_team: false,
    can_view_logs: true,
  },
  support: {
    can_view_tickets: true,
    can_respond_tickets: true,
    can_close_tickets: true,
    can_assign_tickets: true,
    can_manage_tenants: true,
    can_manage_plans: true,
    can_manage_team: false,
    can_view_logs: true,
  },
  master: {
    can_view_tickets: true,
    can_respond_tickets: true,
    can_close_tickets: true,
    can_assign_tickets: true,
    can_manage_tenants: true,
    can_manage_plans: true,
    can_manage_team: true,
    can_view_logs: true,
  },
};

export const SupportPermissionsManagement = () => {
  const [permissions, setPermissions] =
    useState<Record<string, RolePermissions["permissions"]>>(
      defaultPermissions,
    );
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPermissions = useCallback(async () => {
    try {
      // Load custom permissions from database if they exist
      const { data, error } = await supabase
        .from("system_users")
        .select("system_role, permissions")
        .not("permissions", "is", null)
        .limit(1);

      if (error) throw error;

      // If no custom permissions, use defaults
      if (!data || data.length === 0) {
        setPermissions(defaultPermissions);
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
    }
  }, []);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  const handlePermissionChange = (
    role: string,
    permission: string,
    value: boolean,
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update all users of each role with their permissions
      for (const [role, perms] of Object.entries(permissions)) {
        const { error } = await supabase
          .from("system_users")
          .update({ permissions: perms as any })
          .eq("system_role", role as any);

        if (error) throw error;
      }

      // Log action
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("support_actions_log").insert({
          support_user_id: user.id,
          action_type: "permissions_update",
          target_type: "system",
          description: "Permissões da equipe de suporte atualizadas",
        });
      }

      toast.success("Permissões atualizadas com sucesso");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Erro ao salvar permissões");
    } finally {
      setSaving(false);
    }
  };

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      support_basic: "Suporte Básico",
      support_intermediate: "Suporte Intermediário",
      support: "Suporte Avançado",
      master: "Master",
    };
    return roleNames[role] || role;
  };

  const getPermissionLabel = (permission: string) => {
    const labels: Record<string, string> = {
      can_view_tickets: "Visualizar Tickets",
      can_respond_tickets: "Responder Tickets",
      can_close_tickets: "Fechar Tickets",
      can_assign_tickets: "Atribuir Tickets",
      can_manage_tenants: "Gerenciar Tenants",
      can_manage_plans: "Gerenciar Planos",
      can_manage_team: "Gerenciar Equipe",
      can_view_logs: "Visualizar Logs",
    };
    return labels[permission] || permission;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Gerenciar Permissões
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Configure as permissões para cada nível de suporte
          </p>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {Object.entries(permissions).map(([role, perms]) => (
          <Card key={role} className="p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {getRoleName(role)}
                {role === "master" && (
                  <Badge variant="destructive">Acesso Total</Badge>
                )}
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(perms).map(([permission, enabled]) => (
                <div key={permission} className="flex items-center space-x-2">
                  <Switch
                    id={`${role}-${permission}`}
                    checked={enabled}
                    onCheckedChange={(value) =>
                      handlePermissionChange(role, permission, value)
                    }
                    disabled={role === "master"}
                  />
                  <Label htmlFor={`${role}-${permission}`} className="text-sm">
                    {getPermissionLabel(permission)}
                  </Label>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};
