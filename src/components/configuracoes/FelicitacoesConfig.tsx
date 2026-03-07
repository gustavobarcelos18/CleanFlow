import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Cake, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function FelicitacoesConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    felicitar_pacientes: true,
    felicitar_profissionais: true,
    mensagem_paciente:
      "Feliz aniversário! 🎉 Desejamos um dia especial e muita saúde!",
    mensagem_profissional: "Feliz aniversário! 🎂 Desejamos um ótimo dia!",
    horario_envio: "09:00",
    canal_envio: ["whatsapp", "email"],
  });
  const { toast } = useToast();

  const fetchConfig = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

      const { data, error } = await (supabase as any)
        .from("configuracoes_felicitacoes")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig({
          felicitar_pacientes: data.felicitar_pacientes,
          felicitar_profissionais: data.felicitar_profissionais,
          mensagem_paciente: data.mensagem_paciente,
          mensagem_profissional: data.mensagem_profissional,
          horario_envio: data.horario_envio?.substring(0, 5) || "09:00",
          canal_envio: data.canal_envio || ["whatsapp", "email"],
        });
      }
    } catch (error: any) {
      console.error("Erro ao buscar configurações:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

      const { error } = await (supabase as any)
        .from("configuracoes_felicitacoes")
        .upsert(
          {
            tenant_id: profile.tenant_id,
            ...config,
          },
          {
            onConflict: "tenant_id",
          },
        );

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Configurações salvas com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description:
          error.message || "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCanal = (canal: string) => {
    const novosCanais = config.canal_envio.includes(canal)
      ? config.canal_envio.filter((c) => c !== canal)
      : [...config.canal_envio, canal];

    setConfig({ ...config, canal_envio: novosCanais });
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cake className="h-5 w-5" />
          Felicitações de Aniversário
        </CardTitle>
        <CardDescription>
          Configure mensagens automáticas para aniversariantes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pacientes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="felicitar_pacientes" className="text-base">
                Felicitar Pacientes
              </Label>
              <p className="text-sm text-muted-foreground">
                Enviar mensagem automática no aniversário dos pacientes
              </p>
            </div>
            <Switch
              id="felicitar_pacientes"
              checked={config.felicitar_pacientes}
              onCheckedChange={(checked) =>
                setConfig({ ...config, felicitar_pacientes: checked })
              }
            />
          </div>

          {config.felicitar_pacientes && (
            <div className="space-y-2 pl-4 border-l-2">
              <Label>Mensagem para Pacientes</Label>
              <Textarea
                value={config.mensagem_paciente}
                onChange={(e) =>
                  setConfig({ ...config, mensagem_paciente: e.target.value })
                }
                rows={3}
                placeholder="Mensagem de aniversário para pacientes"
              />
            </div>
          )}
        </div>

        {/* Profissionais */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="felicitar_profissionais" className="text-base">
                Felicitar Profissionais
              </Label>
              <p className="text-sm text-muted-foreground">
                Enviar mensagem automática no aniversário dos profissionais
              </p>
            </div>
            <Switch
              id="felicitar_profissionais"
              checked={config.felicitar_profissionais}
              onCheckedChange={(checked) =>
                setConfig({ ...config, felicitar_profissionais: checked })
              }
            />
          </div>

          {config.felicitar_profissionais && (
            <div className="space-y-2 pl-4 border-l-2">
              <Label>Mensagem para Profissionais</Label>
              <Textarea
                value={config.mensagem_profissional}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    mensagem_profissional: e.target.value,
                  })
                }
                rows={3}
                placeholder="Mensagem de aniversário para profissionais"
              />
            </div>
          )}
        </div>

        {/* Horário e Canal */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="horario_envio">Horário de Envio</Label>
            <Input
              id="horario_envio"
              type="time"
              value={config.horario_envio}
              onChange={(e) =>
                setConfig({ ...config, horario_envio: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Canais de Envio</Label>
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={
                  config.canal_envio.includes("whatsapp")
                    ? "default"
                    : "outline"
                }
                className="cursor-pointer"
                onClick={() => toggleCanal("whatsapp")}
              >
                WhatsApp
              </Badge>
              <Badge
                variant={
                  config.canal_envio.includes("email") ? "default" : "outline"
                }
                className="cursor-pointer"
                onClick={() => toggleCanal("email")}
              >
                E-mail
              </Badge>
              <Badge
                variant={
                  config.canal_envio.includes("sms") ? "default" : "outline"
                }
                className="cursor-pointer"
                onClick={() => toggleCanal("sms")}
              >
                SMS
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
