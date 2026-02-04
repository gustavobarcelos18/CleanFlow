import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminChangePassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const firstLogin = location.state?.firstLogin || false;
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const logAuthEvent = async (tipoEvento: string, descricao: string | null = null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: supportUser } = await supabase
        .from("usuarios_suporte")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (supportUser) {
        await supabase.rpc("log_admin_auth_event", {
          p_usuario_id: supportUser.id,
          p_tipo_evento: tipoEvento,
          p_descricao: descricao,
          p_ip_address: null,
          p_user_agent: navigator.userAgent,
          p_metadata: {}
        });
      }
    } catch (error) {
      console.error("Error logging auth event:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter pelo menos 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        navigate("/admin/login");
        return;
      }

      // Update password in Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        await logAuthEvent("troca_senha", `Falha ao trocar senha: ${updateError.message}`);
        toast.error("Erro ao alterar senha: " + updateError.message);
        return;
      }

      // Update forcar_troca_senha flag if this is first login
      if (firstLogin) {
        const { error: updateUserError } = await supabase
          .from("usuarios_suporte")
          .update({ forcar_troca_senha: false })
          .eq("auth_user_id", user.id);

        if (updateUserError) {
          console.error("Error updating forcar_troca_senha:", updateUserError);
        }
      }

      await logAuthEvent("troca_senha", "Senha alterada com sucesso");
      toast.success("Senha alterada com sucesso!");
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("Error changing password:", error);
      await logAuthEvent("troca_senha", "Erro ao trocar senha");
      toast.error("Erro ao alterar senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Alterar Senha</CardTitle>
          <CardDescription>
            {firstLogin ? "Por segurança, altere sua senha agora" : "Defina uma nova senha para sua conta"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {firstLogin && (
            <Alert className="mb-4">
              <AlertDescription>
                Esta é sua primeira vez acessando o sistema. Por favor, altere sua senha antes de continuar.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!firstLogin && (
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required={!firstLogin}
                  disabled={loading}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                "Alterar Senha"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
