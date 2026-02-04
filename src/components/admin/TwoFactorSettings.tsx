import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface TwoFactorSettings {
  id: string;
  enabled: boolean;
  method: 'totp' | 'sms' | 'email' | null;
  verified_at: string | null;
}

export const TwoFactorSettings = () => {
  const [settings, setSettings] = useState<TwoFactorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_2fa_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as TwoFactorSettings);
      } else {
        // Criar configuração padrão (usando upsert para evitar duplicidade)
        const { data: newSettings, error: insertError } = await supabase
          .from('user_2fa_settings')
          .upsert({
            user_id: user.id,
            enabled: false,
            method: null,
          }, { onConflict: 'user_id' })
          .select()
          .single();

        if (insertError) throw insertError;
        setSettings(newSettings as TwoFactorSettings);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    if (!settings) return;

    try {
      setUpdating(true);

      // Verificar se usuário é master ou admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: systemUser } = await supabase
        .from('system_users')
        .select('system_role')
        .eq('id', user.id)
        .maybeSingle();

      if (!systemUser || !['master', 'support'].includes(systemUser.system_role)) {
        toast({
          title: "Acesso negado",
          description: "2FA está disponível apenas para usuários Master e Admin",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('user_2fa_settings')
        .update({
          enabled,
          method: enabled ? 'totp' : null,
          verified_at: enabled ? new Date().toISOString() : null,
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: enabled ? "2FA Ativado" : "2FA Desativado",
        description: enabled
          ? "Autenticação de dois fatores foi ativada com sucesso"
          : "Autenticação de dois fatores foi desativada",
      });

      loadSettings();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar 2FA",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="p-4">Carregando configurações...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <CardTitle>Autenticação de Dois Fatores (2FA)</CardTitle>
        </div>
        <CardDescription>
          Adicione uma camada extra de segurança à sua conta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle>Segurança Avançada</AlertTitle>
          <AlertDescription>
            A autenticação de dois fatores está disponível para usuários Master e Admin.
            Quando ativada, será necessário um código adicional para fazer login.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="2fa-toggle" className="text-base">
              Ativar 2FA
            </Label>
            <p className="text-sm text-muted-foreground">
              {settings?.enabled
                ? "2FA está ativo e protegendo sua conta"
                : "2FA está desativado"}
            </p>
          </div>
          <Switch
            id="2fa-toggle"
            checked={settings?.enabled || false}
            onCheckedChange={handleToggle2FA}
            disabled={updating}
          />
        </div>

        {settings?.enabled && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400">
                Verificado em: {new Date(settings.verified_at!).toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="font-semibold">Método: TOTP (Time-based One-Time Password)</h4>
              <p className="text-sm text-muted-foreground">
                Use um aplicativo autenticador como Google Authenticator ou Authy para gerar códigos.
              </p>
            </div>
          </div>
        )}

        {!settings?.enabled && (
          <Alert>
            <XCircle className="h-4 w-4" />
            <AlertTitle>2FA Desativado</AlertTitle>
            <AlertDescription>
              Recomendamos fortemente ativar a autenticação de dois fatores para proteger sua conta.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
