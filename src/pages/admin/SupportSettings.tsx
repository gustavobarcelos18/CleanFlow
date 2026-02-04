import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Bot, Plus, Trash2, Save, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminLayout } from "@/components/layout/AdminLayout";

export default function SupportSettings() {
    return (
        <AdminLayout>
            <div className="container mx-auto p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Configurações de Suporte</h1>
                    <p className="text-muted-foreground">Gerencie horários, feriados e o robô de atendimento.</p>
                </div>

                <Tabs defaultValue="hours" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="hours">Horário de Atendimento</TabsTrigger>
                        <TabsTrigger value="holidays">Feriados</TabsTrigger>
                        <TabsTrigger value="bot">Robô de Atendimento</TabsTrigger>
                    </TabsList>

                    <TabsContent value="hours">
                        <OperatingHoursSettings />
                    </TabsContent>

                    <TabsContent value="holidays">
                        <HolidaysSettings />
                    </TabsContent>

                    <TabsContent value="bot">
                        <BotKnowledgeBaseSettings />
                    </TabsContent>
                </Tabs>
            </div>
        </AdminLayout>
    );
}

function OperatingHoursSettings() {
    const [hours, setHours] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHours();
    }, []);

    const loadHours = async () => {
        setLoading(true);
        const { data } = await (supabase as any).from('support_operating_hours').select('*').order('day_of_week');
        setHours(data || []);
        setLoading(false);
    };

    const handleSave = async (day: any) => {
        const { error } = await (supabase as any)
            .from('support_operating_hours')
            .upsert({
                day_of_week: day.day_of_week,
                start_time: day.start_time,
                end_time: day.end_time,
                is_active: day.is_active
            }, { onConflict: 'day_of_week' });

        if (error) {
            toast.error('Erro ao salvar horário');
        } else {
            toast.success('Horário salvo com sucesso');
            loadHours();
        }
    };

    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Horário de Funcionamento</CardTitle>
                <CardDescription>Defina os horários em que a equipe de suporte está disponível.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {days.map((dayName, index) => {
                        const dayConfig = hours.find(h => h.day_of_week === index) || {
                            day_of_week: index,
                            start_time: '09:00',
                            end_time: '18:00',
                            is_active: index > 0 && index < 6
                        };

                        return (
                            <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                                <div className="w-32 font-medium">{dayName}</div>
                                <Switch
                                    checked={dayConfig.is_active}
                                    onCheckedChange={(checked) => handleSave({ ...dayConfig, is_active: checked })}
                                />
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="time"
                                        value={dayConfig.start_time}
                                        onChange={(e) => handleSave({ ...dayConfig, start_time: e.target.value })}
                                        disabled={!dayConfig.is_active}
                                        className="w-32"
                                    />
                                    <span>até</span>
                                    <Input
                                        type="time"
                                        value={dayConfig.end_time}
                                        onChange={(e) => handleSave({ ...dayConfig, end_time: e.target.value })}
                                        disabled={!dayConfig.is_active}
                                        className="w-32"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

function HolidaysSettings() {
    const [holidays, setHolidays] = useState<any[]>([]);
    const [newDate, setNewDate] = useState('');
    const [newDesc, setNewDesc] = useState('');

    useEffect(() => {
        loadHolidays();
    }, []);

    const loadHolidays = async () => {
        const { data } = await (supabase as any).from('support_holidays').select('*').order('date');
        setHolidays(data || []);
    };

    const handleAdd = async () => {
        if (!newDate || !newDesc) return;
        const { error } = await (supabase as any).from('support_holidays').insert({ date: newDate, description: newDesc });
        if (error) toast.error('Erro ao adicionar feriado');
        else {
            toast.success('Feriado adicionado');
            setNewDate('');
            setNewDesc('');
            loadHolidays();
        }
    };

    const handleDelete = async (id: string) => {
        const { error } = await (supabase as any).from('support_holidays').delete().eq('id', id);
        if (error) toast.error('Erro ao remover feriado');
        else {
            toast.success('Feriado removido');
            loadHolidays();
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Feriados e Pausas</CardTitle>
                <CardDescription>Adicione dias em que o suporte não estará disponível.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex gap-4 items-end">
                    <div className="space-y-2">
                        <Label>Data</Label>
                        <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                    </div>
                    <div className="space-y-2 flex-1">
                        <Label>Descrição</Label>
                        <Input placeholder="Ex: Natal" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                    </div>
                    <Button onClick={handleAdd}><Plus className="mr-2 h-4 w-4" /> Adicionar</Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {holidays.map(h => (
                            <TableRow key={h.id}>
                                <TableCell>{new Date(h.date).toLocaleDateString('pt-BR')}</TableCell>
                                <TableCell>{h.description}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(h.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

function BotKnowledgeBaseSettings() {
    const [items, setItems] = useState<any[]>([]);
    const [open, setOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        const { data } = await (supabase as any).from('support_knowledge_base').select('*').order('use_count', { ascending: false });
        setItems(data || []);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const question = formData.get('question') as string;
        const answer = formData.get('answer') as string;
        const keywords = (formData.get('keywords') as string).split(',').map(k => k.trim()).filter(k => k);

        const payload = { question, answer, keywords };

        let error;
        if (editingItem) {
            const { error: err } = await (supabase as any).from('support_knowledge_base').update(payload).eq('id', editingItem.id);
            error = err;
        } else {
            const { error: err } = await (supabase as any).from('support_knowledge_base').insert(payload);
            error = err;
        }

        if (error) toast.error('Erro ao salvar item');
        else {
            toast.success('Item salvo com sucesso');
            setOpen(false);
            setEditingItem(null);
            loadItems();
        }
    };

    const handleDelete = async (id: string) => {
        const { error } = await (supabase as any).from('support_knowledge_base').delete().eq('id', id);
        if (error) toast.error('Erro ao remover item');
        else {
            toast.success('Item removido');
            loadItems();
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Base de Conhecimento do Robô</CardTitle>
                    <CardDescription>Ensine o robô a responder perguntas frequentes.</CardDescription>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingItem(null)}>
                            <Plus className="mr-2 h-4 w-4" /> Nova Pergunta
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingItem ? 'Editar' : 'Nova'} Pergunta</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Pergunta do Usuário</Label>
                                <Input name="question" defaultValue={editingItem?.question} required placeholder="Ex: Como altero minha senha?" />
                            </div>
                            <div className="space-y-2">
                                <Label>Resposta do Robô</Label>
                                <Textarea name="answer" defaultValue={editingItem?.answer} required placeholder="Explique passo a passo..." rows={5} />
                            </div>
                            <div className="space-y-2">
                                <Label>Palavras-chave (separadas por vírgula)</Label>
                                <Input name="keywords" defaultValue={editingItem?.keywords?.join(', ')} placeholder="senha, alterar, mudar" />
                            </div>
                            <Button type="submit" className="w-full">Salvar</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Pergunta</TableHead>
                            <TableHead>Resposta</TableHead>
                            <TableHead>Uso</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map(item => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.question}</TableCell>
                                <TableCell className="max-w-md truncate">{item.answer}</TableCell>
                                <TableCell>{item.use_count}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setOpen(true); }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
