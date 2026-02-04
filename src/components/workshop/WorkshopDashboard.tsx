
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Car, Plus, Wrench, CheckCircle, Clock } from 'lucide-react';

interface Vehicle {
    id: string;
    identifier: string; // Placa
    description: string; // Modelo
    metadata: {
        ano?: string;
        km?: string;
        cor?: string;
    };
}

interface ServiceOrder {
    id: string;
    title: string;
    status: 'open' | 'in_progress' | 'waiting_parts' | 'done';
    customer_id: string;
    customer_name?: string; // Join
    vehicle_id?: string;
    vehicle_plate?: string; // Join/Metadata
    created_at: string;
}

export function WorkshopDashboard() {
    const [orders, setOrders] = useState<ServiceOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Fetch service files of type 'os'
            const { data, error } = await supabase
                .from('service_files')
                .select(`
                    *,
                    pacientes (nome)
                `)
                .eq('type', 'os')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedOrders: ServiceOrder[] = data.map(item => ({
                id: item.id,
                title: item.title,
                status: item.status as any,
                customer_id: item.customer_id,
                customer_name: item.pacientes?.nome,
                vehicle_plate: item.content?.placa,
                created_at: item.created_at
            }));

            setOrders(formattedOrders);
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('service_files')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus as any } : o));
            toast({ title: "Status atualizado!" });
        } catch (error) {
            toast({ title: "Erro ao atualizar", variant: "destructive" });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-500';
            case 'in_progress': return 'bg-yellow-500';
            case 'waiting_parts': return 'bg-orange-500';
            case 'done': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'open': return 'Aberto';
            case 'in_progress': return 'Em Andamento';
            case 'waiting_parts': return 'Aguardando Peças';
            case 'done': return 'Pronto';
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Wrench className="h-6 w-6" />
                    Oficina - Ordens de Serviço
                </h2>
                <NewOSDialog onSuccess={fetchOrders} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {['open', 'in_progress', 'waiting_parts', 'done'].map(status => (
                    <div key={status} className="bg-muted/50 p-4 rounded-lg min-h-[400px]">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                            {getStatusLabel(status)}
                            <Badge variant="outline" className="ml-auto">
                                {orders.filter(o => o.status === status).length}
                            </Badge>
                        </h3>

                        <div className="space-y-3">
                            {orders.filter(o => o.status === status).map(order => (
                                <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                    <CardContent className="p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-sm">{order.title}</span>
                                            {order.vehicle_plate && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {order.vehicle_plate}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-3">
                                            {order.customer_name}
                                        </p>

                                        <div className="flex gap-2 justify-end">
                                            {status !== 'done' && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => updateStatus(order.id, 'done')}
                                                    title="Marcar como Pronto"
                                                >
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                </Button>
                                            )}
                                            {status === 'open' && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => updateStatus(order.id, 'in_progress')}
                                                    title="Iniciar Serviço"
                                                >
                                                    <Clock className="h-4 w-4 text-blue-600" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function NewOSDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        customer_id: '',
        title: '',
        placa: '',
        descricao: ''
    });

    useEffect(() => {
        if (open) fetchCustomers();
    }, [open]);

    const fetchCustomers = async () => {
        const { data } = await supabase.from('pacientes').select('id, nome').order('nome');
        setCustomers(data || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user?.id).single();

            await supabase.from('service_files').insert({
                tenant_id: profile?.tenant_id,
                customer_id: formData.customer_id,
                type: 'os',
                title: formData.title,
                status: 'open',
                content: {
                    placa: formData.placa,
                    descricao: formData.descricao
                }
            });

            setOpen(false);
            onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Nova O.S.</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Ordem de Serviço</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Cliente</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formData.customer_id}
                            onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
                            required
                        >
                            <option value="">Selecione...</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label>Título (Ex: Revisão 10k)</Label>
                        <Input
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label>Placa do Veículo</Label>
                        <Input
                            value={formData.placa}
                            onChange={e => setFormData({ ...formData, placa: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label>Descrição do Problema</Label>
                        <Input
                            value={formData.descricao}
                            onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>Criar O.S.</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
