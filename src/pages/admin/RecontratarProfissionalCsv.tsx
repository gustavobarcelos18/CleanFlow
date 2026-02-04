import React, { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const RecontratarProfissionalCsv = () => {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'upload' | 'preview' | 'finish'>('upload');
    const { toast } = useToast();
    const { user, profile } = useAuth();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setPreviewData(null);
            setStep('upload');
        }
    };

    const handlePreview = async () => {
        if (!file) return;

        setLoading(true);
        try {
            const text = await file.text();
            const lines = text.split('\n');

            // Basic CSV validation
            if (!lines[0].includes('entity,payload_json,hash_integridade,version')) {
                throw new Error("Formato CSV inválido. Verifique se é um backup oficial do CleanFlow.");
            }

            // Find professional row
            const professionalRow = lines.find(line => line.startsWith('professional,'));
            if (!professionalRow) throw new Error("Dados do profissional não encontrados no arquivo.");

            // Parse payload (handling potential CSV escaping issues simply for preview)
            // A robust parser would use a library, but for our specific format:
            const parts = professionalRow.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Split by comma ignoring quotes
            const payloadJson = JSON.parse(parts[1].replace(/^"|"$/g, '').replace(/""/g, '"'));
            const payload = JSON.parse(payloadJson); // Double parse because of CSV stringify

            setPreviewData({
                nome: payload.professional.nome,
                cpf: payload.professional.cpf,
                email: payload.professional.email,
                total_agendamentos: payload.agenda?.length || 0,
                version: parts[3]
            });
            setStep('preview');
        } catch (error: any) {
            console.error('Erro ao ler arquivo:', error);
            toast({
                title: "Erro na leitura",
                description: error.message || "Não foi possível ler o arquivo de backup.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setLoading(true);
        try {
            const text = await file.text();

            // Call Edge Function for secure import
            const { data, error } = await supabase.functions.invoke('backup-professional', {
                body: {
                    action: 'import_backup',
                    csv_content: text,
                    tenant_id: profile?.tenant_id,
                    user_id: user?.id
                }
            });

            if (error) throw error;

            setStep('finish');
            toast({
                title: "Sucesso",
                description: "Profissional recontratado com sucesso!"
            });

        } catch (error: any) {
            console.error('Erro na importação:', error);
            toast({
                title: "Erro na importação",
                description: "Falha ao processar o backup. Verifique a integridade do arquivo.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Recontratar Profissional</h1>
                    <p className="text-muted-foreground">
                        Restaure o cadastro e histórico de um profissional usando o backup CSV.
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Importar Backup CSV</CardTitle>
                        <CardDescription>
                            Selecione o arquivo gerado durante a exclusão do profissional.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {step === 'upload' && (
                            <div className="space-y-4">
                                <div className="grid w-full max-w-sm items-center gap-1.5">
                                    <Label htmlFor="csv-file">Arquivo de Backup (.csv)</Label>
                                    <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
                                </div>
                                <Button onClick={handlePreview} disabled={!file || loading}>
                                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                    Validar e Pré-visualizar
                                </Button>
                            </div>
                        )}

                        {step === 'preview' && previewData && (
                            <div className="space-y-4">
                                <Alert className="bg-blue-50 border-blue-200">
                                    <CheckCircle className="h-4 w-4 text-blue-600" />
                                    <AlertTitle className="text-blue-800">Arquivo Válido</AlertTitle>
                                    <AlertDescription className="text-blue-700">
                                        Backup versão {previewData.version} validado com sucesso.
                                    </AlertDescription>
                                </Alert>

                                <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                                    <div>
                                        <Label className="text-muted-foreground">Nome</Label>
                                        <p className="font-medium">{previewData.nome}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">CPF</Label>
                                        <p className="font-medium">{previewData.cpf || '-'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Email</Label>
                                        <p className="font-medium">{previewData.email || '-'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Registros Históricos</Label>
                                        <p className="font-medium">{previewData.total_agendamentos} agendamentos</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button variant="outline" onClick={() => setStep('upload')}>Voltar</Button>
                                    <Button onClick={handleImport} disabled={loading}>
                                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                        Confirmar Recontratação
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 'finish' && (
                            <div className="text-center py-8 space-y-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                                    <CheckCircle className="h-8 w-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-semibold">Profissional Recontratado!</h3>
                                <p className="text-muted-foreground">
                                    O cadastro foi restaurado e o profissional já está ativo novamente no sistema.
                                </p>
                                <Button onClick={() => window.location.href = '/profissionais'}>
                                    Voltar para Lista de Profissionais
                                </Button>
                            </div>
                        )}

                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
};

export default RecontratarProfissionalCsv;
