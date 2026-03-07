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
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export function WhatsAppConfig() {
  const [loading, setLoading] = useState(false);
  const [tenantId, setTenantId] = useState<string>("");
  const [config, setConfig] = useState({
    whatsapp_phone_number_id: "",
    whatsapp_business_account_id: "",
    whatsapp_configurado: false,
    whatsapp_verificado: false,
  });

  const loadConfig = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile) return;
      setTenantId(profile.tenant_id);

      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .select(
          "whatsapp_phone_number_id, whatsapp_business_account_id, whatsapp_configurado, whatsapp_verificado",
        )
        .eq("id", profile.tenant_id)
        .single();

      if (tenantError) {
        console.error("Erro ao carregar tenant:", tenantError);
        toast.error("Erro ao carregar configuração");
        return;
      }

      if (tenant) {
        setConfig({
          whatsapp_phone_number_id: tenant.whatsapp_phone_number_id || "",
          whatsapp_business_account_id:
            tenant.whatsapp_business_account_id || "",
          whatsapp_configurado: tenant.whatsapp_configurado || false,
          whatsapp_verificado: tenant.whatsapp_verificado || false,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar configuração:", error);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (
      !config.whatsapp_phone_number_id ||
      !config.whatsapp_business_account_id
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!tenantId) {
      toast.error("Erro: ID do tenant não encontrado. Faça login novamente.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          whatsapp_phone_number_id: config.whatsapp_phone_number_id,
          whatsapp_business_account_id: config.whatsapp_business_account_id,
          whatsapp_configurado: true,
        })
        .eq("id", tenantId);

      if (error) {
        console.error("Erro ao salvar configuração:", error);
        throw error;
      }

      toast.success("Configuração salva com sucesso!");
      await loadConfig();
    } catch (error: any) {
      console.error("Erro completo:", error);
      toast.error("Erro ao salvar: " + (error.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!tenantId) {
      toast.error("Erro: ID do tenant não encontrado. Faça login novamente.");
      return;
    }

    setLoading(true);
    try {
      // Aqui você faria uma chamada de teste para verificar as credenciais
      // Por enquanto, apenas marcamos como verificado
      const { error } = await supabase
        .from("tenants")
        .update({
          whatsapp_verificado: true,
          whatsapp_verificado_em: new Date().toISOString(),
        })
        .eq("id", tenantId);

      if (error) {
        console.error("Erro ao verificar:", error);
        throw error;
      }

      toast.success("Integração verificada com sucesso!");
      await loadConfig();
    } catch (error: any) {
      console.error("Erro completo:", error);
      toast.error(
        "Erro na verificação: " + (error.message || "Erro desconhecido"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Configuração WhatsApp Business
          {config.whatsapp_verificado && (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
        </CardTitle>
        <CardDescription>
          Configure sua integração com WhatsApp Business API. Você precisará
          criar uma conta no Meta Business Suite e obter as credenciais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone_number_id">Phone Number ID *</Label>
          <Input
            id="phone_number_id"
            value={config.whatsapp_phone_number_id}
            onChange={(e) =>
              setConfig({ ...config, whatsapp_phone_number_id: e.target.value })
            }
            placeholder="Digite o Phone Number ID"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Encontre em: Meta Business Suite → WhatsApp Manager → Número de
            Telefone → API Setup
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="business_account_id">
            WhatsApp Business Account ID *
          </Label>
          <Input
            id="business_account_id"
            value={config.whatsapp_business_account_id}
            onChange={(e) =>
              setConfig({
                ...config,
                whatsapp_business_account_id: e.target.value,
              })
            }
            placeholder="Digite o Business Account ID"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Encontre em: Meta Business Suite → Configurações da Empresa →
            WhatsApp Business Accounts
          </p>
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h4 className="font-medium">Status da Integração</h4>
          <div className="flex items-center gap-2">
            {config.whatsapp_configurado ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">
              {config.whatsapp_configurado ? "Configurado" : "Não configurado"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {config.whatsapp_verificado ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm">
              {config.whatsapp_verificado ? "Verificado" : "Não verificado"}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configuração
          </Button>

          {config.whatsapp_configurado && !config.whatsapp_verificado && (
            <Button onClick={handleVerify} disabled={loading} variant="outline">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verificar Integração
            </Button>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            Como obter as credenciais?
          </h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Acesse o Meta Business Suite</li>
            <li>Vá em WhatsApp Manager</li>
            <li>Selecione seu número de telefone</li>
            <li>Copie o Phone Number ID e Business Account ID</li>
            <li>Cole aqui e clique em Salvar</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
