import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Trash2, AlertTriangle, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface DeleteProfessionalDialogProps {
    professional: { id: string; nome: string };
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function DeleteProfessionalDialog({ professional, open, onOpenChange, onSuccess }: DeleteProfessionalDialogProps) {
    const [step, setStep] = useState<'backup' | 'confirm'>('backup');
    const [backupDownloaded, setBackupDownloaded] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { user, profile } = useAuth();

    const handleDownloadBackup = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('backup-professional', {
                body: {
                    action: 'export_backup',
                    professional_id: professional.id,
                    tenant_id: profile?.tenant_id,
                    user_id: user?.id
                }
            });

            if (error) throw error;

            // Trigger download
            const blob = new Blob([data.csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = data.filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setBackupDownloaded(true);
            toast({
                title: "Backup gerado com sucesso",
                description: "O arquivo CSV foi baixado. Guarde-o com segurança."
            });
        } catch (error) {
            console.error('Erro ao gerar backup:', error);
            toast({
                title: "Erro no backup",
                description: "Não foi possível gerar o backup. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmed || !backupDownloaded) return;

        setLoading(true);
        try {
            // 1. Log Audit (Delete attempt)
            await supabase.from('system_logs').insert({
                level: 'warning',
                message: `Exclusão de profissional iniciada: ${professional.nome}`,
                service: 'professional_management',
                user_id: user?.id,
                tenant_id: profile?.tenant_id,
                metadata: { professional_id: professional.id }
            });

            // 2. Delete (Logical or Physical based on policy - here physical delete as per existing flow but with checks)
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', professional.id);

            if (error) throw error;

            toast({
                title: "Profissional excluído",
                description: "O profissional foi removido com sucesso."
            });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast({
                title: "Erro ao excluir",
                description: "Não foi possível excluir o profissional.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Excluir Profissional: {professional.nome}</DialogTitle>
                    <DialogDescription>
                        Este processo é irreversível pela equipe CleanFlow. Siga os passos com atenção.
                    </DialogDescription>
                </DialogHeader>

                {step === 'backup' && (
                    <div className="space-y-4 py-4">
                        <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <AlertTitle className="text-yellow-800">Passo 1: Backup Obrigatório</AlertTitle>
                            <AlertDescription className="text-yellow-700">
                                Antes de excluir, você DEVE baixar um backup dos dados deste profissional.
                                Este arquivo é a ÚNICA forma de restaurar os dados futuramente.
                            </AlertDescription>
                        </Alert>

                        <div className="flex justify-center">
                            <Button
                                onClick={handleDownloadBackup}
                                disabled={loading}
                                variant="outline"
                                className="w-full"
                            >
                                {loading ? <FileDown className="mr-2 h-4 w-4 animate-bounce" /> : <Download className="mr-2 h-4 w-4" />}
                                {backupDownloaded ? "Baixar Novamente" : "Baixar Backup CSV"}
                            </Button>
                        </div>

                        {backupDownloaded && (
                            <div className="flex items-center space-x-2 pt-4">
                                <Checkbox
                                    id="backup-check"
                                    checked={step === 'confirm' || backupDownloaded} // Auto-check visual aid
                                    disabled
                                />
                                <Label htmlFor="backup-check" className="text-sm font-medium text-green-600">
                                    Backup realizado com sucesso
                                </Label>
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                onClick={() => setStep('confirm')}
                                disabled={!backupDownloaded}
                                className="w-full sm:w-auto"
                            >
                                Continuar para Exclusão
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 'confirm' && (
                    <div className="space-y-4 py-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Atenção: Ação Destrutiva</AlertTitle>
                            <AlertDescription>
                                Você está prestes a excluir permanentemente este profissional e seus vínculos atuais.
                            </AlertDescription>
                        </Alert>

                        <div className="flex items-start space-x-2 p-4 border rounded-md bg-muted/50">
                            <Checkbox
                                id="confirm-delete"
                                checked={confirmed}
                                onCheckedChange={(c) => setConfirmed(c as boolean)}
                            />
                            <Label htmlFor="confirm-delete" className="text-sm leading-tight">
                                Confirmo que baixei o backup CSV e entendo que a equipe CleanFlow não pode recuperar estes dados caso eu perca o arquivo.
                            </Label>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="ghost" onClick={() => setStep('backup')}>
                                Voltar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={!confirmed || loading}
                            >
                                {loading ? "Excluindo..." : "Confirmar Exclusão Definitiva"}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
