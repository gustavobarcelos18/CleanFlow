import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  Plus,
  Trash2,
  MapPin,
  AlertTriangle,
  Info,
  ChevronRight,
  ChevronLeft,
  Loader2
} from 'lucide-react';

interface UnitData {
  id: string;
  nome_unidade: string;
  razao_social: string;
  documento: string;
  is_matriz: boolean;
}

interface OnboardingMultiUnitProps {
  onComplete: (units: UnitData[]) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function OnboardingMultiUnit({ onComplete, onBack, isLoading }: OnboardingMultiUnitProps) {
  const [units, setUnits] = useState<UnitData[]>([
    {
      id: crypto.randomUUID(),
      nome_unidade: 'Matriz',
      razao_social: '',
      documento: '',
      is_matriz: true
    }
  ]);

  const addUnit = () => {
    setUnits(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        nome_unidade: `Filial ${prev.length}`,
        razao_social: '',
        documento: '',
        is_matriz: false
      }
    ]);
  };

  const removeUnit = (id: string) => {
    const unit = units.find(u => u.id === id);
    if (unit?.is_matriz) return; // Can't remove matriz
    setUnits(prev => prev.filter(u => u.id !== id));
  };

  const updateUnit = (id: string, field: keyof UnitData, value: string | boolean) => {
    setUnits(prev => prev.map(u => 
      u.id === id ? { ...u, [field]: value } : u
    ));
  };

  const calculateTotal = () => {
    // R$ 49,90 base + 10% por unidade adicional
    const basePrice = 49.90;
    const additionalUnits = Math.max(0, units.length - 1);
    const additionalCost = additionalUnits * (basePrice * 0.10);
    return basePrice + additionalCost;
  };

  const isValid = () => {
    return units.every(u => u.nome_unidade.trim() && u.razao_social.trim());
  };

  const handleSubmit = () => {
    if (!isValid()) return;
    onComplete(units);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuração de Múltiplas Unidades</h2>
        <p className="text-muted-foreground">
          Configure as unidades/filiais da sua organização. Cada unidade terá seu próprio CNPJ e configurações.
        </p>
      </div>

      {/* Pricing Info */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Informação de cobrança:</strong> O plano Pro inclui 1 unidade.
          Cada unidade adicional tem um acréscimo de 10% sobre o valor do plano.
        </AlertDescription>
      </Alert>

      {/* Units List */}
      <div className="space-y-4">
        {units.map((unit, index) => (
          <Card key={unit.id} className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  {unit.is_matriz ? (
                    <Building2 className="h-5 w-5 text-primary" />
                  ) : (
                    <MapPin className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">Unidade {index + 1}</h3>
                  {unit.is_matriz && (
                    <Badge variant="secondary" className="text-xs">Matriz</Badge>
                  )}
                </div>
              </div>
              {!unit.is_matriz && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeUnit(unit.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor={`nome-${unit.id}`}>Nome da Unidade *</Label>
                <Input
                  id={`nome-${unit.id}`}
                  placeholder="Ex: Filial Centro"
                  value={unit.nome_unidade}
                  onChange={(e) => updateUnit(unit.id, 'nome_unidade', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`razao-${unit.id}`}>Razão Social *</Label>
                <Input
                  id={`razao-${unit.id}`}
                  placeholder="Nome legal da empresa"
                  value={unit.razao_social}
                  onChange={(e) => updateUnit(unit.id, 'razao_social', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor={`cnpj-${unit.id}`}>CNPJ</Label>
                <Input
                  id={`cnpj-${unit.id}`}
                  placeholder="00.000.000/0000-00"
                  value={unit.documento}
                  onChange={(e) => updateUnit(unit.id, 'documento', e.target.value)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Unit Button */}
      <Button
        variant="outline"
        onClick={addUnit}
        className="w-full border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Unidade
      </Button>

      {/* Summary */}
      <Card className="p-4 bg-muted/50">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Resumo do Plano</p>
            <p className="text-sm text-muted-foreground">
              {units.length} {units.length === 1 ? 'unidade' : 'unidades'} configuradas
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Valor mensal estimado</p>
            <p className="text-2xl font-bold text-primary">
              R$ {calculateTotal().toFixed(2).replace('.', ',')}
            </p>
          </div>
        </div>
      </Card>

      {/* Validation Warning */}
      {!isValid() && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Preencha o nome e a razão social de todas as unidades para continuar.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={handleSubmit} disabled={!isValid() || isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              Continuar
              <ChevronRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
