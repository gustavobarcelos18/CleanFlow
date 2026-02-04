import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Search, UserPlus, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { NewSupportUserDialog } from "./NewSupportUserDialog";
import { EditSupportUserDialog } from "./EditSupportUserDialog";

interface SupportUser {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  status: string;
  funcoes: string[];
  foto_url?: string;
  forcar_troca_senha: boolean;
  created_at: string;
}

export const SupportTeamManagement = () => {
  const [supportUsers, setSupportUsers] = useState<SupportUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  useEffect(() => {
    loadSupportUsers();
  }, []);

  const loadSupportUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("usuarios_suporte")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSupportUsers(data || []);
    } catch (error) {
      console.error("Error loading support users:", error);
      toast.error("Erro ao carregar equipe de suporte");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      await supabase.rpc("reset_support_user_password", {
        p_usuario_id: userId
      });

      toast.success("Instruções de reset de senha enviadas por email");
      loadSupportUsers();
    } catch (error: any) {
      console.error("Error resetting password:", error);
      toast.error(error.message || "Erro ao resetar senha");
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ativo' ? 'suspenso' : 'ativo';
      const { error } = await supabase
        .from("usuarios_suporte")
        .update({ status: newStatus })
        .eq("id", userId);

      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("support_actions_log").insert({
          support_user_id: user.id,
          action_type: "usuario_editado",
          target_type: "usuarios_suporte",
          target_id: userId,
          description: `Status do usuário alterado para ${newStatus}`,
        });
      }

      toast.success("Status atualizado com sucesso");
      loadSupportUsers();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const filteredUsers = supportUsers.filter(user => 
    user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <NewSupportUserDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        onSuccess={loadSupportUsers}
      />

      <EditSupportUserDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        userId={editingUserId || ""}
        onSuccess={loadSupportUsers}
      />

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Usuários de Suporte</h2>
          <Button onClick={() => setNewDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Carregando...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Nenhum membro encontrado</p>
        ) : (
          <div className="space-y-2">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{user.nome}</h3>
                      <Badge variant="outline">{user.funcoes.join(", ")}</Badge>
                      <Badge variant={user.status === 'ativo' ? "default" : "secondary"}>
                        {user.status}
                      </Badge>
                      {user.forcar_troca_senha && (
                        <Badge variant="destructive">Trocar Senha</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {user.telefone && (
                      <p className="text-sm text-muted-foreground">{user.telefone}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResetPassword(user.id)}
                    >
                      <KeyRound className="h-4 w-4 mr-2" />
                      Reset Senha
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingUserId(user.id);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant={user.status === 'ativo' ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleUserStatus(user.id, user.status)}
                    >
                      {user.status === 'ativo' ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </>
  );
};