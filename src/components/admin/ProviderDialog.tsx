import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProviderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    editingProvider?: any;
    isMaster: boolean;
}

export const ProviderDialog = ({ open, onOpenChange, onSuccess, editingProvider, isMaster }: ProviderDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        api_config: "",
        cost_per_number_monthly: "",
        cost_per_message: "",
        status: true
    });

    useEffect(() => {
        if (editingProvider) {
            setFormData({
                name: editingProvider.name,
                api_config: isMaster ? JSON.stringify(editingProvider.api_config, null, 2) : "********",
                cost_per_number_monthly: editingProvider.cost_per_number_monthly.toString(),
                cost_per_message: editingProvider.cost_per_message.toString(),
                status: editingProvider.status === 'active'
            });
        } else {
            setFormData({
                name: "",
                api_config: "{}",
                cost_per_number_monthly: "0",
                cost_per_message: "0",
                status: true
            });
        }
    }, [editingProvider, open, isMaster]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!isMaster && formData.api_config !== "********") {
                toast.error("Apenas usuários Master podem alterar a configuração da API.");
                setLoading(false);
                return;
            }

            let parsedConfig = {};
            if (isMaster) {
                try {
                    parsedConfig = JSON.parse(formData.api_config);
                } catch (e) {
                    toast.error("Configuração da API inválida (JSON inválido)");
                    setLoading(false);
                    return;
                }
            } else if (editingProvider) {
                // Keep existing config if not master and not changed (masked)
                parsedConfig = editingProvider.api_config;
            }

            const providerData = {
                name: formData.name,
                api_config: parsedConfig,
                cost_per_number_monthly: parseFloat(formData.cost_per_number_monthly) || 0,
                cost_per_message: parseFloat(formData.cost_per_message) || 0,
                status: formData.status ? 'active' : 'inactive'
            };

            if (editingProvider) {
                const { error } = await supabase
                    .from("virtual_number_providers")
                    .update(providerData)
                    .eq("id", editingProvider.id);

                if (error) throw error;
                toast.success("Provedor atualizado com sucesso");
            } else {
                const { error } = await supabase
                    .from("virtual_number_providers")
                    .insert([providerData]);

                if (error) throw error;
                toast.success("Provedor criado com sucesso");
            }

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error saving provider:", error);
            toast.error("Erro ao salvar provedor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingProvider ? "Editar Provedor" : "Novo Provedor"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nome do Provedor</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="cost_number">Custo/Número/Mês (R$)</Label>
                            <Input
                                id="cost_number"
                                type="number"
                                step="0.01"
                                value={formData.cost_per_number_monthly}
                                onChange={(e) => setFormData({ ...formData, cost_per_number_monthly: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="cost_message">Custo/Mensagem (R$)</Label>
                            <Input
                                id="cost_message"
                                type="number"
                                step="0.0001"
                                value={formData.cost_per_message}
                                onChange={(e) => setFormData({ ...formData, cost_per_message: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="api_config">Configuração da API (JSON)</Label>
                        <Textarea
                            id="api_config"
                            value={formData.api_config}
                            onChange={(e) => setFormData({ ...formData, api_config: e.target.value })}
                            rows={5}
                            className="font-mono text-xs"
                            disabled={!isMaster}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="status"
                            checked={formData.status}
                            onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                        />
                        <Label htmlFor="status">Ativo</Label>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Salvando..." : "Salvar"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
