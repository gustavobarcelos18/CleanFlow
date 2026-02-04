import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from 'lucide-react';
import { useRetentionConfig } from '@/hooks/governance/useRetentionConfig';

export function RetentionSettings() {
    const { config, loading, updateConfig } = useRetentionConfig();
    const [localConfig, setLocalConfig] = React.useState(config);
    const [hasChanges, setHasChanges] = React.useState(false);

    React.useEffect(() => {
        setLocalConfig(config);
    }, [config]);

    const handleChange = (key: keyof typeof config, value: number[]) => {
        setLocalConfig(prev => ({ ...prev, [key]: value[0] }));
        setHasChanges(true);
    };

    const handleSave = () => {
        updateConfig(localConfig);
        setHasChanges(false);
    };

    if (loading) return <div>Carregando configurações...</div>;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configuração de Retenção de Dados</CardTitle>
                <CardDescription>
                    Defina por quanto tempo os dados do seu tenant serão armazenados.
                    Atenção: Dados removidos não podem ser recuperados.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <Alert variant="warning" className="bg-yellow-50 border-yellow-200">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">Impacto na Auditoria</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                        Reduzir o tempo de retenção de logs pode dificultar auditorias futuras e investigações de segurança.
                    </AlertDescription>
                </Alert>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Logs do Sistema (dias)</Label>
                            <span className="text-sm font-medium">{localConfig.retencao_logs_dias} dias</span>
                        </div>
                        <Slider
                            value={[localConfig.retencao_logs_dias]}
                            min={30}
                            max={730}
                            step={30}
                            onValueChange={(val) => handleChange('retencao_logs_dias', val)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Logs de erros, acessos e ações administrativas.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Mensagens (dias)</Label>
                            <span className="text-sm font-medium">{localConfig.retencao_mensagens_dias} dias</span>
                        </div>
                        <Slider
                            value={[localConfig.retencao_mensagens_dias]}
                            min={90}
                            max={1095}
                            step={30}
                            onValueChange={(val) => handleChange('retencao_mensagens_dias', val)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Histórico de mensagens do WhatsApp e logs de envio.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Dados Sensíveis (dias)</Label>
                            <span className="text-sm font-medium">{localConfig.retencao_dados_sensiveis_dias} dias</span>
                        </div>
                        <Slider
                            value={[localConfig.retencao_dados_sensiveis_dias]}
                            min={365}
                            max={3650}
                            step={365}
                            onValueChange={(val) => handleChange('retencao_dados_sensiveis_dias', val)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Dados pessoais e registros que exigem longa retenção legal.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={!hasChanges}>
                        Salvar Alterações
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
