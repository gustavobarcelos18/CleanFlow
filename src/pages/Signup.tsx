import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, User, Building2, Home, Mail, Eye, EyeOff } from "lucide-react";
import { OnboardingProfessional } from "@/components/onboarding/OnboardingProfessional";
import { OnboardingClinica } from "@/components/onboarding/OnboardingClinica";

import { OnboardingMultiUnidade } from "@/components/onboarding/OnboardingMultiUnidade";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";
const signupSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email({
        message: "E-mail inválido",
      })
      .max(255, {
        message: "E-mail muito longo",
      }),
    password: z
      .string()
      .min(6, {
        message: "A senha deve ter pelo menos 6 caracteres",
      })
      .max(100, {
        message: "Senha muito longa",
      }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
type UserType = "professional" | "clinic" | "multiunit" | null;
type Step = "credentials" | "selectType";
const Signup = () => {
  const [step, setStep] = useState<Step>("credentials");
  const [userType, setUserType] = useState<UserType>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // If already logged in, skip to type selection
  useEffect(() => {
    const checkUser = async () => {
      if (user) {
        console.log("[Signup] Usuário já logado, verificando se tem tenant:", {
          userId: user.id,
          email: user.email,
          provider: user.app_metadata?.provider,
          createdAt: user.created_at
        });

        // Add delay for social login to ensure profile creation
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verificar se o usuário já tem um profile e tenant
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .maybeSingle();

        console.log("[Signup] Profile do usuário:", { profile, error: profileError });

        if (profile?.tenant_id) {
          console.log("[Signup] Usuário já tem tenant, redirecionando para dashboard");
          navigate("/dashboard");
        } else {
          // Check if user is old (more than 1 hour) without completing registration
          const userCreatedAt = new Date(user.created_at);
          const hoursSinceCreation = (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60);

          if (hoursSinceCreation > 1) {
            console.log("[Signup] Usuário antigo sem cadastro completo, removendo conta");
            toast.error("Sessão expirada. Por favor, crie uma nova conta.");
            await supabase.auth.signOut();
            setStep("credentials");
          } else {
            console.log("[Signup] Usuário sem tenant, indo para seleção de tipo");
            setStep("selectType");
          }
        }
      }
    };

    checkUser();
  }, [user, navigate]);
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = signupSchema.safeParse({
      email,
      password,
      confirmPassword,
    });
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    console.log("[Signup] Iniciando criação de conta com email/senha");

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/signup`,
      },
    });

    console.log("[Signup] Resposta do signUp:", {
      user: data?.user?.id,
      session: data?.session?.access_token ? "presente" : "ausente",
      error: error?.message
    });

    if (error) {
      console.error("[Signup] Erro ao criar conta:", error);
      toast.error("Erro ao criar conta: " + error.message);
      setLoading(false);
    } else {
      console.log("[Signup] Conta criada com sucesso");
      toast.success("Conta criada com sucesso!");
      setStep("selectType");
      setLoading(false);
    }
  };

  // Show onboarding flow based on selected type
  if (userType === "professional") {
    return <OnboardingProfessional onBack={() => setUserType(null)} />;
  }
  if (userType === "clinic") {
    return <OnboardingClinica onBack={() => setUserType(null)} />;
  }

  if (userType === "multiunit") {
    return <OnboardingMultiUnidade onBack={() => setUserType(null)} />;
  }

  // Show credentials form
  if (step === "credentials") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5">
        <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-foreground">CleanFlow</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 pt-32 pb-20">
          <Card className="max-w-md mx-auto p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Criar Conta</h1>
              <p className="text-muted-foreground">Comece gratuitamente no CleanFlow</p>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary-hover" disabled={loading}>
                {loading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou cadastre-se com</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={async () => {
                  console.log("[Signup] Iniciando login com Google");
                  setLoading(true);

                  const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: {
                      redirectTo: `${window.location.origin}/signup`,
                      queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                      }
                    },
                  });

                  console.log("[Signup] Resposta do Google OAuth:", {
                    url: data?.url,
                    provider: data?.provider,
                    error: error?.message
                  });

                  if (error) {
                    console.error("[Signup] Erro no Google OAuth:", error);
                    toast.error("Erro ao fazer cadastro: " + error.message);
                    setLoading(false);
                  }
                  // Note: user will be redirected to Google, then back to /signup
                  // The useEffect will check if they have a tenant and redirect accordingly
                }}
                disabled={loading}
                className="w-full"
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
                Google
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  console.log("[Signup] Iniciando login com Microsoft");
                  setLoading(true);

                  const { data, error } = await supabase.auth.signInWithOAuth({
                    provider: "azure",
                    options: {
                      redirectTo: `${window.location.origin}/signup`,
                      queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                      }
                    },
                  });

                  console.log("[Signup] Resposta do Microsoft OAuth:", {
                    url: data?.url,
                    provider: data?.provider,
                    error: error?.message
                  });

                  if (error) {
                    console.error("[Signup] Erro no Microsoft OAuth:", error);
                    toast.error("Erro ao fazer cadastro: " + error.message);
                    setLoading(false);
                  }
                  // Note: user will be redirected to Microsoft, then back to /signup
                  // The useEffect will check if they have a tenant and redirect accordingly
                }}
                disabled={loading}
                className="w-full"
              >
                <Mail className="mr-2 h-4 w-4" />
                Microsoft
              </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Já tem uma conta?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Faça login aqui
              </Link>
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Show type selection
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5">
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">CleanFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Como você deseja usar o CleanFlow?</h1>
            <p className="text-xl text-muted-foreground">Escolha o tipo que melhor se adequa ao seu negócio</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              className="p-8 cursor-pointer hover:shadow-medical transition-all hover:border-primary border-2 border-transparent"
              onClick={() => setUserType("professional")}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">Profissional</h2>
                <p className="text-muted-foreground">
                  Para quem atende sozinho. Ideal para médico, dentista, psicólogo, fisioterapeuta, esteticista, personal e todo profissional que atende com hora marcada.
                </p>
                <Button className="w-full bg-primary hover:bg-primary-hover">Começar</Button>
              </div>
            </Card>

            <Card
              className="p-8 cursor-pointer hover:shadow-medical transition-all hover:border-primary border-2 border-transparent"
              onClick={() => setUserType("clinic")}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">
                  Clínica / Empresa
                  <span className="block text-lg font-normal mt-1">(1 unidade)</span>
                </h2>
                <p className="text-muted-foreground">
                  Vários profissionais em um só lugar. Agendas e controle financeiro por profissional ou por sala/equipamento, confirmações automáticas e relatórios claros para decidir rápido.
                </p>
                <Button className="w-full bg-primary hover:bg-primary-hover">Começar</Button>
              </div>
            </Card>

            <Card
              className="p-8 cursor-pointer hover:shadow-medical transition-all hover:border-success border-2 border-transparent relative overflow-hidden"
              onClick={() => setUserType("multiunit")}
            >
              <div className="absolute top-2 right-2">
                <Badge className="bg-success text-success-foreground">PRO</Badge>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-success" />
                </div>
                <h2 className="text-2xl font-semibold text-foreground">Múltiplas Unidades</h2>
                <p className="text-muted-foreground">
                  Gestão central com relatórios por unidade e consolidados. Rede, franquia ou empresa com filiais? Controle tudo em um painel: regras por unidade, mensagens automáticas por número local, transferência de agendas e visão 360 do grupo.
                </p>
                <Button className="w-full bg-success hover:bg-success/90">Começar</Button>
              </div>
            </Card>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Faça login aqui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Signup;
