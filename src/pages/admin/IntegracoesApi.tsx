import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Key,
  Webhook,
  Plus,
  Copy,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

export default function IntegracoesApi() {
  const { profile } = useAuth();

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrações & API</h1>
        <p className="text-muted-foreground">
          Gerencie chaves de API e Webhooks para integrar com sistemas externos.
        </p>
      </div>

      <Tabs defaultValue="apikeys" className="space-y-4">
        <TabsList>
          <TabsTrigger value="apikeys">Chaves de API</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="apikeys">
          <ApiKeysManager tenantId={profile?.tenant_id} />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhooksManager tenantId={profile?.tenant_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ApiKeysManager({ tenantId }: { tenantId: string }) {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("api_keys")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setKeys(data || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) loadKeys();
  }, [tenantId, loadKeys]);

  const handleCreateKey = async (nome: string) => {
    try {
      // Gerar chave no cliente (apenas para demonstração, idealmente backend retornaria)
      // Formato: sk_live_RANDOM
      const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const rawKey = `sk_live_${randomPart}`;

      // Hash SHA-256
      const encoder = new TextEncoder();
      const data = encoder.encode(rawKey);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const { data: keyData, error } = await supabase
        .from("api_keys")
        .insert({
          tenant_id: tenantId,
          nome,
          chave_hash: hashHex,
          prefixo: `sk_live_...${randomPart.slice(-4)}`,
        })
        .select()
        .single();

      if (error) throw error;

      // Log de auditoria
      await supabase.from("system_logs").insert({
        tenant_id: tenantId,
        event_type: "api_key_created",
        details: { key_id: keyData.id, key_name: nome },
      });

      setNewKey(rawKey); // Mostrar chave completa UMA VEZ
      loadKeys();
      toast.success("Chave de API criada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao criar chave.");
    }
  };

  const handleRevoke = async (id: string) => {
    await supabase.from("api_keys").delete().eq("id", id);
    loadKeys();
    toast.success("Chave revogada.");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Chaves de API</CardTitle>
          <CardDescription>
            Use estas chaves para autenticar requisições à nossa API pública.
          </CardDescription>
        </div>
        <NewKeyDialog onCreate={handleCreateKey} />
      </CardHeader>
      <CardContent>
        {newKey && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
              Nova Chave Gerada
            </h4>
            <p className="text-sm text-green-700 dark:text-green-400 mb-3">
              Copie esta chave agora. Você não poderá vê-la novamente.
            </p>
            <div className="flex items-center gap-2">
              <code className="bg-white dark:bg-slate-950 p-2 rounded border flex-1 font-mono text-sm break-all">
                {newKey}
              </code>
              <Button
                size="icon"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(newKey);
                  toast.success("Copiado!");
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Prefixo</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Último uso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.nome}</TableCell>
                <TableCell className="font-mono text-xs">
                  {key.prefixo}
                </TableCell>
                <TableCell>
                  {new Date(key.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {key.last_used_at
                    ? new Date(key.last_used_at).toLocaleString()
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleRevoke(key.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {keys.length === 0 && !loading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  Nenhuma chave de API ativa.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function WebhooksManager({ tenantId }: { tenantId: string }) {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWebhooks = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("webhook_subscriptions")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setWebhooks(data || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) loadWebhooks();
  }, [tenantId, loadWebhooks]);

  const handleCreateWebhook = async (url: string, events: string[]) => {
    try {
      // Gerar segredo aleatório
      const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const { data: webhookData, error } = await supabase
        .from("webhook_subscriptions")
        .insert({
          tenant_id: tenantId,
          url,
          event_types: events,
          segredo: secret,
        })
        .select()
        .single();

      if (error) throw error;

      // Log de auditoria
      await supabase.from("system_logs").insert({
        tenant_id: tenantId,
        event_type: "webhook_created",
        details: { webhook_id: webhookData.id, url, events },
      });

      loadWebhooks();
      toast.success("Webhook criado com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar webhook.");
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("webhook_subscriptions").delete().eq("id", id);
    loadWebhooks();
    toast.success("Webhook removido.");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Webhooks</CardTitle>
          <CardDescription>
            Receba notificações em tempo real sobre eventos do sistema.
          </CardDescription>
        </div>
        <NewWebhookDialog onCreate={handleCreateWebhook} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Eventos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Segredo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {webhooks.map((wh) => (
              <TableRow key={wh.id}>
                <TableCell
                  className="font-mono text-xs max-w-[200px] truncate"
                  title={wh.url}
                >
                  {wh.url}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {wh.event_types.map((ev: string) => (
                      <Badge
                        key={ev}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {ev}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={wh.ativo ? "default" : "secondary"}>
                    {wh.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted p-1 rounded">
                      {wh.segredo.slice(0, 8)}...
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(wh.segredo);
                        toast.success("Segredo copiado!");
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDelete(wh.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {webhooks.length === 0 && !loading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  Nenhum webhook configurado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function NewKeyDialog({ onCreate }: { onCreate: (nome: string) => void }) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(nome);
    setOpen(false);
    setNome("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Nova Chave
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Chave de API</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nome da Chave</Label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Integração CRM"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Gerar Chave
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewWebhookDialog({
  onCreate,
}: {
  onCreate: (url: string, events: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const availableEvents = [
    "appointment.created",
    "appointment.updated",
    "appointment.no_show",
    "invoice.paid",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEvents.length === 0) {
      toast.error("Selecione pelo menos um evento");
      return;
    }
    onCreate(url, selectedEvents);
    setOpen(false);
    setUrl("");
    setSelectedEvents([]);
  };

  const toggleEvent = (ev: string) => {
    if (selectedEvents.includes(ev)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== ev));
    } else {
      setSelectedEvents([...selectedEvents, ev]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Novo Webhook
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Webhook</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>URL de Destino</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.seusistema.com/webhook"
              required
              type="url"
            />
          </div>
          <div>
            <Label className="mb-2 block">Eventos</Label>
            <div className="space-y-2">
              {availableEvents.map((ev) => (
                <div key={ev} className="flex items-center space-x-2">
                  <Switch
                    id={ev}
                    checked={selectedEvents.includes(ev)}
                    onCheckedChange={() => toggleEvent(ev)}
                  />
                  <Label htmlFor={ev} className="font-normal cursor-pointer">
                    {ev}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full">
            Salvar Webhook
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
