import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Plus,
  Trash2,
  AlertCircle,
  Crown
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PlanSelection } from '@/components/onboarding/PlanSelection';
import { fetchAddressByCEP } from '@/lib/cep';

interface OnboardingMultiUnidadeProps {
  onBack: () => void;
}

interface UnitData {
  id: string;
  nomeUnidade: string;
  razaoSocial: string;
  documento: string;
  cidade: string;
  estado: string;
  isMatriz: boolean;
}

const PRICE_PER_UNIT = 49.90; // Fallback price, should come from planData

export function OnboardingMultiUnidade({ onBack }: OnboardingMultiUnidadeProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [planData, setPlanData] = useState<{ planCode: string; price: number; priceId?: string; units?: number; couponCode?: string } | null>(null);

  const [orgData, setOrgData] = useState({
    nomeFantasia: '',
    razaoSocial: '',
    documento: '',
    telefone: '',
    cep: '',
    address: '',
    neighborhood: '',
    number: '',
    complement: '',
    cidade: '',
    estado: '',
  });

  const handleCepBlur = async () => {
    if (orgData.cep.length >= 8) {
      const address = await fetchAddressByCEP(orgData.cep);
      if (address) {
        setOrgData(prev => ({
          ...prev,
          address: address.logradouro,
          neighborhood: address.bairro,
          cidade: address.localidade,
          estado: address.uf
        }));
      }
    }
  };

  const [units, setUnits] = useState<UnitData[]>([
    { id: '1', nomeUnidade: 'Matriz', razaoSocial: '', documento: '', cidade: '', estado: '', isMatriz: true },
    { id: '2', nomeUnidade: '', razaoSocial: '', documento: '', cidade: '', estado: '', isMatriz: false },
  ]);

  const [lgpdAccepted, setLgpdAccepted] = useState(false);
  const [pricingAccepted, setPricingAccepted] = useState(false);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;
  // Use planData price if available, otherwise fallback
  const totalMonthly = planData ? planData.price : units.length * PRICE_PER_UNIT;

  const handlePlanSelect = (selection: { planCode: string; price: number; priceId?: string; units?: number; couponCode?: string }) => {
    setPlanData(selection);

    // Sync units count if provided
    if (selection.units && selection.units > 0) {
      setUnits(prev => {
        const currentCount = prev.length;
        const targetCount = selection.units || 2;

        if (targetCount > currentCount) {
          const newUnits = [...prev];
          for (let i = currentCount; i < targetCount; i++) {
            newUnits.push({
              id: Date.now().toString() + i,
              nomeUnidade: '',
              razaoSocial: '',
              documento: '',
              cidade: '',
              estado: '',
              isMatriz: false
            });
          }
          return newUnits;
        } else if (targetCount < currentCount) {
          // Keep Matriz and first N-1 units
          return prev.slice(0, targetCount);
        }
        return prev;
      });
    }

    setStep(2);
  };

  const addUnit = () => {
    setUnits([
      ...units,
      {
        id: Date.now().toString(),
        nomeUnidade: '',
        razaoSocial: '',
        documento: '',
        cidade: '',
        estado: '',
        isMatriz: false
      }
    ]);
  };

  const removeUnit = (id: string) => {
    const unit = units.find(u => u.id === id);
    if (unit?.isMatriz) {
      toast.error('Não é possível remover a matriz');
      return;
    }
    if (units.length <= 2) {
      toast.error('É necessário ter pelo menos 2 unidades');
      return;
    }
    setUnits(units.filter(u => u.id !== id));
  };

  const updateUnit = (id: string, field: keyof UnitData, value: string | boolean) => {
    setUnits(units.map(u => u.id === id ? { ...u, [field]: value } : u));
  };

  const validateStep2 = () => {
    if (!orgData.nomeFantasia || !orgData.razaoSocial || !orgData.documento) {
      toast.error('Preencha todos os campos obrigatórios');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    const invalidUnits = units.filter(u => !u.nomeUnidade || !u.razaoSocial || !u.documento);
    if (invalidUnits.length > 0) {
      toast.error('Preencha todos os campos obrigatórios de cada unidade');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep(s => Math.min(s + 1, totalSteps));
  };

  const handleBack = () => {
    if (step === 1) {
      onBack();
    } else {
      setStep(s => Math.max(s - 1, 1));
    }
  };

  const handleSubmit = async () => {
    if (!lgpdAccepted || !pricingAccepted) {
      toast.error('Aceite os termos para continuar');
      return;
    }

    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setLoading(true);
    try {
      // 1. Criar organização
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          nome_fantasia: orgData.nomeFantasia,
          razao_social: orgData.razaoSocial,
          documento: orgData.documento,
          telefone: orgData.telefone,
          cep: orgData.cep,
          logradouro: orgData.address,
          bairro: orgData.neighborhood,
          numero: orgData.number,
          complemento: orgData.complement,
          cidade: orgData.cidade,
          estado: orgData.estado,
          moeda: 'BRL',
          timezone: 'America/Sao_Paulo',
          status: 'ativo'
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // 2. Criar organization_settings
      await supabase
        .from('organization_settings')
        .insert({
          organization_id: org.id,
          politicas: { cancelamento: 24, lembretes: true, no_show: true },
          defaults: {},
          mensageria_default: 'central'
        });

      // 3. Criar unidades
      const unitsToInsert = units.map(unit => ({
        organization_id: org.id,
        nome_unidade: unit.nomeUnidade,
        razao_social: unit.razaoSocial,
        documento: unit.documento,
        is_matriz: unit.isMatriz,
        status: 'ativo'
      }));

      const { data: createdUnits, error: unitsError } = await supabase
        .from('units')
        .insert(unitsToInsert)
        .select();

      if (unitsError) throw unitsError;

      // 4. Criar unit_settings para cada unidade
      if (createdUnits && createdUnits.length > 0) {
        const unitSettingsData = createdUnits.map(createdUnit => ({
          organization_id: org.id,
          unit_id: createdUnit.id,
          override_flags: {},
          mensageria: { modo: 'herdar' },
          financeiro: {}
        }));

        await supabase.from('unit_settings').insert(unitSettingsData);
      }

      // 5. Atualizar profile do usuário com organization_id
      await supabase
        .from('profiles')
        .update({ organization_id: org.id })
        .eq('id', user.id);

      // 6. Criar role de org_admin para o usuário
      await supabase
        .from('user_unit_roles')
        .insert({
          user_id: user.id,
          organization_id: org.id,
          unit_id: null,
          role: 'org_admin'
        });

      // 7. Create Subscription
      console.log("[Onboarding] Criando assinatura...");

      if (planData.price > 0) {
        if (!planData.priceId) {
          toast.error("Erro de configuração: ID do preço não encontrado. Contate o suporte.");
          return;
        }

        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
          body: {
            priceId: planData.priceId,
            planSlug: planData.planCode,
            billingCycle: 'monthly',
            quantity: units.length // Pass quantity for multi-unit
          }
        });

        if (checkoutError) {
          console.error("Erro ao criar checkout:", checkoutError);
          toast.error("Erro ao iniciar pagamento.");
          return;
        }

        if (checkoutData?.url) {
          window.location.href = checkoutData.url;
          return;
        }
      } else {
        // Fallback for free plans or direct activation (not applicable for multi-unit usually)
        console.log("Plano gratuito ou sem preço configurado para multi-unidade?");
      }

      toast.success('Organização criada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao criar organização:', error);
      toast.error('Erro ao criar organização. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Cadastro de Múltiplas Unidades
              </h1>
              <p className="text-muted-foreground">
                Configure sua organização com várias filiais
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              Passo {step} de {totalSteps}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {step === 1 && (
          <PlanSelection
            edition="org"
            onSelect={handlePlanSelect}
            onBack={onBack}
          />
        )}

        {step === 2 && (
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Dados da Organização (Empresa Mãe)
              </CardTitle>
              <CardDescription>
                Informe os dados da empresa que gerenciará todas as unidades
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
                  <Input
                    id="nomeFantasia"
                    value={orgData.nomeFantasia}
                    onChange={e => setOrgData({ ...orgData, nomeFantasia: e.target.value })}
                    placeholder="Nome comercial da empresa"
                  />
                </div>
                <div>
                  <Label htmlFor="razaoSocial">Razão Social *</Label>
                  <Input
                    id="razaoSocial"
                    value={orgData.razaoSocial}
                    onChange={e => setOrgData({ ...orgData, razaoSocial: e.target.value })}
                    placeholder="Razão social completa"
                  />
                </div>
                <div>
                  <Label htmlFor="documento">CNPJ *</Label>
                  <Input
                    id="documento"
                    value={orgData.documento}
                    onChange={e => setOrgData({ ...orgData, documento: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={orgData.telefone}
                    onChange={e => setOrgData({ ...orgData, telefone: e.target.value })}
                    placeholder="+55 99 99999-9999"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 md:col-span-2">
                  <div className="col-span-1">
                    <Label htmlFor="cep">CEP *</Label>
                    <Input
                      id="cep"
                      value={orgData.cep}
                      onChange={e => setOrgData({ ...orgData, cep: e.target.value })}
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={orgData.address}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                  <div>
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      value={orgData.number}
                      onChange={e => setOrgData({ ...orgData, number: e.target.value })}
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={orgData.complement}
                      onChange={e => setOrgData({ ...orgData, complement: e.target.value })}
                      placeholder="Apto 101"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 md:col-span-2">
                  <div>
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={orgData.neighborhood}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        value={orgData.cidade}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Label htmlFor="estado">UF</Label>
                      <Input
                        id="estado"
                        value={orgData.estado}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end mt-6">
              <Button onClick={handleNext}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Cobrança por Unidade</p>
                  <p className="text-sm text-muted-foreground">
                    Cada unidade será cobrada a <strong>R$ {formatCurrency(PRICE_PER_UNIT)}/mês</strong> (plano Pró)
                  </p>
                </div>
                <Badge className="ml-auto" variant="secondary">
                  {units.length} unidades = R$ {formatCurrency(totalMonthly)}/mês
                </Badge>
              </div>
            </Card>

            {units.map((unit, index) => (
              <Card key={unit.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">
                      {unit.isMatriz ? 'Matriz (Unidade Principal)' : `Unidade ${index}`}
                    </h3>
                    {unit.isMatriz && <Badge>Matriz</Badge>}
                  </div>
                  {!unit.isMatriz && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUnit(unit.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome da Unidade *</Label>
                    <Input
                      value={unit.nomeUnidade}
                      onChange={e => updateUnit(unit.id, 'nomeUnidade', e.target.value)}
                      placeholder="Ex: Filial Centro, Unidade Shopping"
                    />
                  </div>
                  <div>
                    <Label>Razão Social *</Label>
                    <Input
                      value={unit.razaoSocial}
                      onChange={e => updateUnit(unit.id, 'razaoSocial', e.target.value)}
                      placeholder="Razão social da unidade"
                    />
                  </div>
                  <div>
                    <Label>CNPJ da Unidade *</Label>
                    <Input
                      value={unit.documento}
                      onChange={e => updateUnit(unit.id, 'documento', e.target.value)}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Cidade</Label>
                      <Input
                        value={unit.cidade}
                        onChange={e => updateUnit(unit.id, 'cidade', e.target.value)}
                        placeholder="Cidade"
                      />
                    </div>
                    <div>
                      <Label>UF</Label>
                      <Input
                        value={unit.estado}
                        onChange={e => updateUnit(unit.id, 'estado', e.target.value)}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <Button variant="outline" onClick={addUnit} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Outra Unidade
            </Button>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={handleNext}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                Confirmar Cadastro
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-6">
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Organização</h4>
                  <p className="text-lg font-semibold">{orgData.nomeFantasia}</p>
                  <p className="text-sm text-muted-foreground">{orgData.razaoSocial}</p>
                  <p className="text-sm text-muted-foreground">CNPJ: {orgData.documento}</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Unidades ({units.length})</h4>
                  <div className="space-y-2">
                    {units.map(unit => (
                      <div key={unit.id} className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{unit.nomeUnidade}</span>
                        {unit.isMatriz && <Badge variant="secondary">Matriz</Badge>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-medium mb-2">Resumo de Cobrança</h4>
                  <div className="flex justify-between items-center">
                    <span>{units.length} unidades x R$ {formatCurrency(PRICE_PER_UNIT)}</span>
                    <span className="text-2xl font-bold text-primary">
                      R$ {formatCurrency(totalMonthly)}/mês
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="lgpd"
                    checked={lgpdAccepted}
                    onCheckedChange={(checked) => setLgpdAccepted(checked as boolean)}
                  />
                  <Label htmlFor="lgpd" className="text-sm cursor-pointer">
                    Li e aceito os termos da LGPD e Política de Privacidade
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="pricing"
                    checked={pricingAccepted}
                    onCheckedChange={(checked) => setPricingAccepted(checked as boolean)}
                  />
                  <Label htmlFor="pricing" className="text-sm cursor-pointer">
                    Estou ciente da cobrança de R$ {formatCurrency(PRICE_PER_UNIT)} por unidade/mês
                  </Label>
                </div>
              </div>
            </CardContent>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? 'Criando...' : 'Finalizar Cadastro'}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
