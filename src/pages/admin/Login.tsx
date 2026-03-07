import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, Loader2, Eye, EyeOff } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const checkSupportUserAndRedirect = useCallback(
    async (userId: string) => {
      try {
        const { data: supportUser, error } = await (supabase
          .from("system_users" as any)
          .select("*")
          .eq("id", userId)
          .maybeSingle() as any);

        if (error) {
          console.error("Error fetching support user:", error);
          return;
        }

        if (!supportUser) {
          // If user doesn't have support permissions, sign them out
          await supabase.auth.signOut();
          toast.error("Acesso negado: você não tem permissões de suporte");
          return;
        }

        if (!supportUser.active) {
          await logAuthEvent(
            supportUser.id,
            "login_falha",
            "Conta de suporte inativa",
          );
          await supabase.auth.signOut();
          toast.error("Acesso negado: sua conta está inativa");
          return;
        }

        // Log successful login
        await logAuthEvent(
          supportUser.id,
          "login_sucesso",
          "Login OAuth realizado com sucesso",
        );

        toast.success("Login realizado com sucesso!");
        navigate("/admin");
      } catch (error) {
        console.error("Error in checkSupportUserAndRedirect:", error);
      }
    },
    [navigate],
  );

  const checkExistingAuth = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await checkSupportUserAndRedirect(user.id);
        return;
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    } finally {
      setCheckingAuth(false);
    }
  }, [checkSupportUserAndRedirect]);

  useEffect(() => {
    checkExistingAuth();

    // Listen for auth state changes (OAuth callback)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        await checkSupportUserAndRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [checkExistingAuth, checkSupportUserAndRedirect]);

  const logAuthEvent = async (
    usuarioId: string | null,
    tipoEvento: string,
    descricao: string | null = null,
  ) => {
    try {
      await (supabase.rpc("log_admin_auth_event" as any, {
        p_usuario_id: usuarioId,
        p_tipo_evento: tipoEvento,
        p_descricao: descricao,
        p_ip_address: null,
        p_user_agent: navigator.userAgent,
        p_metadata: {},
      }) as any);
    } catch (error) {
      console.error("Error logging auth event:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        await logAuthEvent(
          null,
          "login_falha",
          `Falha de autenticação: ${authError.message}`,
        );
        toast.error("Erro ao fazer login: " + authError.message);
        return;
      }

      if (!authData.user) {
        await logAuthEvent(null, "login_falha", "Usuário não encontrado");
        toast.error("Erro ao fazer login");
        return;
      }

      // Check if user is a support user
      const { data: supportUser, error: supportError } = await (supabase
        .from("system_users" as any)
        .select("*")
        .eq("id", authData.user.id)
        .maybeSingle() as any);

      if (supportError) {
        console.error("Error fetching support user:", supportError);
        await supabase.auth.signOut();
        toast.error("Erro ao verificar permissões");
        return;
      }

      if (!supportUser) {
        await logAuthEvent(
          null,
          "login_falha",
          "Usuário não é um usuário de suporte",
        );
        await supabase.auth.signOut();
        toast.error("Acesso negado: você não tem permissões de suporte");
        return;
      }

      if (!supportUser.active) {
        await logAuthEvent(
          supportUser.id,
          "login_falha",
          "Conta de suporte inativa ou suspensa",
        );
        await supabase.auth.signOut();
        toast.error("Acesso negado: sua conta está inativa");
        return;
      }

      // Log successful login
      await logAuthEvent(
        supportUser.id,
        "login_sucesso",
        "Login realizado com sucesso",
      );

      toast.success("Login realizado com sucesso!");
      navigate("/admin");
      return;
    } catch (error) {
      console.error("Error during login:", error);
      await logAuthEvent(null, "login_falha", "Erro inesperado durante login");
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/admin`,
        },
      });

      if (error) {
        toast.error("Erro ao fazer login com Google: " + error.message);
        setLoading(false);
      }
      // Don't set loading to false here, as user will be redirected
    } catch (error) {
      console.error("Error during Google login:", error);
      toast.error("Erro ao fazer login com Google");
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">CleanFlow Admin</CardTitle>
          <CardDescription>
            Faça login para acessar o painel administrativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={loading}
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Lembrar de mim
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Ou continue com
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? "Entrando..." : "Entrar com Google"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
