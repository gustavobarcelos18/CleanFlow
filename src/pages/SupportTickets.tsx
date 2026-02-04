import React, { useState, useEffect } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
    Plus, MessageSquare, Clock, CheckCircle2, XCircle,
    AlertCircle, HelpCircle, Bug, Lightbulb, DollarSign
} from "lucide-react";

interface SupportTicket {
    id: string;
    titulo: string;
    descricao: string;
    categoria: string;
    prioridade: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export default function SupportTickets() {
    const { profile } = useAuth();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.tenant_id) {
            loadTickets();
        }
    }, [profile?.tenant_id]);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('tenant_id', profile.tenant_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTickets(data || []);
        } catch (error) {
            console.error('Erro ao carregar chamados:', error);
            toast.error('Erro ao carregar chamados');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (data: Partial<SupportTicket>) => {
        try {
            const { error } = await supabase
                .from('support_tickets')
                .insert({
                    tenant_id: profile.tenant_id,
                    usuario_id: profile.id,
                    ...data
                });

            if (error) throw error;

            toast.success('Chamado aberto com sucesso!');
            loadTickets();
        } catch (error) {
            toast.error('Erro ao abrir chamado');
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: any; icon: any; label: string }> = {
            aberto: { variant: 'default', icon: Clock, label: 'Aberto' },
            em_andamento: { variant: 'secondary', icon: MessageSquare, label: 'Em Andamento' },
            aguardando_cliente: { variant: 'outline', icon: AlertCircle, label: 'Aguardando' },
            resolvido: { variant: 'default', icon: CheckCircle2, label: 'Resolvido' },
            fechado: { variant: 'secondary', icon: XCircle, label: 'Fechado' }
        };

        const config = variants[status] || variants.aberto;
        const Icon = config.icon;

        return (
            <Badge variant={config.variant as any}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
            </Badge>
        );
    };

    const getPrioridadeBadge = (prioridade: string) => {
        const colors: Record<string, string> = {
            baixa: 'bg-gray-100 text-gray-800',
            media: 'bg-blue-100 text-blue-800',
            alta: 'bg-orange-100 text-orange-800',
            urgente: 'bg-red-100 text-red-800'
        };

        return (
            <Badge className={colors[prioridade] || colors.media}>
                {prioridade.toUpperCase()}
            </Badge>
        );
    };

    const getCategoriaIcon = (categoria: string) => {
        const icons: Record<string, any> = {
            tecnico: Bug,
            financeiro: DollarSign,
            duvida: HelpCircle,
            sugestao: Lightbulb,
            bug: AlertCircle
        };

        const Icon = icons[categoria] || HelpCircle;
        return <Icon className="h-5 w-5" />;
    };

    return (
        <MainLayout>
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Suporte Técnico</h1>
                        <p className="text-muted-foreground">Abra chamados e acompanhe o atendimento</p>
                    </div>
                    <NovoTicketDialog onCreate={handleCreateTicket} />
                </div>

                {/* Lista de Chamados */}
                <div className="grid gap-4">
                    {loading ? (
                        <div className="text-center py-8">Carregando...</div>
                    ) : tickets.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground">Nenhum chamado aberto</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Clique em "Novo Chamado" para abrir um ticket de suporte
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        tickets.map((ticket) => (
                            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {getCategoriaIcon(ticket.categoria)}
                                                <h3 className="font-semibold text-lg">{ticket.titulo}</h3>
                                            </div>
                                            <p className="text-muted-foreground mb-4">{ticket.descricao}</p>
                                            <div className="flex items-center gap-3">
                                                {getStatusBadge(ticket.status)}
                                                {getPrioridadeBadge(ticket.prioridade)}
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(ticket.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            Ver Detalhes
                                        </Button>
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

function NovoTicketDialog({ onCreate }: { onCreate: (data: Partial<SupportTicket>) => void }) {
    const [open, setOpen] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');
    const [categoria, setCategoria] = useState('tecnico');
    const [prioridade, setPrioridade] = useState('media');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({
            titulo,
            descricao,
            categoria,
            prioridade
        });
        setOpen(false);
        setTitulo('');
        setDescricao('');
        setCategoria('tecnico');
        setPrioridade('media');
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Novo Chamado
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Abrir Chamado de Suporte</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Título</Label>
                        <Input
                            placeholder="Descreva resumidamente o problema"
                            value={titulo}
                            onChange={e => setTitulo(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <Label>Descrição Detalhada</Label>
                        <Textarea
                            placeholder="Descreva o problema em detalhes, incluindo passos para reproduzir se aplicável"
                            value={descricao}
                            onChange={e => setDescricao(e.target.value)}
                            rows={5}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Categoria</Label>
                            <Select value={categoria} onValueChange={setCategoria}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tecnico">
                                        <div className="flex items-center gap-2">
                                            <Bug className="h-4 w-4" />
                                            Problema Técnico
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="financeiro">
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            Financeiro
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="duvida">
                                        <div className="flex items-center gap-2">
                                            <HelpCircle className="h-4 w-4" />
                                            Dúvida
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="sugestao">
                                        <div className="flex items-center gap-2">
                                            <Lightbulb className="h-4 w-4" />
                                            Sugestão
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="bug">
                                        <div className="flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            Bug/Erro
                                        </div>
                                    </SelectItem>
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

                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Dica:</strong> Quanto mais detalhes você fornecer, mais rápido conseguiremos resolver seu problema.
                        </p>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit">
                            Abrir Chamado
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
