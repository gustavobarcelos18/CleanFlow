import React, { useState, useEffect } from 'react';
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
    Plus, Bell, Clock, CheckCircle2, AlertCircle, Calendar as CalendarIcon,
    Trash2, Users, Building2, UserCog
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Alarme {
    id: string;
    titulo: string;
    descricao: string;
    tipo: 'alarme' | 'lembrete' | 'tarefa';
    prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
    data_hora: string;
    concluido: boolean;
    ativo: boolean;
    canal_notificacao: string;
    usuario_id?: string;
    tenant_id?: string;
    support_user_id?: string;
    usuario?: {
        nome: string;
    };
    support_user?: {
        nome: string;
    };
    tenant?: {
        nome_fantasia: string;
    };
}

export default function AdminAlarmesLembretes() {
    const { profile } = useAuth();
    const [alarmes, setAlarmes] = useState<Alarme[]>([]);
    const [loading, setLoading] = useState(true);
    const [supportUsers, setSupportUsers] = useState<any[]>([]);
    const [tenants, setTenants] = useState<any[]>([]);

    useEffect(() => {
        loadData();
        loadAlarmes();
    }, []);

    const loadData = async () => {
        try {
            // Load Support Users
            const { data: support } = await supabase
                .from('usuarios_suporte' as any)
                .select('id, nome, auth_user_id')
                .eq('status', 'ativo');
            setSupportUsers(support || []);

            // Load Tenants
            const { data: tenantList } = await supabase
                .from('tenants' as any)
                .select('id, nome, nome_fantasia')
                .eq('status', 'ativo');
            setTenants(tenantList || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        }
    };

    const loadAlarmes = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('alarmes_lembretes')
                .select(`
                    *,
                    usuario:profiles!alarmes_lembretes_usuario_id_fkey(nome),
                    support_user:usuarios_suporte(nome),
                    tenant:tenants(nome_fantasia)
                `)
                .order('data_hora', { ascending: true });

            // If user is tenant-bound, filter by tenant. If support/admin, show all or filter differently.
            if (profile?.tenant_id) {
                query = query.eq('tenant_id', profile.tenant_id);
            }

            const { data, error } = await query;

            if (error) throw error;
            setAlarmes(data as any || []);
        } catch (error) {
            console.error('Erro ao carregar alarmes:', error);
            toast.error('Erro ao carregar alarmes');
        } finally {
            setLoading(false);
        }
    };

    const handleCriarAlarme = async (data: Partial<Alarme>) => {
        try {
            const { error } = await supabase
                .from('alarmes_lembretes')
                .insert(data);

            if (error) throw error;

            toast.success('Alarme criado com sucesso!');
            loadAlarmes();
        } catch (error) {
            console.error('Erro ao criar alarme:', error);
            toast.error('Erro ao criar alarme');
        }
    };

    const handleExcluir = async (id: string) => {
        try {
            const { error } = await supabase
                .from('alarmes_lembretes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Alarme excluído!');
            loadAlarmes();
        } catch (error) {
            toast.error('Erro ao excluir alarme');
        }
    };

    const getTipoBadge = (tipo: string) => {
        const configs = {
            alarme: { color: 'bg-red-100 text-red-800', icon: AlertCircle, label: 'Alarme' },
            lembrete: { color: 'bg-blue-100 text-blue-800', icon: Bell, label: 'Lembrete' },
            tarefa: { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Tarefa' }
        };

        const config = configs[tipo as keyof typeof configs] || configs.lembrete;
        const Icon = config.icon;

        return (
            <Badge className={config.color}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    const getPrioridadeBadge = (prioridade: string) => {
        const colors = {
            baixa: 'bg-gray-100 text-gray-800',
            media: 'bg-yellow-100 text-yellow-800',
            alta: 'bg-orange-100 text-orange-800',
            urgente: 'bg-red-100 text-red-800'
        };

        return (
            <Badge className={colors[prioridade as keyof typeof colors] || colors.media}>
                {prioridade.toUpperCase()}
            </Badge>
        );
    };

    return (
        <AdminLayout>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Gestão de Alarmes - Admin</h1>
                        <p className="text-muted-foreground">Gerencie alarmes e lembretes de toda a equipe</p>
                    </div>
                    <NovoAlarmeAdminDialog
                        onCreate={handleCriarAlarme}
                        supportUsers={supportUsers}
                        tenants={tenants}
                    />
                </div>

                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-8">Carregando...</div>
                    ) : alarmes.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground">Nenhum alarme encontrado</p>
                            </CardContent>
                        </Card>
                    ) : (
                        alarmes.map((alarme) => (
                            <Card key={alarme.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold">{alarme.titulo}</h3>
                                                {getTipoBadge(alarme.tipo)}
                                                {getPrioridadeBadge(alarme.prioridade)}
                                            </div>

                                            {alarme.descricao && (
                                                <p className="text-sm text-muted-foreground mb-2">{alarme.descricao}</p>
                                            )}

                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <CalendarIcon className="h-4 w-4" />
                                                    {format(new Date(alarme.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                </span>

                                                {/* Display assigned user/tenant */}
                                                {alarme.usuario && (
                                                    <span className="flex items-center gap-1" title="Usuário da Clínica">
                                                        <Users className="h-4 w-4" />
                                                        {alarme.usuario.nome}
                                                    </span>
                                                )}
                                                {alarme.support_user && (
                                                    <span className="flex items-center gap-1 text-blue-600" title="Usuário de Suporte">
                                                        <UserCog className="h-4 w-4" />
                                                        {alarme.support_user.nome}
                                                    </span>
                                                )}
                                                {alarme.tenant && !alarme.usuario && (
                                                    <span className="flex items-center gap-1 text-purple-600" title="Clínica">
                                                        <Building2 className="h-4 w-4" />
                                                        {alarme.tenant.nome_fantasia}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleExcluir(alarme.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}

function NovoAlarmeAdminDialog({ onCreate, supportUsers, tenants }: { onCreate: (data: any) => void; supportUsers: any[]; tenants: any[] }) {
    const [open, setOpen] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [tipo, setTipo] = useState('lembrete');
    const [prioridade, setPrioridade] = useState('media');
    const [data, setData] = useState<Date | undefined>(new Date());
    const [hora, setHora] = useState('09:00');
    const [canal, setCanal] = useState('sistema');

    const [targetType, setTargetType] = useState<'support' | 'tenant'>('support');
    const [selectedId, setSelectedId] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data || !selectedId) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        const [horas, minutos] = hora.split(':');
        const dataHora = new Date(data);
        dataHora.setHours(parseInt(horas), parseInt(minutos));

        const payload: any = {
            titulo,
            descricao,
            tipo,
            prioridade,
            data_hora: dataHora.toISOString(),
            canal_notificacao: canal,
        };

        if (targetType === 'support') {
            payload.support_user_id = selectedId;
            payload.usuario_id = null;
            payload.tenant_id = null;
        } else {
            payload.tenant_id = selectedId;
            payload.usuario_id = null;
            payload.support_user_id = null;
        }

        onCreate(payload);
        setOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setTitulo('');
        setDescricao('');
        setSelectedId('');
        setTargetType('support');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Novo Alarme
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Criar Alarme</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-3">
                        <Label>Destino do Alarme</Label>
                        <RadioGroup
                            value={targetType}
                            onValueChange={(v) => {
                                setTargetType(v as 'support' | 'tenant');
                                setSelectedId('');
                            }}
                            className="flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="support" id="r-support" />
                                <Label htmlFor="r-support" className="cursor-pointer">Equipe de Suporte</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="tenant" id="r-tenant" />
                                <Label htmlFor="r-tenant" className="cursor-pointer">Tenant (Clínica)</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div>
                        <Label>{targetType === 'support' ? 'Usuário de Suporte' : 'Selecione o Tenant'}</Label>
                        <Select value={selectedId} onValueChange={setSelectedId}>
                            <SelectTrigger>
                                <SelectValue placeholder={targetType === 'support' ? "Selecione um usuário..." : "Selecione uma clínica..."} />
                            </SelectTrigger>
                            <SelectContent>
                                {targetType === 'support' ? (
                                    supportUsers.map(u => (
                                        <SelectItem key={u.id} value={u.id}>
                                            {u.nome}
                                        </SelectItem>
                                    ))
                                ) : (
                                    tenants.map(t => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.nome_fantasia || t.nome}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Título</Label>
                        <Input
                            placeholder="Ex: Ligar para paciente"
                            value={titulo}
                            onChange={e => setTitulo(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <Label>Descrição</Label>
                        <Textarea
                            placeholder="Detalhes adicionais..."
                            value={descricao}
                            onChange={e => setDescricao(e.target.value)}
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Tipo</Label>
                            <Select value={tipo} onValueChange={setTipo}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="alarme">Alarme (Urgente)</SelectItem>
                                    <SelectItem value="lembrete">Lembrete</SelectItem>
                                    <SelectItem value="tarefa">Tarefa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Prioridade</Label>
                            <Select value={prioridade} onValueChange={setPrioridade}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="baixa">Baixa</SelectItem>
                                    <SelectItem value="media">Média</SelectItem>
                                    <SelectItem value="alta">Alta</SelectItem>
                                    <SelectItem value="urgente">Urgente</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Data</Label>
                            <Calendar
                                mode="single"
                                selected={data}
                                onSelect={setData}
                                locale={ptBR}
                                className="rounded-md border"
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <Label>Hora</Label>
                                <Input
                                    type="time"
                                    value={hora}
                                    onChange={e => setHora(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label>Canal de Notificação</Label>
                                <Select value={canal} onValueChange={setCanal}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sistema">Sistema</SelectItem>
                                        <SelectItem value="email">E-mail</SelectItem>
                                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                        <SelectItem value="todos">Todos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            Criar Alarme
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
