
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Scale, Plus, FileText, Calendar, Gavel } from 'lucide-react';
import { format } from 'date-fns';

interface LegalCase {
    id: string;
    title: string; // "Processo vs Empresa X"
    status: 'open' | 'in_progress' | 'waiting_hearing' | 'closed';
    customer_id: string;
    customer_name?: string;
    process_number?: string;
    court?: string; // Tribunal
    next_deadline?: string;
    created_at: string;
}

export function LegalDashboard() {
    const [cases, setCases] = useState<LegalCase[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchCases();
    }, []);

    const fetchCases = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('service_files')
                .select(`
                    *,
                    pacientes (nome)
                `)
                .eq('type', 'processo')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedCases: LegalCase[] = data.map(item => ({
                id: item.id,
                title: item.title,
                status: item.status as any,
                customer_id: item.customer_id,
                customer_name: item.pacientes?.nome,
                process_number: item.content?.process_number,
                court: item.content?.court,
                next_deadline: item.content?.next_deadline,
                created_at: item.created_at
            }));

            setCases(formattedCases);
        } catch (error) {
            console.error("Error fetching cases:", error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'open': return 'Inicial';
            case 'in_progress': return 'Em Andamento';
            case 'waiting_hearing': return 'Aguardando Audiência';
            case 'closed': return 'Encerrado';
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Scale className="h-6 w-6" />
                    Gestão de Processos
                </h2>
                <NewCaseDialog onSuccess={fetchCases} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cases.map(legalCase => (
                    <Card key={legalCase.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg font-medium truncate" title={legalCase.title}>
                                    {legalCase.title}
                                </CardTitle>
                                <Badge variant={legalCase.status === 'closed' ? 'secondary' : 'default'}>
                                    {getStatusLabel(legalCase.status)}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{legalCase.customer_name}</p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Gavel className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono">{legalCase.process_number || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span>{legalCase.court || 'Tribunal não informado'}</span>
                            </div>
                            {legalCase.next_deadline && (
                                <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
                                    <Calendar className="h-4 w-4" />
                                    <span>Prazo: {format(new Date(legalCase.next_deadline), 'dd/MM/yyyy')}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
                {cases.length === 0 && (
                    <div className="col-span-3 text-center py-12 text-muted-foreground">
                        Nenhum processo cadastrado.
                    </div>
                )}
            </div>
        </div>
    );
}

function NewCaseDialog({ onSuccess }: { onSuccess: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        customer_id: '',
        title: '',
        process_number: '',
        court: '',
        next_deadline: ''
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
                type: 'processo',
                title: formData.title,
                status: 'open',
                content: {
                    process_number: formData.process_number,
                    court: formData.court,
                    next_deadline: formData.next_deadline
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
                <Button><Plus className="mr-2 h-4 w-4" /> Novo Processo</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Cadastrar Processo</DialogTitle>
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
                        <Label>Título do Caso (Ex: Ação Trabalhista)</Label>
                        <Input
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label>Número do Processo (CNJ)</Label>
                        <Input
                            value={formData.process_number}
                            onChange={e => setFormData({ ...formData, process_number: e.target.value })}
                            placeholder="0000000-00.0000.0.00.0000"
                        />
                    </div>
                    <div>
                        <Label>Vara / Tribunal</Label>
                        <Input
                            value={formData.court}
                            onChange={e => setFormData({ ...formData, court: e.target.value })}
                            placeholder="Ex: 1ª Vara Cível de SP"
                        />
                    </div>
                    <div>
                        <Label>Próximo Prazo / Audiência</Label>
                        <Input
                            type="date"
                            value={formData.next_deadline}
                            onChange={e => setFormData({ ...formData, next_deadline: e.target.value })}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>Cadastrar Processo</Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
