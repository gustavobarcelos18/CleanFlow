
import React from 'react';
import { useSegmentStore } from '@/stores/useSegmentStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface DynamicFormProps {
    data: Record<string, any>;
    onChange: (key: string, value: any) => void;
}

export function DynamicForm({ data, onChange }: DynamicFormProps) {
    const { currentSegment } = useSegmentStore();
    const features = currentSegment?.features || [];

    // Render fields based on active features
    // This is a simplified version. In a real app, we would iterate over a schema.

    return (
        <div className="space-y-4 border-t pt-4 mt-4">
            <h4 className="font-medium text-sm text-muted-foreground">Informações Específicas ({currentSegment?.name})</h4>

            {/* OFICINA / AUTOMOTIVO */}
            {features.includes('veiculos') && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Placa do Veículo</Label>
                        <Input
                            value={data.placa || ''}
                            onChange={(e) => onChange('placa', e.target.value)}
                            placeholder="ABC-1234"
                        />
                    </div>
                    <div>
                        <Label>Modelo/Marca</Label>
                        <Input
                            value={data.modelo || ''}
                            onChange={(e) => onChange('modelo', e.target.value)}
                            placeholder="Ex: Fiat Uno 2010"
                        />
                    </div>
                </div>
            )}

            {/* JURIDICO */}
            {features.includes('processos') && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label>Número do Processo Principal</Label>
                        <Input
                            value={data.processo_principal || ''}
                            onChange={(e) => onChange('processo_principal', e.target.value)}
                            placeholder="0000000-00.0000.0.00.0000"
                        />
                    </div>
                    <div>
                        <Label>Vara / Tribunal</Label>
                        <Input
                            value={data.tribunal || ''}
                            onChange={(e) => onChange('tribunal', e.target.value)}
                            placeholder="Ex: 3ª Vara Cível de SP"
                        />
                    </div>
                </div>
            )}

            {/* SAUDE (Default) */}
            {features.includes('anamnese') && (
                <div>
                    <Label>Queixa Principal / Observações Iniciais</Label>
                    <Textarea
                        value={data.queixa_principal || ''}
                        onChange={(e) => onChange('queixa_principal', e.target.value)}
                        placeholder="Descreva o motivo da consulta..."
                    />
                </div>
            )}
        </div>
    );
}
