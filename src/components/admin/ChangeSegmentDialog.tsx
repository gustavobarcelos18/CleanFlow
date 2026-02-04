import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Check } from "lucide-react";

interface ChangeSegmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tenantId: string;
    onSuccess: () => void;
}

const SEGMENTOS = [
    { codigo: 'saude', nome: 'Saúde' },
    { codigo: 'estetica', nome: 'Estética & Beleza' },
    { codigo: 'veterinaria', nome: 'Veterinária' },
    { codigo: 'odontologia', nome: 'Odontologia' },
    { codigo: 'educacao', nome: 'Educação & Cursos' },
    { codigo: 'oficina', nome: 'Oficina & Serviços' },
];

export const ChangeSegmentDialog = ({ open, onOpenChange, tenantId, onSuccess }: ChangeSegmentDialogProps) => {
    const [loading, setLoading] = useState(false);
    const [checkingData, setCheckingData] = useState(true);
    const [hasData, setHasData] = useState(false);
    const [currentSegment, setCurrentSegment] = useState("");
    const [newSegment, setNewSegment] = useState("");
    const [dataCheckDetails, setDataCheckDetails] = useState<string[]>([]);

    useEffect(() => {
        if (open && tenantId) {
            fetchCurrentSegment();
            checkTenantData();
        }
    }, [open, tenantId]);

    const fetchCurrentSegment = async () => {
        try {
            const { data, error } = await supabase
                .from('tenant_profile')
                .select('segmentos')
                .eq('tenant_id', tenantId)
                .single();

            if (error) throw error;

            const segmentos = data?.segmentos as Array<{ codigo: string }> | null;
            const codigo = segmentos?.[0]?.codigo || '';
            setCurrentSegment(codigo);
            setNewSegment(codigo);
        } catch (error) {
            console.error("Error fetching segment:", error);
            toast.error("Erro ao carregar segmento atual");
        }
    };

    const checkTenantData = async () => {
        setCheckingData(true);
        setHasData(false);
        setDataCheckDetails([]);

        try {
            const details: string[] = [];
            let foundData = false;

            // Check Pacientes
            const { count: pacientesCount, error: pacientesError } = await supabase
                .from('pacientes')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId);

            if (pacientesError) throw pacientesError;
            if (pacientesCount && pacientesCount > 0) {
                foundData = true;
                details.push(`${pacientesCount} pacientes cadastrados`);
            }

            // Check Agendamentos
            const { count: agendamentosCount, error: agendamentosError } = await supabase
                .from('agendamentos')
                .select('*', { count: 'exact', head: true })
                .eq('tenant_id', tenantId);

            if (agendamentosError) throw agendamentosError;
            if (agendamentosCount && agendamentosCount > 0) {
                foundData = true;
                details.push(`${agendamentosCount} agendamentos registrados`);
            }

            // Check Prontuarios/Fichas (if table exists, assuming 'prontuarios' for now based on context)
            // We can add more checks here as needed.

            setHasData(foundData);
            setDataCheckDetails(details);

        } catch (error) {
            console.error("Error checking tenant data:", error);
            toast.error("Erro ao verificar dados do tenant");
        } finally {
            setCheckingData(false);
        }
    };

    const handleSave = async () => {
        if (newSegment === currentSegment) {
            onOpenChange(false);
            return;
        }

        setLoading(true);
        try {
            // Update tenant_profile
            // First get the current profile to preserve other fields if needed, 
            // but we are just updating the segments array.

            // We need to construct the segments array. Assuming single segment for now as per previous code.
            const newSegmentsArray = [{ codigo: newSegment }];

            const { error } = await supabase
                .from('tenant_profile')
                .update({ segments: newSegmentsArray } as any) // Type casting might be needed depending on generated types
                .eq('tenant_id', tenantId);

            if (error) throw error;

            // Log the action
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from("support_actions_log").insert({
                    support_user_id: user.id,
                    action_type: "tenant_segment_change",
                    target_type: "tenant",
                    target_id: tenantId,
                    description: `Segmento alterado de ${currentSegment} para ${newSegment}`,
                });
            }

            toast.success("Segmento alterado com sucesso");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Error changing segment:", error);
            toast.error("Erro ao alterar segmento");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Trocar Segmento do Tenant</DialogTitle>
                    <DialogDescription>
                        Alteração de segmento para correção de cadastro.
                    </DialogDescription>
                </DialogHeader>

                {checkingData ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Verificando dados...</span>
                    </div>
                ) : hasData ? (
                    <div className="space-y-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Alteração Bloqueada</AlertTitle>
                            <AlertDescription>
                                Este tenant possui dados cadastrados e não pode trocar de segmento.
                                <ul className="list-disc list-inside mt-2">
                                    {dataCheckDetails.map((detail, index) => (
                                        <li key={index}>{detail}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                        <p className="text-sm text-muted-foreground">
                            Para realizar a troca, o tenant deve excluir todos os dados inseridos manualmente.
                        </p>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Segmento Atual</Label>
                            <div className="p-2 border rounded bg-muted text-sm">
                                {SEGMENTOS.find(s => s.codigo === currentSegment)?.nome || currentSegment}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Novo Segmento</Label>
                            <Select value={newSegment} onValueChange={setNewSegment}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o novo segmento" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SEGMENTOS.map((seg) => (
                                        <SelectItem key={seg.codigo} value={seg.codigo} disabled={seg.codigo === currentSegment}>
                                            {seg.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Alert>
                            <Check className="h-4 w-4" />
                            <AlertTitle>Pronto para alterar</AlertTitle>
                            <AlertDescription>
                                Nenhum dado impeditivo foi encontrado. A troca pode ser realizada.
                            </AlertDescription>
                        </Alert>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={loading || newSegment === currentSegment}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Confirmar Troca
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
