import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  MessageCircle,
  CreditCard,
  Key,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Shield,
  Phone,
  Globe,
} from "lucide-react";
import { VirtualNumberProviders } from "./VirtualNumberProviders";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface IntegrationStatus {
  meta_whatsapp: boolean;
  stripe: boolean;
  meta_verified: boolean;
  stripe_verified: boolean;
}

interface SystemConfig {
  id?: string;
  key: string;
  value: string;
  is_secret: boolean;
  description: string;
}

export function IntegrationsConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<IntegrationStatus>({
    meta_whatsapp: false,
    stripe: false,
    meta_verified: false,
    stripe_verified: false,
  });
  const [isMaster, setIsMaster] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    (() => Promise<void>) | null
  >(null);

  // Google configs
  const [googleConfig, setGoogleConfig] = useState({
    client_id: "",
    client_secret: "",
    api_key: "",
  });

  // Meta WhatsApp configs
  const [metaConfig, setMetaConfig] = useState({
    app_id: "",
    app_secret: "",
    access_token: "",
    phone_number_id: "",
    business_account_id: "",
    webhook_verify_token: "",
    api_version: "v18.0",
  });

  // Stripe configs
  const [stripeConfig, setStripeConfig] = useState({
    publishable_key: "",
    secret_key: "",
    webhook_secret: "",
    test_mode: true,
  });

  const checkMasterRole = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("system_users")
        .select("system_role")
        .eq("id", user.id)
        .single();
      setIsMaster(data?.system_role === "master");
    }
  }, []);

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      // Load system configurations using raw query since types might not be updated yet
      const { data: configs, error } = await supabase
        .from("system_configs" as any)
        .select("*");

      if (error) {
        console.error("Error loading configs:", error);
        // If table doesn't exist yet, just continue with defaults
        setLoading(false);
        return;
      }

      if (configs) {
        const configMap: Record<string, string> = {};
        (configs as any[]).forEach((c: any) => {
          configMap[c.key] = c.value;
        });

        setMetaConfig({
          app_id: configMap["meta_app_id"] || "",
          app_secret: configMap["meta_app_secret"] || "",
          access_token: configMap["meta_access_token"] || "",
          phone_number_id: configMap["meta_phone_number_id"] || "",
          business_account_id: configMap["meta_business_account_id"] || "",
          webhook_verify_token: configMap["meta_webhook_verify_token"] || "",
          api_version: configMap["meta_api_version"] || "v18.0",
        });

        setStripeConfig({
          publishable_key: configMap["stripe_publishable_key"] || "",
          secret_key: configMap["stripe_secret_key"] || "",
          webhook_secret: configMap["stripe_webhook_secret"] || "",
          test_mode: configMap["stripe_test_mode"] === "true",
        });

        setGoogleConfig({
          client_id: configMap["google_client_id"] || "",
          client_secret: configMap["google_client_secret"] || "",
          api_key: configMap["google_api_key"] || "",
        });

        setStatus({
          meta_whatsapp: !!configMap["meta_access_token"],
          stripe: !!configMap["stripe_secret_key"],
          meta_verified: configMap["meta_verified"] === "true",
          stripe_verified: configMap["stripe_verified"] === "true",
        });
      }
    } catch (error) {
      console.error("Error loading configs:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigs();
    checkMasterRole();
  }, [loadConfigs, checkMasterRole]);

  const saveConfig = async (
    key: string,
    value: string,
    isSecret: boolean = false,
  ) => {
    try {
      const { error } = await supabase.from("system_configs" as any).upsert(
        {
          key,
          value,
          is_secret: isSecret,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );

      if (error) throw error;
    } catch (error: any) {
      console.error(`Error saving ${key}:`, error);
      throw error;
    }
  };

  const handleSaveWithConfirmation = (action: () => Promise<void>) => {
    if (!isMaster) {
      toast.error(
        "Apenas usuários Master podem alterar estas configurações críticas.",
      );
      return;
    }
    setPendingAction(() => action);
    setAlertOpen(true);
  };

  const executePendingAction = async () => {
    if (pendingAction) {
      await pendingAction();
      setPendingAction(null);
      setAlertOpen(false);
    }
  };

  const handleSaveMeta = async () => {
    handleSaveWithConfirmation(async () => {
      setSaving(true);
      try {
        await Promise.all([
          saveConfig("meta_app_id", metaConfig.app_id),
          saveConfig("meta_app_secret", metaConfig.app_secret, true),
          saveConfig("meta_access_token", metaConfig.access_token, true),
          saveConfig("meta_phone_number_id", metaConfig.phone_number_id),
          saveConfig(
            "meta_business_account_id",
            metaConfig.business_account_id,
          ),
          saveConfig(
            "meta_webhook_verify_token",
            metaConfig.webhook_verify_token,
            true,
          ),
          saveConfig("meta_api_version", metaConfig.api_version),
        ]);

        toast.success("Configurações Meta salvas com sucesso");
        await loadConfigs();
      } catch (error) {
        toast.error("Erro ao salvar configurações");
      } finally {
        setSaving(false);
      }
    });
  };

  const handleSaveStripe = async () => {
    handleSaveWithConfirmation(async () => {
      setSaving(true);
      try {
        await Promise.all([
          saveConfig("stripe_publishable_key", stripeConfig.publishable_key),
          saveConfig("stripe_secret_key", stripeConfig.secret_key, true),
          saveConfig(
            "stripe_webhook_secret",
            stripeConfig.webhook_secret,
            true,
          ),
          saveConfig("stripe_test_mode", stripeConfig.test_mode.toString()),
        ]);

        toast.success("Configurações Stripe salvas com sucesso");
        await loadConfigs();
      } catch (error) {
        toast.error("Erro ao salvar configurações");
      } finally {
        setSaving(false);
      }
    });
  };

  const handleSaveGoogle = async () => {
    handleSaveWithConfirmation(async () => {
      setSaving(true);
      try {
        await Promise.all([
          saveConfig("google_client_id", googleConfig.client_id),
          saveConfig("google_client_secret", googleConfig.client_secret, true),
          saveConfig("google_api_key", googleConfig.api_key, true),
        ]);

        toast.success("Configurações Google salvas com sucesso");
        await loadConfigs();
      } catch (error) {
        toast.error("Erro ao salvar configurações");
      } finally {
        setSaving(false);
      }
    });
  };

  const handleVerifyMeta = async () => {
    setSaving(true);
    try {
      // Call edge function to verify Meta credentials
      const { data, error } = await supabase.functions.invoke(
        "verify-meta-credentials",
        {
          body: {
            access_token: metaConfig.access_token,
            phone_number_id: metaConfig.phone_number_id,
          },
        },
      );

      if (error) throw error;

      if (data?.success) {
        await saveConfig("meta_verified", "true");
        toast.success("Credenciais Meta verificadas com sucesso");
        await loadConfigs();
      } else {
        toast.error(data?.error || "Falha na verificação");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao verificar credenciais");
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyStripe = async () => {
    setSaving(true);
    try {
      // Call edge function to verify Stripe credentials
      const { data, error } = await supabase.functions.invoke(
        "verify-stripe-credentials",
        {
          body: { secret_key: stripeConfig.secret_key },
        },
      );

      if (error) throw error;

      if (data?.success) {
        await saveConfig("stripe_verified", "true");
        toast.success("Credenciais Stripe verificadas com sucesso");
        await loadConfigs();
      } else {
        toast.error(data?.error || "Falha na verificação");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao verificar credenciais");
    } finally {
      setSaving(false);
    }
  };

  const toggleShowSecret = (key: string) => {
    setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const maskSecret = (value: string) => {
    if (!value) return "";
    if (value.length <= 8) return "••••••••";
    return (
      value.substring(0, 4) + "••••••••" + value.substring(value.length - 4)
    );
  };

  const SecretInput = ({
    id,
    value,
    onChange,
    placeholder,
  }: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
  }) => (
    <div className="relative">
      <Input
        id={id}
        type={showSecrets[id] ? "text" : "password"}
        value={showSecrets[id] ? value : value ? maskSecret(value) : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10 font-mono text-sm"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3"
        onClick={() => toggleShowSecret(id)}
      >
        {showSecrets[id] ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={
            status.meta_whatsapp ? "border-green-500/50" : "border-amber-500/50"
          }
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${status.meta_whatsapp ? "bg-green-500/10" : "bg-amber-500/10"}`}
                >
                  <MessageCircle
                    className={`h-5 w-5 ${status.meta_whatsapp ? "text-green-500" : "text-amber-500"}`}
                  />
                </div>
                <div>
                  <p className="font-medium">Meta WhatsApp</p>
                  <p className="text-sm text-muted-foreground">
                    {status.meta_whatsapp ? "Configurado" : "Não configurado"}
                  </p>
                </div>
              </div>
              {status.meta_verified ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verificado
                </Badge>
              ) : status.meta_whatsapp ? (
                <Badge variant="secondary">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Pendente
                </Badge>
              ) : (
                <Badge variant="outline">
                  <XCircle className="h-3 w-3 mr-1" />
                  Inativo
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card
          className={
            status.stripe ? "border-green-500/50" : "border-amber-500/50"
          }
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${status.stripe ? "bg-green-500/10" : "bg-amber-500/10"}`}
                >
                  <CreditCard
                    className={`h-5 w-5 ${status.stripe ? "text-green-500" : "text-amber-500"}`}
                  />
                </div>
                <div>
                  <p className="font-medium">Stripe</p>
                  <p className="text-sm text-muted-foreground">
                    {status.stripe
                      ? stripeConfig.test_mode
                        ? "Modo Teste"
                        : "Produção"
                      : "Não configurado"}
                  </p>
                </div>
              </div>
              {status.stripe_verified ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verificado
                </Badge>
              ) : status.stripe ? (
                <Badge variant="secondary">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Pendente
                </Badge>
              ) : (
                <Badge variant="outline">
                  <XCircle className="h-3 w-3 mr-1" />
                  Inativo
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="meta" className="space-y-4">
        <TabsList>
          <TabsTrigger value="meta" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Meta WhatsApp
          </TabsTrigger>
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Stripe
          </TabsTrigger>
          <TabsTrigger value="google" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Google
          </TabsTrigger>
          <TabsTrigger value="providers" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Provedores
          </TabsTrigger>
        </TabsList>

        {/* Meta WhatsApp */}
        <TabsContent value="meta">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Configurações Meta WhatsApp Business API
              </CardTitle>
              <CardDescription>
                Configure as credenciais da API do Meta para envio e recebimento
                de mensagens WhatsApp.
                <a
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-primary hover:underline inline-flex items-center gap-1"
                >
                  Acessar Console Meta <ExternalLink className="h-3 w-3" />
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_app_id">App ID</Label>
                  <Input
                    id="meta_app_id"
                    value={metaConfig.app_id}
                    onChange={(e) =>
                      setMetaConfig({ ...metaConfig, app_id: e.target.value })
                    }
                    placeholder="123456789012345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_api_version">Versão da API</Label>
                  <Input
                    id="meta_api_version"
                    value={metaConfig.api_version}
                    onChange={(e) =>
                      setMetaConfig({
                        ...metaConfig,
                        api_version: e.target.value,
                      })
                    }
                    placeholder="v18.0"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_app_secret">App Secret</Label>
                <SecretInput
                  id="meta_app_secret"
                  value={metaConfig.app_secret}
                  onChange={(v) =>
                    setMetaConfig({ ...metaConfig, app_secret: v })
                  }
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_access_token">
                  Access Token (Permanente)
                </Label>
                <SecretInput
                  id="meta_access_token"
                  value={metaConfig.access_token}
                  onChange={(v) =>
                    setMetaConfig({ ...metaConfig, access_token: v })
                  }
                  placeholder="EAAxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-muted-foreground">
                  Use um token de acesso permanente do Sistema do Usuário com
                  permissões whatsapp_business_messaging
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="meta_phone_number_id">Phone Number ID</Label>
                  <Input
                    id="meta_phone_number_id"
                    value={metaConfig.phone_number_id}
                    onChange={(e) =>
                      setMetaConfig({
                        ...metaConfig,
                        phone_number_id: e.target.value,
                      })
                    }
                    placeholder="123456789012345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meta_business_account_id">
                    Business Account ID
                  </Label>
                  <Input
                    id="meta_business_account_id"
                    value={metaConfig.business_account_id}
                    onChange={(e) =>
                      setMetaConfig({
                        ...metaConfig,
                        business_account_id: e.target.value,
                      })
                    }
                    placeholder="123456789012345"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_webhook_verify_token">
                  Webhook Verify Token
                </Label>
                <SecretInput
                  id="meta_webhook_verify_token"
                  value={metaConfig.webhook_verify_token}
                  onChange={(v) =>
                    setMetaConfig({ ...metaConfig, webhook_verify_token: v })
                  }
                  placeholder="seu_token_secreto"
                />
                <p className="text-xs text-muted-foreground">
                  Token usado para verificar o webhook. Use algo único e seguro.
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Webhook URL
                </h4>
                <code className="text-sm bg-background px-2 py-1 rounded block overflow-x-auto">
                  {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`}
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Configure esta URL no Console Meta → WhatsApp → Configuração →
                  Webhook
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveMeta} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Configurações
                </Button>
                {status.meta_whatsapp && !status.meta_verified && (
                  <Button
                    variant="outline"
                    onClick={handleVerifyMeta}
                    disabled={saving}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Verificar Credenciais
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stripe */}
        <TabsContent value="stripe">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Configurações Stripe
              </CardTitle>
              <CardDescription>
                Configure as credenciais do Stripe para processamento de
                pagamentos.
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-1 text-primary hover:underline inline-flex items-center gap-1"
                >
                  Acessar Dashboard Stripe <ExternalLink className="h-3 w-3" />
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <Switch
                  checked={stripeConfig.test_mode}
                  onCheckedChange={(v) =>
                    setStripeConfig({ ...stripeConfig, test_mode: v })
                  }
                />
                <div>
                  <Label>Modo de Teste</Label>
                  <p className="text-sm text-muted-foreground">
                    {stripeConfig.test_mode
                      ? "Usando chaves de teste - nenhuma cobrança real será feita"
                      : "Modo produção - cobranças reais serão processadas"}
                  </p>
                </div>
                {stripeConfig.test_mode && (
                  <Badge variant="secondary" className="ml-auto">
                    TEST
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripe_publishable_key">Publishable Key</Label>
                <Input
                  id="stripe_publishable_key"
                  value={stripeConfig.publishable_key}
                  onChange={(e) =>
                    setStripeConfig({
                      ...stripeConfig,
                      publishable_key: e.target.value,
                    })
                  }
                  placeholder={
                    stripeConfig.test_mode ? "pk_test_..." : "pk_live_..."
                  }
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Chave pública - usada no frontend para criar elementos de
                  pagamento
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripe_secret_key">Secret Key</Label>
                <SecretInput
                  id="stripe_secret_key"
                  value={stripeConfig.secret_key}
                  onChange={(v) =>
                    setStripeConfig({ ...stripeConfig, secret_key: v })
                  }
                  placeholder={
                    stripeConfig.test_mode ? "sk_test_..." : "sk_live_..."
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Chave secreta - nunca exponha esta chave no frontend
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stripe_webhook_secret">Webhook Secret</Label>
                <SecretInput
                  id="stripe_webhook_secret"
                  value={stripeConfig.webhook_secret}
                  onChange={(v) =>
                    setStripeConfig({ ...stripeConfig, webhook_secret: v })
                  }
                  placeholder="whsec_..."
                />
                <p className="text-xs text-muted-foreground">
                  Usado para verificar assinaturas de webhooks do Stripe
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Webhook URL
                </h4>
                <code className="text-sm bg-background px-2 py-1 rounded block overflow-x-auto">
                  {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-webhook`}
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Configure esta URL no Dashboard Stripe → Developers → Webhooks
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveStripe} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Configurações
                </Button>
                {status.stripe && !status.stripe_verified && (
                  <Button
                    variant="outline"
                    onClick={handleVerifyStripe}
                    disabled={saving}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Verificar Credenciais
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google */}
        <TabsContent value="google">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configurações Google
              </CardTitle>
              <CardDescription>
                Configure as credenciais do Google para autenticação e
                integrações.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="google_client_id">Client ID</Label>
                <Input
                  id="google_client_id"
                  value={googleConfig.client_id}
                  onChange={(e) =>
                    setGoogleConfig({
                      ...googleConfig,
                      client_id: e.target.value,
                    })
                  }
                  placeholder="...apps.googleusercontent.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_client_secret">Client Secret</Label>
                <SecretInput
                  id="google_client_secret"
                  value={googleConfig.client_secret}
                  onChange={(v) =>
                    setGoogleConfig({ ...googleConfig, client_secret: v })
                  }
                  placeholder="GOCSPX-..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="google_api_key">API Key</Label>
                <SecretInput
                  id="google_api_key"
                  value={googleConfig.api_key}
                  onChange={(v) =>
                    setGoogleConfig({ ...googleConfig, api_key: v })
                  }
                  placeholder="AIza..."
                />
              </div>

              <Button onClick={handleSaveGoogle} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Providers */}
        <TabsContent value="providers">
          <VirtualNumberProviders isMaster={isMaster} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Atenção: Alteração Crítica
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a alterar chaves de API ou segredos do sistema.
              Isso pode interromper o funcionamento de integrações em produção.
              <br />
              <br />
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executePendingAction}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Alteração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
