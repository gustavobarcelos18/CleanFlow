import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
    Plus, Play, GitBranch, MessageSquare, Mail, Smartphone,
    Trash2, Save, ArrowRight, Activity, Settings, CheckCircle2,
    AlertTriangle, Clock, UserPlus, ListPlus
} from "lucide-react";
import { AutomationFlow, AutomationNode, NodeType, ActionType, ConditionType } from "@/domain/automations/types";
import { AdminLayout } from "@/components/layout/AdminLayout";

export default function AutomationsFlowBuilder() {
    const { profile } = useAuth();
    const [flows, setFlows] = useState<AutomationFlow[]>([]);
    const [selectedFlow, setSelectedFlow] = useState<AutomationFlow | null>(null);
    const [loading, setLoading] = useState(false);

    // Admin context
    const [tenants, setTenants] = useState<{ id: string, nome: string }[]>([]);
    const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
    const [filterSegment, setFilterSegment] = useState<string>('todos');

    useEffect(() => {
        loadTenants();
    }, []);

    useEffect(() => {
        loadFlows();
    }, [selectedTenantId, filterSegment]);

    const loadTenants = async () => {
        const { data } = await supabase
            .from('tenants')
            .select('id, nome')
            .order('nome');
        setTenants(data || []);

        // Se tiver profile com tenant (não admin), seleciona auto
        if (profile?.tenant_id) {
            setSelectedTenantId(profile.tenant_id);
        }
    };

    const loadFlows = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('automations_flows')
                .select('*')
                .order('created_at', { ascending: false });

            if (selectedTenantId) {
                // Se tem tenant selecionado, busca do tenant E globais
                query = query.or(`tenant_id.eq.${selectedTenantId},is_global.eq.true`);
            } else {
                // Se não tem tenant (modo geral), busca apenas globais
                query = query.eq('is_global', true);
                if (filterSegment !== 'todos') {
                    query = query.eq('segmento', filterSegment);
                }
            }

            const { data, error } = await query;

            if (error) throw error;

            // Filtragem em memória para o caso complexo (Tenant + Global filtrado)
            let filteredData = data || [];
            if (selectedTenantId && filterSegment !== 'todos') {
                filteredData = filteredData.filter(flow => {
                    // Mantém se for do tenant
                    if (flow.tenant_id === selectedTenantId) return true;
                    // Se for global, verifica o segmento
                    if (flow.is_global) return flow.segmento === filterSegment;
                    return false;
                });
            }

            setFlows(filteredData);
        } catch (error) {
            console.error('Erro ao carregar fluxos:', error);
            toast.error('Erro ao carregar automações');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFlow = async (nome: string, descricao: string, isGlobal: boolean, segmento: string) => {
        if (!isGlobal && !selectedTenantId) {
            toast.error('Selecione uma clínica primeiro ou crie uma automação global');
            return;
        }

        try {
            const { data, error } = await supabase
                .from('automations_flows')
                .insert({
                    tenant_id: isGlobal ? null : selectedTenantId,
                    nome,
                    descricao,
                    ativo: false,
                    is_global: isGlobal,
                    segmento: isGlobal ? segmento : null
                })
                .select()
                .single();

            if (error) throw error;

            setFlows([data, ...flows]);
            setSelectedFlow(data);
            toast.success('Fluxo criado com sucesso');
        } catch (error) {
            console.error(error);
            toast.error('Erro ao criar fluxo');
        }
    };

    const handleToggleActive = async (flow: AutomationFlow) => {
        try {
            const { error } = await supabase
                .from('automations_flows')
                .update({ ativo: !flow.ativo })
                .eq('id', flow.id);

            if (error) throw error;

            setFlows(flows.map(f => f.id === flow.id ? { ...f, ativo: !f.ativo } : f));
            if (selectedFlow?.id === flow.id) {
                setSelectedFlow({ ...selectedFlow, ativo: !flow.ativo });
            }
            toast.success(`Fluxo ${!flow.ativo ? 'ativado' : 'desativado'}`);
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    return (
        <AdminLayout>
            <div className="container mx-auto p-6 h-[calc(100vh-4rem)] flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Automações Omnichannel</h1>
                        <p className="text-muted-foreground">Crie fluxos de comunicação automáticos para seus pacientes.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Filtro de Segmento */}
                        <Select value={filterSegment} onValueChange={setFilterSegment}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filtrar Segmento" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos os Segmentos</SelectItem>
                                <SelectItem value="geral">Geral</SelectItem>
                                <SelectItem value="saude">Saúde</SelectItem>
                                <SelectItem value="beleza">Beleza</SelectItem>
                                <SelectItem value="juridico">Jurídico</SelectItem>
                                <SelectItem value="automotivo">Automotivo</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={selectedTenantId || ''} onValueChange={setSelectedTenantId}>
                            <SelectTrigger className="w-[250px]">
                                <SelectValue placeholder="Selecione a Clínica (ou Global)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">-- Apenas Globais --</SelectItem>
                                {tenants.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <NewFlowDialog onCreate={handleCreateFlow} disabled={false} />
                    </div>
                </div>

                <div className="flex gap-6 flex-1 overflow-hidden">
                    {/* Sidebar Lista de Fluxos */}
                    <div className="w-80 border-r pr-6 flex flex-col gap-4 overflow-y-auto">
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                        ) : flows.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">Nenhum fluxo encontrado</div>
                        ) : (
                            flows.map(flow => (
                                <Card
                                    key={flow.id}
                                    className={`cursor-pointer transition-colors hover:bg-accent ${selectedFlow?.id === flow.id ? 'border-primary bg-accent/50' : ''}`}
                                    onClick={() => setSelectedFlow(flow)}
                                >
                                    <CardHeader className="p-4 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-sm font-medium leading-none truncate pr-2">
                                                {flow.nome}
                                            </CardTitle>
                                            <div className="flex gap-1 items-center">
                                                {flow.is_global && (
                                                    <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-blue-100 text-blue-700 hover:bg-blue-100">
                                                        Global
                                                    </Badge>
                                                )}
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <Switch
                                                        checked={flow.ativo}
                                                        onCheckedChange={() => handleToggleActive(flow)}
                                                        className="scale-75"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <CardDescription className="text-xs line-clamp-2">
                                            {flow.descricao || 'Sem descrição'}
                                        </CardDescription>
                                        {flow.is_global && flow.segmento && (
                                            <div className="pt-1">
                                                <Badge variant="outline" className="text-[10px] h-5 px-1">
                                                    {flow.segmento.charAt(0).toUpperCase() + flow.segmento.slice(1)}
                                                </Badge>
                                            </div>
                                        )}
                                    </CardHeader>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg border overflow-hidden flex flex-col">
                        {selectedFlow ? (
                            <FlowEditor flow={selectedFlow} key={selectedFlow.id} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Selecione ou crie um fluxo para começar
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function NewFlowDialog({ onCreate, disabled }: { onCreate: (nome: string, desc: string, isGlobal: boolean, segmento: string) => void, disabled?: boolean }) {
    const [open, setOpen] = useState(false);
    const [nome, setNome] = useState('');
    const [desc, setDesc] = useState('');
    const [isGlobal, setIsGlobal] = useState(false);
    const [segmento, setSegmento] = useState('geral');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate(nome, desc, isGlobal, segmento);
        setOpen(false);
        setNome('');
        setDesc('');
        setIsGlobal(false);
        setSegmento('geral');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button disabled={disabled && !isGlobal}><Plus className="mr-2 h-4 w-4" /> Nova Automação</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Criar Nova Automação</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Nome do Fluxo</Label>
                        <Input value={nome} onChange={e => setNome(e.target.value)} required placeholder="Ex: Lembrete de Consulta" />
                    </div>
                    <div>
                        <Label>Descrição</Label>
                        <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Opcional" />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch id="global-mode" checked={isGlobal} onCheckedChange={setIsGlobal} />
                        <Label htmlFor="global-mode">Automação Global (Todos os Tenants)</Label>
                    </div>

                    {isGlobal && (
                        <div>
                            <Label>Segmento de Atividade</Label>
                            <Select value={segmento} onValueChange={setSegmento}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o segmento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="geral">Geral (Todos)</SelectItem>
                                    <SelectItem value="saude">Saúde (Clínicas)</SelectItem>
                                    <SelectItem value="beleza">Beleza (Salões/Spas)</SelectItem>
                                    <SelectItem value="juridico">Jurídico (Advocacia)</SelectItem>
                                    <SelectItem value="automotivo">Automotivo (Oficinas)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                                Esta automação será aplicada apenas para tenants deste segmento.
                            </p>
                        </div>
                    )}

                    <Button type="submit" className="w-full">Criar</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function FlowEditor({ flow }: { flow: AutomationFlow }) {
    const [nodes, setNodes] = useState<AutomationNode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNodes();
    }, [flow.id]);

    const loadNodes = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('automations_nodes')
            .select('*')
            .eq('flow_id', flow.id)
            .order('ordem');
        setNodes(data || []);
        setLoading(false);
    };

    const addNode = async (type: NodeType, config: any) => {
        const ordem = nodes.length;
        const { data, error } = await supabase
            .from('automations_nodes')
            .insert({
                flow_id: flow.id,
                tipo: type,
                config_json: config,
                ordem
            })
            .select()
            .single();

        if (!error && data) {
            setNodes([...nodes, data]);

            // Auto-connect edge if not first node
            if (nodes.length > 0) {
                const lastNode = nodes[nodes.length - 1];
                await supabase.from('automations_edges').insert({
                    flow_id: flow.id,
                    from_node_id: lastNode.id,
                    to_node_id: data.id
                });
            }
        }
    };

    const deleteNode = async (id: string) => {
        await supabase.from('automations_nodes').delete().eq('id', id);
        loadNodes(); // Reload to fix edges/order
    };

    if (loading) return <div className="p-8">Carregando editor...</div>;

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b bg-white dark:bg-slate-950 flex justify-between items-center">
                <div>
                    <h2 className="font-semibold">{flow.nome}</h2>
                    <p className="text-xs text-muted-foreground">Editor de Sequência</p>
                </div>
                <div className="flex gap-2">
                    {/* Actions bar */}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {nodes.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50 dark:bg-slate-900/50">
                        <Play className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium">Comece seu fluxo</h3>
                        <p className="text-muted-foreground mb-6">Adicione um gatilho para iniciar esta automação.</p>
                        <AddNodeButton onAdd={addNode} isFirst={true} />
                    </div>
                )}

                {nodes.map((node, index) => (
                    <div key={node.id} className="relative">
                        {/* Connecting Line */}
                        {index > 0 && (
                            <div className="absolute -top-6 left-1/2 w-0.5 h-6 bg-slate-300 dark:bg-slate-700 -translate-x-1/2" />
                        )}

                        <NodeCard node={node} onDelete={() => deleteNode(node.id)} />

                        {/* Add Button between nodes? No, just at end for MVP sequence */}
                    </div>
                ))}

                {nodes.length > 0 && (
                    <div className="flex justify-center pt-4">
                        <AddNodeButton onAdd={addNode} isFirst={false} />
                    </div>
                )}
            </div>
        </div>
    );
}

function NodeCard({ node, onDelete }: { node: AutomationNode, onDelete: () => void }) {
    const icons = {
        trigger: Play,
        condition: GitBranch,
        action: MessageSquare
    };
    const Icon = icons[node.tipo];

    const getConfigLabel = () => {
        const c = node.config_json;
        if (node.tipo === 'trigger') return `Quando: ${c.event}`;
        if (node.tipo === 'action') return `Ação: ${c.action_type} (${c.message_type || 'operacional'})`;
        if (node.tipo === 'condition') return `Se: ${c.condition_type}`;
        return 'Configuração';
    };

    return (
        <Card className="w-full max-w-md mx-auto relative group hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2 rounded-lg ${node.tipo === 'trigger' ? 'bg-blue-100 text-blue-600' :
                    node.tipo === 'condition' ? 'bg-amber-100 text-amber-600' :
                        'bg-green-100 text-green-600'
                    }`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-0.5">
                        {node.tipo === 'trigger' ? 'Gatilho' : node.tipo === 'condition' ? 'Condição' : 'Ação'}
                    </div>
                    <div className="font-medium">{getConfigLabel()}</div>
                </div>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 text-destructive" onClick={onDelete}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    );
}

function AddNodeButton({ onAdd, isFirst }: { onAdd: (type: NodeType, config: any) => void, isFirst: boolean }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant={isFirst ? "default" : "outline"} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {isFirst ? "Adicionar Gatilho Inicial" : "Adicionar Passo"}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Passo</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {isFirst ? (
                        <div className="grid grid-cols-1 gap-2">
                            <Button variant="outline" className="justify-start h-auto py-3" onClick={() => onAdd('trigger', { event: 'onAppointmentCreated' })}>
                                <Play className="mr-2 h-4 w-4" /> Agendamento Criado
                            </Button>
                            <Button variant="outline" className="justify-start h-auto py-3" onClick={() => onAdd('trigger', { event: 'onAppointmentConfirmed' })}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Agendamento Confirmado
                            </Button>
                            <Button variant="outline" className="justify-start h-auto py-3" onClick={() => onAdd('trigger', { event: 'onAppointmentCancelled' })}>
                                <AlertTriangle className="mr-2 h-4 w-4" /> Agendamento Cancelado
                            </Button>
                            <Button variant="outline" className="justify-start h-auto py-3" onClick={() => onAdd('trigger', { event: 'onAppointmentNotConfirmed' })}>
                                <Clock className="mr-2 h-4 w-4" /> Cliente Não Confirmou (D-1)
                            </Button>
                            <Button variant="outline" className="justify-start h-auto py-3" onClick={() => onAdd('trigger', { event: 'onInvoiceDue' })}>
                                <Smartphone className="mr-2 h-4 w-4" /> Fatura Vencendo
                            </Button>
                        </div>
                    ) : (
                        <Tabs defaultValue="action">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="action">Ação</TabsTrigger>
                                <TabsTrigger value="condition">Condição</TabsTrigger>
                            </TabsList>
                            <TabsContent value="action" className="space-y-2">
                                <Button variant="outline" className="w-full justify-start" onClick={() => onAdd('action', { action_type: 'send_whatsapp', message_type: 'operacional', template: 'Olá {{paciente_nome}}, seu agendamento está confirmado!' })}>
                                    <MessageSquare className="mr-2 h-4 w-4" /> Enviar WhatsApp
                                </Button>
                                <Button variant="outline" className="w-full justify-start" onClick={() => onAdd('action', { action_type: 'send_email', template: 'Lembrete de consulta' })}>
                                    <Mail className="mr-2 h-4 w-4" /> Enviar E-mail
                                </Button>
                                <Button variant="outline" className="w-full justify-start" onClick={() => onAdd('action', { action_type: 'buscar_encaixe', expira_minutos: 30 })}>
                                    <UserPlus className="mr-2 h-4 w-4" /> Buscar Encaixe Automático
                                </Button>
                                <Button variant="outline" className="w-full justify-start" onClick={() => onAdd('action', { action_type: 'add_lista_espera' })}>
                                    <ListPlus className="mr-2 h-4 w-4" /> Adicionar à Lista de Espera
                                </Button>
                            </TabsContent>
                            <TabsContent value="condition" className="space-y-2">
                                <Button variant="outline" className="w-full justify-start" onClick={() => onAdd('condition', { condition_type: 'check_risk_noshow', threshold: 70 })}>
                                    <GitBranch className="mr-2 h-4 w-4" /> Risco de No-Show Alto
                                </Button>
                                <Button variant="outline" className="w-full justify-start" onClick={() => onAdd('condition', { condition_type: 'check_unit' })}>
                                    <Settings className="mr-2 h-4 w-4" /> Verificar Unidade
                                </Button>
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
