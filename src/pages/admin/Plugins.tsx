import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Puzzle, Settings, Play } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";

// Lista de plugins disponíveis (mockada do frontend, deve bater com o backend)
const SYSTEM_PLUGINS = [
    {
        key: 'email-contador',
        name: 'Notificar Contador',
        description: 'Envia e-mail automático quando faturas são pagas.',
        hooks: ['onInvoicePaid'],
        defaultConfig: { email_contador: 'contador@exemplo.com' }
    },
    {
        key: 'webhook-erp',
        name: 'Integração ERP',
        description: 'Envia dados de novos agendamentos para endpoint externo.',
        hooks: ['onAppointmentCreated'],
        defaultConfig: { erp_url: 'https://api.erp.com/v1/events', api_key: '' }
    }
];

export default function PluginsManager() {
    const { profile } = useAuth();
    const [activePlugins, setActivePlugins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.tenant_id) loadPlugins();
    }, [profile?.tenant_id]);

    const loadPlugins = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('plugins_registry')
            .select('*')
            .eq('tenant_id', profile?.tenant_id);
        setActivePlugins(data || []);
        setLoading(false);
    };

    const handleTogglePlugin = async (pluginKey: string, enabled: boolean) => {
        const existing = activePlugins.find(p => p.nome === pluginKey);

        if (enabled) {
            if (!existing) {
                // Ativar novo (criar registro)
                const sysPlugin = SYSTEM_PLUGINS.find(p => p.key === pluginKey);
                if (!sysPlugin) return;

                const { error } = await supabase.from('plugins_registry').insert({
                    tenant_id: profile?.tenant_id,
                    nome: pluginKey,
                    hooks: sysPlugin.hooks,
                    config_json: sysPlugin.defaultConfig,
                    ativo: true
                });
                if (error) toast.error("Erro ao ativar plugin");
                else toast.success("Plugin ativado");
            } else {
                // Reativar
                await supabase.from('plugins_registry').update({ ativo: true }).eq('id', existing.id);
                toast.success("Plugin ativado");
            }
        } else {
            if (existing) {
                // Desativar
                await supabase.from('plugins_registry').update({ ativo: false }).eq('id', existing.id);
                toast.success("Plugin desativado");
            }
        }
        loadPlugins();
    };

    const handleSaveConfig = async (id: string, config: string) => {
        try {
            const json = JSON.parse(config);
            const { error } = await supabase
                .from('plugins_registry')
                .update({ config_json: json })
                .eq('id', id);

            if (error) throw error;
            toast.success("Configuração salva!");
            loadPlugins();
        } catch (e) {
            toast.error("JSON inválido");
        }
    };

    return (
        <AdminLayout>
            <div className="container mx-auto p-6 space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Loja de Plugins</h1>
                    <p className="text-muted-foreground">Estenda as funcionalidades do sistema com integrações prontas.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {SYSTEM_PLUGINS.map(plugin => {
                        const active = activePlugins.find(p => p.nome === plugin.key);
                        const isEnabled = active?.ativo || false;

                        return (
                            <Card key={plugin.key} className={isEnabled ? "border-primary/50 bg-primary/5" : ""}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-muted rounded-full">
                                            <Puzzle className="h-6 w-6 text-primary" />
                                        </div>
                                        <Switch
                                            checked={isEnabled}
                                            onCheckedChange={(checked) => handleTogglePlugin(plugin.key, checked)}
                                        />
                                    </div>
                                    <CardTitle className="mt-4">{plugin.name}</CardTitle>
                                    <CardDescription>{plugin.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {plugin.hooks.map(hook => (
                                            <Badge key={hook} variant="secondary" className="text-[10px]">{hook}</Badge>
                                        ))}
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    {isEnabled && active && (
                                        <ConfigDialog
                                            pluginName={plugin.name}
                                            initialConfig={JSON.stringify(active.config_json, null, 2)}
                                            onSave={(cfg) => handleSaveConfig(active.id, cfg)}
                                        />
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </AdminLayout>
    );
}

function ConfigDialog({ pluginName, initialConfig, onSave }: { pluginName: string, initialConfig: string, onSave: (c: string) => void }) {
    const [config, setConfig] = useState(initialConfig);
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" /> Configurar
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Configurar {pluginName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Label>Configuração (JSON)</Label>
                    <Textarea
                        value={config}
                        onChange={e => setConfig(e.target.value)}
                        className="font-mono h-[200px]"
                    />
                </div>
                <DialogFooter>
                    <Button onClick={() => { onSave(config); setOpen(false); }}>Salvar Alterações</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
