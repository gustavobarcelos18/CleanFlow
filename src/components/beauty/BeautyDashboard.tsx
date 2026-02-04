
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Scissors, Plus, ShoppingBag, Check, Trash2 } from 'lucide-react';

interface CommandItem {
    id: string;
    name: string;
    price: number;
    type: 'service' | 'product';
}

interface BeautyCommand {
    id: string;
    customer_id: string;
    customer_name?: string;
    status: 'open' | 'closed';
    items: CommandItem[];
    total: number;
    created_at: string;
}

export function BeautyDashboard() {
    const [commands, setCommands] = useState<BeautyCommand[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchCommands();
    }, []);

    const fetchCommands = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('service_files')
                .select(`
                    *,
                    pacientes (nome)
                `)
                .eq('type', 'comanda')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedCommands: BeautyCommand[] = data.map(item => ({
                id: item.id,
                customer_id: item.customer_id,
                customer_name: item.pacientes?.nome,
                status: item.status as any,
                items: item.content?.items || [],
                total: (item.content?.items || []).reduce((acc: number, curr: CommandItem) => acc + curr.price, 0),
                created_at: item.created_at
            }));

            setCommands(formattedCommands);
        } catch (error) {
            console.error("Error fetching commands:", error);
        } finally {
            setLoading(false);
        }
    };

    const closeCommand = async (id: string) => {
        try {
            const { error } = await supabase
                .from('service_files')
                .update({ status: 'closed' })
                .eq('id', id);

            if (error) throw error;

            setCommands(prev => prev.map(c => c.id === id ? { ...c, status: 'closed' } : c));
            toast({ title: "Comanda fechada com sucesso!" });
        } catch (error) {
            toast({ title: "Erro ao fechar comanda", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Scissors className="h-6 w-6" />
                    Comandas - Salão & Beleza
                </h2>
                <NewCommandDialog onSuccess={fetchCommands} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {commands.map(command => (
                    <Card key={command.id} className={`hover:shadow-md transition-shadow ${command.status === 'closed' ? 'opacity-70' : ''}`}>
                        <CardHeader className="pb-2 bg-muted/20">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-medium">
                                    {command.customer_name}
                                </CardTitle>
                                <Badge variant={command.status === 'closed' ? 'secondary' : 'default'}>
                                    {command.status === 'open' ? 'Aberta' : 'Fechada'}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {new Date(command.created_at).toLocaleString('pt-BR')}
                            </p>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="space-y-2">
                                {command.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            {item.type === 'service' ? <Scissors className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
                                            {item.name}
                                        </span>
                                        <span className="font-mono">R$ {item.price.toFixed(2)}</span>
                                    </div>
                                ))}
                                {command.items.length === 0 && <p className="text-sm text-muted-foreground italic">Nenhum item adicionado.</p>}
                            </div>

                            <div className="border-t pt-2 flex justify-between items-center font-bold">
                                <span>Total</span>
                                <span className="text-lg">R$ {command.total.toFixed(2)}</span>
                            </div>

                            {command.status === 'open' && (
                                <div className="flex gap-2">
                                    <AddItemDialog command={command} onSuccess={fetchCommands} />
                                    <Button
                                        variant="default"
                                        className="w-full bg-green-600 hover:bg-green-700"
                                        onClick={() => closeCommand(command.id)}
                                    >
                                        <Check className="h-4 w-4 mr-2" /> Fechar Conta
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function NewCommandDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [customerId, setCustomerId] = useState('');

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
                customer_id: customerId,
                type: 'comanda',
                status: 'open',
                content: { items: [] }
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
                <Button><Plus className="mr-2 h-4 w-4" /> Nova Comanda</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Abrir Nova Comanda</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Cliente</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={customerId}
                            onChange={e => setCustomerId(e.target.value)}
                            required
                        >
                            <option value="">Selecione...</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>Abrir Comanda</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function AddItemDialog({ command, onSuccess }: { command: BeautyCommand, onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [item, setItem] = useState({ name: '', price: '', type: 'service' as 'service' | 'product' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newItem: CommandItem = {
                id: crypto.randomUUID(),
                name: item.name,
                price: parseFloat(item.price),
                type: item.type
            };

            const newItems = [...command.items, newItem];

            await supabase
                .from('service_files')
                .update({ content: { items: newItems } })
                .eq('id', command.id);

            setOpen(false);
            setItem({ name: '', price: '', type: 'service' });
            onSuccess();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full"><Plus className="h-4 w-4 mr-2" /> Adicionar Item</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Serviço ou Produto</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Tipo</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={item.type}
                            onChange={(e: any) => setItem({ ...item, type: e.target.value })}
                        >
                            <option value="service">Serviço (Corte, Barba...)</option>
                            <option value="product">Produto (Shampoo, Pomada...)</option>
                        </select>
                    </div>
                    <div>
                        <Label>Descrição</Label>
                        <Input
                            value={item.name}
                            onChange={e => setItem({ ...item, name: e.target.value })}
                            placeholder="Ex: Corte Masculino"
                            required
                        />
                    </div>
                    <div>
                        <Label>Valor (R$)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={e => setItem({ ...item, price: e.target.value })}
                            placeholder="0.00"
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full">Adicionar</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
