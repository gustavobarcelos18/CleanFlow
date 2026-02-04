import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Mail, Building2, Users, User, Eye, EyeOff } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "E-mail inválido" }).max(255, { message: "E-mail muito longo" }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }).max(100, { message: "Senha muito longa" })
});

interface ManagerRole {
  type: 'user' | 'unit_manager' | 'org_manager';
  unitId?: string;
  unitName?: string;
  organizationId?: string;
  organizationName?: string;
}

interface UserOrgInfo {
  organizationId: string;
  organizationName: string;
  units: { id: string; name: string }[];
  isOrgAdmin: boolean;
  unitRoles: { unitId: string; role: string }[];
}

const Login = () => {
  const [email, setEmail] = useState(() => localStorage.getItem("cleanflow_remember_email") || "");
  const [password, setPassword] = useState(() => localStorage.getItem("cleanflow_remember_password") || "");
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem("cleanflow_remember_email"));
  const [loading, setLoading] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [userOrgInfo, setUserOrgInfo] = useState<UserOrgInfo | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const checkUserOrganizationRoles = async (userId: string): Promise<UserOrgInfo | null> => {
    try {
      // Check if user has organization roles
      const { data: roles, error: rolesError } = await (supabase
        .from('user_unit_roles' as any)
        .select(`
          role,
          organization_id,
          unit_id,
          organizations:organization_id (nome_fantasia),
          units:unit_id (nome_unidade)
        `)
        .eq('user_id', userId) as any);

      if (rolesError || !roles || roles.length === 0) {
        return null;
      }

      const orgAdminRole = roles.find(r => r.role === 'org_admin' && !r.unit_id);

      if (orgAdminRole && orgAdminRole.organization_id) {
        // Fetch all units for this organization
        const { data: units } = await (supabase
          .from('units' as any)
          .select('id, nome_unidade')
          .eq('organization_id', orgAdminRole.organization_id)
          .eq('status', 'ativo') as any);

        const orgName = (orgAdminRole.organizations as any)?.nome_fantasia || 'Organização';

        return {
          organizationId: orgAdminRole.organization_id,
          organizationName: orgName,
          units: units?.map(u => ({ id: u.id, name: u.nome_unidade })) || [],
          isOrgAdmin: true,
          unitRoles: roles.filter(r => r.unit_id).map(r => ({
            unitId: r.unit_id!,
            role: r.role
          }))
        };
      }

      // Check if user has unit-level roles
      const unitRoles = roles.filter(r => r.unit_id);
      if (unitRoles.length > 0) {
        const firstUnit = unitRoles[0];
        const orgName = (firstUnit.organizations as any)?.nome_fantasia || 'Organização';

        return {
          organizationId: firstUnit.organization_id!,
          organizationName: orgName,
          units: unitRoles.map(r => ({
            id: r.unit_id!,
            name: (r.units as any)?.nome_unidade || 'Unidade'
          })),
          isOrgAdmin: false,
          unitRoles: unitRoles.map(r => ({
            unitId: r.unit_id!,
            role: r.role
          }))
        };
      }

      return null;
    } catch (error) {
      console.error('Error checking organization roles:', error);
      return null;
    }
  };

  const handleRoleSelection = (role: ManagerRole, savePreference = true) => {
    // Store the selected role in sessionStorage for the app to use
    sessionStorage.setItem('cleanflow_access_mode', JSON.stringify(role));

    // Save preference to localStorage for future logins
    if (savePreference) {
      localStorage.setItem('cleanflow_role_preference', JSON.stringify(role));
    }

    setShowRoleSelector(false);

    if (role.type === 'org_manager') {
      navigate('/organization-manager');
    } else if (role.type === 'unit_manager' && role.unitId) {
      sessionStorage.setItem('cleanflow_current_unit', role.unitId);
      navigate('/dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);

    try {
      const { data: isLocked } = await (supabase.rpc('check_account_lock' as any, { p_email: email }) as any);

      if (isLocked) {
        toast.error("Conta bloqueada temporariamente devido a múltiplas tentativas falhadas");
        await (supabase.rpc('log_login_attempt' as any, {
          p_email: email,
          p_success: false,
          p_failure_reason: 'Account locked'
        }) as any);
        setLoading(false);
        return;
      }

      const { error } = await signIn(email, password);

      if (error) {
        await (supabase.rpc('log_login_attempt' as any, {
          p_email: email,
          p_success: false,
          p_failure_reason: error.message
        }) as any);
        toast.error("Erro ao fazer login: " + error.message);
        setLoading(false);
      } else {
        await (supabase.rpc('log_login_attempt' as any, {
          p_email: email,
          p_success: true
        }) as any);

        if (rememberMe) {
          localStorage.setItem("cleanflow_remember_email", email);
          localStorage.setItem("cleanflow_remember_password", password);
        } else {
          localStorage.removeItem("cleanflow_remember_email");
          localStorage.removeItem("cleanflow_remember_password");
        }

        // Check if user is a manager
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const orgInfo = await checkUserOrganizationRoles(user.id);

          if (orgInfo && (orgInfo.isOrgAdmin || orgInfo.units.length > 1)) {
            // Check for saved role preference
            const savedPreference = localStorage.getItem('cleanflow_role_preference');
            if (savedPreference) {
              try {
                const preference = JSON.parse(savedPreference) as ManagerRole;
                // Validate the preference is still valid for this user
                const isValidPreference =
                  preference.type === 'user' ||
                  (preference.type === 'org_manager' && orgInfo.isOrgAdmin) ||
                  (preference.type === 'unit_manager' && orgInfo.units.some(u => u.id === preference.unitId));

                if (isValidPreference) {
                  toast.success("Login realizado com sucesso!");
                  handleRoleSelection(preference, false);
                  return;
                }
              } catch {
                localStorage.removeItem('cleanflow_role_preference');
              }
            }

            setUserOrgInfo(orgInfo);
            setShowRoleSelector(true);
            setLoading(false);
            return;
          }
        }

        toast.success("Login realizado com sucesso!");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'azure') => {
    try {
      console.log(`[Login] Iniciando login com ${provider}`);
      setLoading(true);

      const redirectUrl = `${window.location.origin}/dashboard`;
      console.log(`[Login] Redirect URL: ${redirectUrl}`);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          scopes: provider === 'google'
            ? 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid'
            : undefined,
        }
      });

      console.log(`[Login] Resposta do ${provider} OAuth:`, {
        url: data?.url,
        provider: data?.provider,
        error: error?.message
      });

      if (error) {
        console.error(`[Login] Erro no ${provider} OAuth:`, error);
        toast.error("Erro ao fazer login: " + error.message);
        setLoading(false);
      }
    } catch (error) {
      console.error(`[Login] Exceção no login com ${provider}:`, error);
      toast.error("Erro ao fazer login social");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-success/5">
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">CleanFlow</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="container mx-auto px-4 pt-32 pb-20">
        <Card className="max-w-md mx-auto p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Login</h1>
            <p className="text-muted-foreground">
              Entre na sua conta CleanFlow
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Lembrar de mim
              </Label>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-hover"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Ou continue com
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => handleSocialLogin('google')}
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
              onClick={() => handleSocialLogin('azure')}
              disabled={loading}
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" />
              Microsoft
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Não tem uma conta?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Cadastre-se grátis
            </Link>
          </p>
        </Card>
      </div>

      {/* Role Selection Dialog */}
      <Dialog open={showRoleSelector} onOpenChange={setShowRoleSelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Como deseja acessar o sistema?</DialogTitle>
            <DialogDescription>
              Selecione o modo de acesso para esta sessão
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            <Button
              variant="outline"
              className="w-full justify-start h-auto py-4 px-4"
              onClick={() => handleRoleSelection({ type: 'user' })}
            >
              <User className="h-5 w-5 mr-3 text-muted-foreground" />
              <div className="text-left">
                <div className="font-medium">Acessar como Usuário</div>
                <div className="text-sm text-muted-foreground">
                  Acesso normal ao sistema
                </div>
              </div>
            </Button>

            {userOrgInfo && userOrgInfo.units.length === 1 && (
              <Button
                variant="outline"
                className="w-full justify-start h-auto py-4 px-4"
                onClick={() => handleRoleSelection({
                  type: 'unit_manager',
                  unitId: userOrgInfo.units[0].id,
                  unitName: userOrgInfo.units[0].name
                })}
              >
                <Building2 className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Gestor de Unidade</div>
                  <div className="text-sm text-muted-foreground">
                    {userOrgInfo.units[0].name}
                  </div>
                </div>
              </Button>
            )}

            {userOrgInfo && userOrgInfo.units.length > 1 && (
              <>
                {userOrgInfo.units.map(unit => (
                  <Button
                    key={unit.id}
                    variant="outline"
                    className="w-full justify-start h-auto py-4 px-4"
                    onClick={() => handleRoleSelection({
                      type: 'unit_manager',
                      unitId: unit.id,
                      unitName: unit.name
                    })}
                  >
                    <Building2 className="h-5 w-5 mr-3 text-blue-500" />
                    <div className="text-left">
                      <div className="font-medium">Gestor: {unit.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Gerenciar apenas esta unidade
                      </div>
                    </div>
                  </Button>
                ))}
              </>
            )}

            {userOrgInfo?.isOrgAdmin && (
              <Button
                variant="default"
                className="w-full justify-start h-auto py-4 px-4 bg-primary hover:bg-primary-hover"
                onClick={() => handleRoleSelection({
                  type: 'org_manager',
                  organizationId: userOrgInfo.organizationId,
                  organizationName: userOrgInfo.organizationName
                })}
              >
                <Users className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Gestor Multi-Unidades</div>
                  <div className="text-sm opacity-80">
                    {userOrgInfo.organizationName} ({userOrgInfo.units.length} unidades)
                  </div>
                </div>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
