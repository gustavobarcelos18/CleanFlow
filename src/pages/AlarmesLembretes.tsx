import React, { useState, useEffect } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
    Plus, Bell, Clock, CheckCircle2, AlertCircle, Calendar as CalendarIcon,
    Trash2, Edit, Filter, TrendingUp
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
}

export default function AlarmesLembretes() {
    const { profile } = useAuth();
    const [alarmes, setAlarmes] = useState<Alarme[]>([]);
    const [filtroTipo, setFiltroTipo] = useState<string>('todos');
    const [filtroStatus, setFiltroStatus] = useState<string>('pendentes');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.tenant_id) {
            loadAlarmes();
        }
    }, [profile?.tenant_id, filtroTipo, filtroStatus]);

    const loadAlarmes = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from('alarmes_lembretes')
                .select('*')
                .eq('tenant_id', profile.tenant_id)
                .order('data_hora', { ascending: true });

            if (filtroTipo !== 'todos') {
                query = query.eq('tipo', filtroTipo);
            }

            if (filtroStatus === 'pendentes') {
                query = query.eq('concluido', false).eq('ativo', true);
            } else if (filtroStatus === 'concluidos') {
                query = query.eq('concluido', true);
            }

            const { data, error } = await query;

            if (error) throw error;
            setAlarmes(data || []);
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
                .insert({
                    tenant_id: profile.tenant_id,
                    usuario_id: profile.id,
                    ...data
                });

            if (error) throw error;

            toast.success('Alarme criado com sucesso!');
            loadAlarmes();
        } catch (error) {
            toast.error('Erro ao criar alarme');
        }
    };

    const handleConcluir = async (id: string) => {
        try {
            const { error } = await supabase.rpc('marcar_alarme_concluido', {
                p_alarme_id: id,
                p_usuario_id: profile.id
            });

            if (error) throw error;

            toast.success('Alarme concluído!');
            loadAlarmes();
        } catch (error) {
            toast.error('Erro ao concluir alarme');
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

    const isAtrasado = (dataHora: string) => {
        return new Date(dataHora) < new Date();
    };

    return (
        <MainLayout>
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Alarmes e Lembretes</h1>
                        <p className="text-muted-foreground">Gerencie seus alarmes, lembretes e tarefas</p>
                    </div>
                    <NovoAlarmeDialog onCreate={handleCriarAlarme} />
                </div>

                {/* Filtros */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Label>Tipo</Label>
                                <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="todos">Todos</SelectItem>
                                        <SelectItem value="alarme">Alarmes</SelectItem>
                                        <SelectItem value="lembrete">Lembretes</SelectItem>
                                        <SelectItem value="tarefa">Tarefas</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1">
                                <Label>Status</Label>
                                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pendentes">Pendentes</SelectItem>
                                        <SelectItem value="concluidos">Concluídos</SelectItem>
                                        <SelectItem value="todos">Todos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Lista de Alarmes */}
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
                            <Card key={alarme.id} className={`${isAtrasado(alarme.data_hora) && !alarme.concluido ? 'border-red-300 bg-red-50/50' : ''
                                }`}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold">{alarme.titulo}</h3>
                                                {getTipoBadge(alarme.tipo)}
                                                {getPrioridadeBadge(alarme.prioridade)}
                                                {isAtrasado(alarme.data_hora) && !alarme.concluido && (
                                                    <Badge variant="destructive">Atrasado</Badge>
                                                )}
                                                {alarme.concluido && (
                                                    <Badge className="bg-green-100 text-green-800">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Concluído
                                                    </Badge>
                                                )}
                                            </div>

                                            {alarme.descricao && (
                                                <p className="text-sm text-muted-foreground mb-2">{alarme.descricao}</p>
                                            )}

                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <CalendarIcon className="h-4 w-4" />
                                                    {format(new Date(alarme.data_hora), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Bell className="h-4 w-4" />
                                                    {alarme.canal_notificacao}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            {!alarme.concluido && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleConcluir(alarme.id)}
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleExcluir(alarme.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </MainLayout>
    );
}

function NovoAlarmeDialog({ onCreate }: { onCreate: (data: any) => void }) {
    const [open, setOpen] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [tipo, setTipo] = useState('lembrete');
    const [prioridade, setPrioridade] = useState('media');
    const [data, setData] = useState<Date | undefined>(new Date());
    const [hora, setHora] = useState('09:00');
    const [canal, setCanal] = useState('sistema');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data) {
            toast.error('Selecione uma data');
            return;
        }

        const [horas, minutos] = hora.split(':');
        const dataHora = new Date(data);
        dataHora.setHours(parseInt(horas), parseInt(minutos));

        onCreate({
            titulo,
            descricao,
            tipo,
            prioridade,
            data_hora: dataHora.toISOString(),
            canal_notificacao: canal
        });

        setOpen(false);
        setTitulo('');
        setDescricao('');
        setTipo('lembrete');
        setPrioridade('media');
        setData(new Date());
        setHora('09:00');
        setCanal('sistema');
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
                    <DialogTitle>Criar Alarme/Lembrete</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
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
