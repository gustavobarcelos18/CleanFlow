import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Loader2 } from "lucide-react";

export default function AdminSignupMaster() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("barcelos32@gmail.com");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email !== "barcelos32@gmail.com") {
      toast.error("Este formulário é apenas para o usuário master");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres");
      return;
    }

    setLoading(true);

    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("usuarios_suporte")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (existingUser) {
        toast.error("Usuário master já existe. Faça login.");
        navigate("/admin/login");
        return;
      }

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin/login`
        }
      });

      if (authError) {
        toast.error("Erro ao criar conta: " + authError.message);
        return;
      }

      if (!authData.user) {
        toast.error("Erro ao criar conta");
        return;
      }

      // The trigger will automatically create the usuarios_suporte record
      toast.success("Conta master criada com sucesso! Você será redirecionado para fazer login.");
      
      // Sign out and redirect to login
      await supabase.auth.signOut();
      setTimeout(() => {
        navigate("/admin/login");
      }, 2000);
    } catch (error) {
      console.error("Error during signup:", error);
      toast.error("Erro ao criar conta");
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
          <CardTitle className="text-2xl font-bold">Criar Conta Master</CardTitle>
          <CardDescription>
            Configuração inicial do usuário administrador master
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar Senha</Label>
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
                  Criando conta...
                </>
              ) : (
                "Criar Conta Master"
              )}
            </Button>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => navigate("/admin/login")}
                disabled={loading}
              >
                Já tem uma conta? Fazer login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
