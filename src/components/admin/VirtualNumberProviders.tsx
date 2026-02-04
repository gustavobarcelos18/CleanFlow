import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ProviderDialog } from "./ProviderDialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Provider {
    id: string;
    name: string;
    api_config: any;
    cost_per_number_monthly: number;
    cost_per_message: number;
    status: string;
    updated_at: string;
}

interface VirtualNumberProvidersProps {
    isMaster: boolean;
}

export const VirtualNumberProviders = ({ isMaster }: VirtualNumberProvidersProps) => {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState<Provider | null>(null);

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = async () => {
        try {
            const { data, error } = await supabase
                .from("virtual_number_providers")
                .select("*")
                .order("name");

            if (error) throw error;
            setProviders(data || []);
        } catch (error) {
            console.error("Error loading providers:", error);
            toast.error("Erro ao carregar provedores");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!isMaster) {
            toast.error("Apenas usuários Master podem excluir provedores.");
            return;
        }
        if (!confirm("Tem certeza que deseja excluir este provedor?")) return;

        try {
            const { error } = await supabase
                .from("virtual_number_providers")
                .delete()
                .eq("id", id);

            if (error) throw error;
            toast.success("Provedor excluído com sucesso");
            loadProviders();
        } catch (error) {
            console.error("Error deleting provider:", error);
            toast.error("Erro ao excluir provedor");
        }
    };

    return (
        <>
            <ProviderDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSuccess={loadProviders}
                editingProvider={editingProvider}
                isMaster={isMaster}
            />

            <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold">Provedores de Números Virtuais</h2>
                        <p className="text-muted-foreground">Gerencie as integrações e custos dos provedores.</p>
                    </div>
                    <Button onClick={() => {
                        setEditingProvider(null);
                        setDialogOpen(true);
                    }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Provedor
                    </Button>
                </div>

                {loading ? (
                    <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                ) : providers.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">Nenhum provedor cadastrado</p>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Provedor</TableHead>
                                    <TableHead>Custo/Número/Mês</TableHead>
                                    <TableHead>Custo/Mensagem</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {providers.map((provider) => (
                                    <TableRow key={provider.id}>
                                        <TableCell className="font-medium">{provider.name}</TableCell>
                                        <TableCell>R$ {provider.cost_per_number_monthly.toFixed(2)}</TableCell>
                                        <TableCell>R$ {provider.cost_per_message.toFixed(4)}</TableCell>
                                        <TableCell>
                                            <Badge variant={provider.status === 'active' ? 'default' : 'secondary'}>
                                                {provider.status === 'active' ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingProvider(provider);
                                                        setDialogOpen(true);
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDelete(provider.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>
        </>
    );
};
