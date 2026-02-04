import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { PlanSelection } from "@/components/onboarding/PlanSelection";
import { fetchAddressByCEP } from "@/lib/cep";

interface OnboardingProfessionalProps {
  onBack: () => void;
}

const SEGMENTS = [
  "Advocacia",
  "Aula Particular",
  "Consultoria",
  "Estética",
  "Fisioterapia",
  "Laboratório",
  "Lava-rápido",
  "Marcenaria",
  "Medicina",
  "Nutrição",
  "Odontologia",
  "Oficina",
  "Personal Trainer",
  "Podologia",
  "Psicologia",
  "Outro"
];

export function OnboardingProfessional({ onBack }: OnboardingProfessionalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [planData, setPlanData] = useState<{ planCode: string; price: number; priceId?: string; couponCode?: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    cep: "",
    address: "",
    neighborhood: "",
    number: "",
    complement: "",
    city: "",
    state: "",
    segment: "",
    otherSegment: "",
    hasOtherSegment: false,
    services: [{ name: "", duration: "", price: "" }],
    scheduleMode: "professional",
    lgpdAccepted: false,
  });

  const handleCepBlur = async () => {
    if (formData.cep.length >= 8) {
      const address = await fetchAddressByCEP(formData.cep);
      if (address) {
        setFormData(prev => ({
          ...prev,
          address: address.logradouro,
          neighborhood: address.bairro,
          city: address.localidade,
          state: address.uf
        }));
      }
    }
  };

  const handleSegmentSelect = (value: string) => {
    if (value === "Outro") {
      setFormData((prev) => ({
        ...prev,
        segment: "",
        hasOtherSegment: true,
        otherSegment: ""
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        segment: value,
        hasOtherSegment: false,
        otherSegment: ""
      }));
    }
  };

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, { name: "", duration: "", price: "" }],
    }));
  };

  const removeService = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const handleServiceChange = (index: number, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((service, i) =>
        i === index ? { ...service, [field]: value } : service
      ),
    }));
  };

  const handlePriceBlur = (index: number) => {
    const service = formData.services[index];
    if (!service.price) return;

    let valStr = service.price;
    valStr = valStr.replace(/\./g, '');
    valStr = valStr.replace(',', '.');

    const val = parseFloat(valStr);

    if (!isNaN(val)) {
      const formatted = val.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      handleServiceChange(index, "price", formatted);
    }
  };

  const handlePlanSelect = (selection: { planCode: string; price: number; priceId?: string; couponCode?: string }) => {
    setPlanData(selection);
    setStep(4);
  };

  const handleSubmit = async () => {
    if (!formData.lgpdAccepted) {
      toast({
        title: "Aceite necessário",
        description: "Você precisa aceitar os termos da LGPD para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (!planData) {
      toast({
        title: "Plano não selecionado",
        description: "Por favor, selecione um plano.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log("[Onboarding] Iniciando processo de cadastro...");

      let currentUser = user;

      if (!currentUser) {
        const { data: { user: fetchedUser }, error: userError } = await supabase.auth.getUser();

        if (userError || !fetchedUser) {
          sonnerToast.error("Sessão expirada. Por favor, faça login novamente.");
          return;
        }
        currentUser = fetchedUser;
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id, tenant_id")
        .eq("id", currentUser.id)
        .single();

      if (existingProfile?.tenant_id) {
        navigate("/dashboard");
        return;
      }

      const segmentsArray = formData.hasOtherSegment && formData.otherSegment
        ? [formData.otherSegment]
        : [formData.segment];

      const { data: tenant, error: tenantError } = await (supabase as any)
        .from("tenants")
        .insert({
          nome: formData.name,
          tipo: "profissional",
          telefone: formData.phone,
          email: currentUser.email,
          cidade: formData.city,
          uf: formData.state,
          cep: formData.cep,
          logradouro: formData.address,
          bairro: formData.neighborhood,
          numero: formData.number,
          complemento: formData.complement,
          segmentos: segmentsArray,
          modo_agendamento: formData.scheduleMode === "professional"
            ? "por_profissional"
            : "por_clinica_sala",
        })
        .select()
        .single();

      if (tenantError) {
        await supabase.auth.signOut();
        throw tenantError;
      }

      const { error: profileError } = await (supabase as any)
        .from("profiles")
        .insert({
          id: currentUser.id,
          nome: formData.name,
          telefone: formData.phone,
          email: currentUser.email,
          cidade: formData.city,
          uf: formData.state,
          role: "professional",
          tenant_id: tenant.id,
        });

      if (profileError) {
        await supabase.from("tenants").delete().eq("id", tenant.id);
        await supabase.auth.signOut();
        throw profileError;
      }

      const validServices = formData.services.filter(s => s.name && s.duration);
      if (validServices.length > 0) {
        await (supabase as any)
          .from("servicos")
          .insert(
            validServices.map((s) => ({
              tenant_id: tenant?.id,
              nome: s.name,
              duracao_minutos: parseInt(s.duration),
              preco: s.price ? parseFloat(s.price.replace(/\./g, '').replace(',', '.')) : null,
            }))
          );
      }

      if (planData.price > 0) {
        if (!planData.priceId) {
          sonnerToast.error("Erro de configuração: ID do preço não encontrado.");
          return;
        }

        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
          body: {
            priceId: planData.priceId,
            planSlug: planData.planCode,
            billingCycle: 'monthly',
          }
        });

        if (checkoutError) {
          sonnerToast.error("Erro ao iniciar pagamento.");
          return;
        }

        if (checkoutData?.url) {
          window.location.href = checkoutData.url;
          return;
        }
      } else {
        const { error: subError } = await supabase.functions.invoke('billing-ops', {
          body: {
            action: 'start_subscription',
            tenantId: tenant.id,
            planCode: planData.planCode,
            edition: 'solo',
            couponCode: planData.couponCode
          }
        });

        if (subError) {
          sonnerToast.error("Erro ao criar assinatura.");
        }
      }

      toast({
        title: "Cadastro concluído!",
        description: "Bem-vindo ao CleanFlow. Preparando seu painel...",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error: any) {
      console.error("[Onboarding] Erro no processo de cadastro:", error);
      sonnerToast.error("Erro ao completar cadastro.");
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="mb-8">
          <Button variant="ghost" onClick={step === 1 ? onBack : () => setStep(step - 1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-foreground">
              Cadastro de Profissional
            </h1>
            <span className="text-sm text-muted-foreground">
              Passo {step} de 4
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* STEP 1: Basic Data */}
        {step === 1 && (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Dados Básicos</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Seu nome completo"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone com WhatsApp *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+55 99 99999-9999"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <Label htmlFor="cep">CEP *</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) =>
                        setFormData({ ...formData, cep: e.target.value })
                      }
                      onBlur={handleCepBlur}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) =>
                        setFormData({ ...formData, number: e.target.value })
                      }
                      placeholder="123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={formData.complement}
                      onChange={(e) =>
                        setFormData({ ...formData, complement: e.target.value })
                      }
                      placeholder="Apto 101"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="neighborhood">Bairro</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">UF</Label>
                      <Input
                        id="state"
                        value={formData.state}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.phone || !formData.city}
              >
                Próximo
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 2: Segments and Services */}
        {step === 2 && (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Segmentos e Serviços
              </h2>

              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block">
                    Segmentos de atividade *
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {SEGMENTS.map((segmentItem) => (
                      <div key={segmentItem} className="flex items-center space-x-2">
                        <Checkbox
                          id={segmentItem}
                          checked={formData.segment === segmentItem || (segmentItem === "Outro" && formData.hasOtherSegment)}
                          onCheckedChange={() => handleSegmentSelect(segmentItem)}
                        />
                        <Label
                          htmlFor={segmentItem}
                          className="text-sm cursor-pointer"
                        >
                          {segmentItem}
                        </Label>
                      </div>
                    ))}
                    {formData.hasOtherSegment && (
                      <div className="col-span-3 mt-2">
                        <Input
                          placeholder="Especifique o segmento"
                          value={formData.otherSegment}
                          onChange={(e) => setFormData({ ...formData, otherSegment: e.target.value })}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Serviços oferecidos *</Label>
                  {formData.services.map((service, index) => (
                    <div key={index} className="mb-3 flex gap-3 items-end">
                      <div className="flex-1">
                        <Label className="text-xs mb-1 block">Nome do Serviço</Label>
                        <Input
                          placeholder="Ex: Consulta"
                          value={service.name}
                          onChange={(e) =>
                            handleServiceChange(index, "name", e.target.value)
                          }
                        />
                      </div>
                      <div className="w-24">
                        <Label className="text-xs mb-1 block">Duração (min)</Label>
                        <Input
                          type="number"
                          placeholder="30"
                          value={service.duration}
                          onChange={(e) =>
                            handleServiceChange(index, "duration", e.target.value)
                          }
                        />
                      </div>
                      <div className="w-32">
                        <Label className="text-xs mb-1 block">Preço (R$)</Label>
                        <Input
                          placeholder="0,00"
                          value={service.price}
                          onChange={(e) =>
                            handleServiceChange(index, "price", e.target.value)
                          }
                          onBlur={() => handlePriceBlur(index)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeService(index)}
                        disabled={formData.services.length === 1}
                        className="mb-[2px]"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addService} className="w-full mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar outro serviço
                  </Button>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={
                      (!formData.segment && !formData.hasOtherSegment) ||
                      (formData.hasOtherSegment && !formData.otherSegment.trim()) ||
                      !formData.services[0].name
                    }
                  >
                    Próximo
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 3: Plan Selection */}
        {step === 3 && (
          <PlanSelection
            edition="solo"
            onSelect={handlePlanSelect}
            onBack={() => setStep(2)}
          />
        )}

        {/* STEP 4: Confirmation */}
        {step === 4 && (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Preferências e Confirmação
              </h2>

              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <h3 className="font-medium">Resumo do Cadastro</h3>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Plano:</strong> {planData?.planCode === 'free_solo' ? 'Free Solo' : 'Pro Solo'}
                    </p>
                    <p>
                      <strong>Nome:</strong> {formData.name}
                    </p>
                    <p>
                      <strong>Telefone:</strong> {formData.phone}
                    </p>
                    <p>
                      <strong>Cidade/UF:</strong> {formData.city}/{formData.state}
                    </p>
                    <p>
                      <strong>Segmento:</strong> {formData.hasOtherSegment ? formData.otherSegment : formData.segment}
                    </p>
                    <p>
                      <strong>Serviços:</strong>{" "}
                      {formData.services.map((s) => s.name).join(", ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="lgpd"
                    checked={formData.lgpdAccepted}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, lgpdAccepted: checked as boolean })
                    }
                  />
                  <Label htmlFor="lgpd" className="text-sm cursor-pointer">
                    Aceito os termos da{" "}
                    <a href="#" className="text-primary hover:underline">
                      Política de Privacidade
                    </a>{" "}
                    e{" "}
                    <a href="#" className="text-primary hover:underline">
                      Termos de Uso
                    </a>{" "}
                    em conformidade com a LGPD.
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)}>
                Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={!formData.lgpdAccepted}>
                Concluir Cadastro
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div >
  );
}
