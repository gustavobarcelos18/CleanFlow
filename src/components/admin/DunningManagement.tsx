import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2,
  AlertTriangle,
  Bell,
  Mail,
  MessageSquare,
  Shield,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DunningConfig {
  id: string;
  dias_atraso: number;
  acao: string;
  canal_notificacao: string[];
  template_mensagem: string | null;
  ativo: boolean;
}

interface HistoricoDunning {
  id: string;
  tenant_id: string;
  dias_atraso: number;
  acao_tomada: string;
  canal: string;
  sucesso: boolean;
  created_at: string;
  tenants?: {
    nome: string;
  };
}

interface RestricaoTenant {
  id: string;
  tenant_id: string;
  tipo_restricao: string;
  motivo: string;
  iniciado_em: string;
  ativo: boolean;
  tenants?: {
    nome: string;
    email: string;
  };
}

export function DunningManagement() {
  const [configs, setConfigs] = useState<DunningConfig[]>([]);
  const [historico, setHistorico] = useState<HistoricoDunning[]>([]);
  const [restricoes, setRestricoes] = useState<RestricaoTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<DunningConfig | null>(
    null,
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [configsRes, historicoRes, restricoesRes] = await Promise.all([
        supabase.from("dunning_configs").select("*").order("dias_atraso"),
        supabase
          .from("historico_dunning")
          .select("*, tenants(nome)")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("restricoes_tenant")
          .select("*, tenants(nome, email)")
          .eq("ativo", true),
      ]);

      if (configsRes.error) throw configsRes.error;
      if (historicoRes.error) throw historicoRes.error;
      if (restricoesRes.error) throw restricoesRes.error;

      setConfigs(configsRes.data || []);
      setHistorico(historicoRes.data || []);
      setRestricoes(restricoesRes.data || []);
    } catch (error: any) {
      console.error("Erro ao carregar dados de dunning:", error);
      toast.error("Erro ao carregar dados de cobrança");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleConfig = async (id: string, ativo: boolean) => {
    try {
      const { error } = await supabase
        .from("dunning_configs")
        .update({ ativo: !ativo })
        .eq("id", id);

      if (error) throw error;

      toast.success("Configuração atualizada!");
      loadData();
    } catch (error: any) {
      console.error("Erro ao atualizar configuração:", error);
      toast.error("Erro ao atualizar configuração");
    }
  };

  const handleRemoverRestricao = async (
    restricaoId: string,
    tenantId: string,
  ) => {
    try {
      const { error } = await supabase
        .from("restricoes_tenant")
        .update({
          ativo: false,
          removido_em: new Date().toISOString(),
        })
        .eq("id", restricaoId);

      if (error) throw error;

      // Log na auditoria
      await supabase.from("support_actions_log").insert({
        support_user_id: (await supabase.auth.getUser()).data.user?.id,
        action_type: "restricao_removida",
        target_type: "restricao_tenant",
        target_id: restricaoId,
        description: `Restrição removida para tenant ${tenantId}`,
      });

      toast.success("Restrição removida!");
      loadData();
    } catch (error: any) {
      console.error("Erro ao remover restrição:", error);
      toast.error("Erro ao remover restrição");
    }
  };

  const getAcaoIcon = (acao: string) => {
    const icons: Record<string, any> = {
      lembrete: Bell,
      restricao_marketing: AlertTriangle,
      restricao_outbound: Shield,
      suspensao_total: AlertTriangle,
    };
    return icons[acao] || Bell;
  };

  const getRestricaoBadge = (tipo: string) => {
    const variants: Record<string, any> = {
      nenhuma: { variant: "default", label: "Sem Restrições" },
      soft_marketing: { variant: "outline", label: "Marketing Restrito" },
      soft_outbound: { variant: "destructive", label: "Outbound Restrito" },
      suspensao_total: { variant: "destructive", label: "Suspenso" },
    };

    const config = variants[tipo] || variants.nenhuma;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configurações de Dunning */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Regras de Cobrança (Dunning)
              </CardTitle>
              <CardDescription>
                Configure as ações automáticas para inadimplência
              </CardDescription>
            </div>
            <DunningConfigDialog onSave={loadData} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {configs.map((config) => {
              const Icon = getAcaoIcon(config.acao);
              return (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="font-semibold">
                        D+{config.dias_atraso}:{" "}
                        {config.acao.replace(/_/g, " ").toUpperCase()}
                      </span>
                      <Badge variant={config.ativo ? "default" : "secondary"}>
                        {config.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Canais: {config.canal_notificacao.join(", ")}
                    </div>
                    {config.template_mensagem && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {config.template_mensagem}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingConfig(config)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant={config.ativo ? "destructive" : "default"}
                      size="sm"
                      onClick={() =>
                        handleToggleConfig(config.id, config.ativo)
                      }
                    >
                      {config.ativo ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Restrições Ativas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Restrições Ativas
          </CardTitle>
          <CardDescription>
            Clientes com restrições por inadimplência
          </CardDescription>
        </CardHeader>
        <CardContent>
          {restricoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma restrição ativa
            </div>
          ) : (
            <div className="space-y-3">
              {restricoes.map((restricao) => (
                <Card
                  key={restricao.id}
                  className="border-l-4 border-l-destructive"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold">
                            {restricao.tenants?.nome}
                          </span>
                          {getRestricaoBadge(restricao.tipo_restricao)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Motivo: {restricao.motivo}</div>
                          <div>
                            Desde:{" "}
                            {new Date(
                              restricao.iniciado_em,
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleRemoverRestricao(
                            restricao.id,
                            restricao.tenant_id,
                          )
                        }
                      >
                        Remover Restrição
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Cobranças */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Histórico de Cobranças
          </CardTitle>
          <CardDescription>
            Últimas ações de cobrança realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {historico.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg text-sm"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.tenants?.nome}</div>
                  <div className="text-muted-foreground">
                    D+{item.dias_atraso} - {item.acao_tomada} via {item.canal}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={item.sucesso ? "default" : "destructive"}>
                    {item.sucesso ? "Enviado" : "Falhou"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de edição */}
      {editingConfig && (
        <DunningConfigDialog
          config={editingConfig}
          onSave={loadData}
          onClose={() => setEditingConfig(null)}
        />
      )}
    </div>
  );
}

// Componente de diálogo para configuração de dunning
function DunningConfigDialog({ config, onSave, onClose }: any) {
  const [formData, setFormData] = useState(
    config || {
      dias_atraso: 1,
      acao: "lembrete",
      canal_notificacao: ["email"],
      template_mensagem: "",
      ativo: true,
    },
  );
  const [open, setOpen] = useState(!!config);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = config
        ? await supabase
            .from("dunning_configs")
            .update(formData)
            .eq("id", config.id)
        : await supabase.from("dunning_configs").insert([formData]);

      if (error) throw error;

      toast.success("Configuração salva com sucesso!");
      if (onClose) onClose();
      setOpen(false);
      onSave();
    } catch (error: any) {
      console.error("Erro ao salvar configuração:", error);
      toast.error("Erro ao salvar configuração");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o && onClose) onClose();
      }}
    >
      <DialogTrigger asChild>
        <Button>Nova Regra</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {config ? "Editar" : "Nova"} Regra de Cobrança
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Dias de Atraso</Label>
            <Input
              type="number"
              min="1"
              value={formData.dias_atraso}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dias_atraso: parseInt(e.target.value),
                })
              }
            />
          </div>
          <div>
            <Label>Ação</Label>
            <Select
              value={formData.acao}
              onValueChange={(v) => setFormData({ ...formData, acao: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lembrete">Lembrete</SelectItem>
                <SelectItem value="restricao_marketing">
                  Restringir Marketing
                </SelectItem>
                <SelectItem value="restricao_outbound">
                  Restringir Outbound
                </SelectItem>
                <SelectItem value="suspensao_total">Suspensão Total</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Template da Mensagem</Label>
            <Textarea
              value={formData.template_mensagem || ""}
              onChange={(e) =>
                setFormData({ ...formData, template_mensagem: e.target.value })
              }
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
