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

interface OnboardingClinicaProps {
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
  "Podologia",
  "Psicologia",
];

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PlanSelection } from "@/components/onboarding/PlanSelection";
import { fetchAddressByCEP } from "@/lib/cep";
import { toast as sonnerToast } from "sonner";

export function OnboardingClinica({ onBack }: OnboardingClinicaProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [planData, setPlanData] = useState<{ planCode: string; price: number; priceId?: string; seats?: number; couponCode?: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    razaoSocial: "",
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
    scheduleMode: "professional",
    services: [{ name: "", duration: "", price: "", requiresConfirmation: false }],
    professionals: [{ name: "", phone: "" }],
    rooms: [{ name: "" }],
    primaryColor: "#016CA5",
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
    setFormData((prev) => ({
      ...prev,
      segment: value,
      hasOtherSegment: false,
      otherSegment: ""
    }));
  };

  const handleOtherSegmentSelect = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      hasOtherSegment: checked,
      segment: checked ? "" : prev.segment,
      otherSegment: checked ? prev.otherSegment : ""
    }));
  };

  const addService = () => {
    setFormData((prev) => ({
      ...prev,
      services: [...prev.services, { name: "", duration: "", price: "", requiresConfirmation: false }],
    }));
  };

  const removeService = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const handleServiceChange = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.map((service, i) =>
        i === index ? { ...service, [field]: value } : service
      ),
    }));
  };

  const addProfessional = () => {
    setFormData((prev) => ({
      ...prev,
      professionals: [...prev.professionals, { name: "", phone: "" }],
    }));
  };

  const addRoom = () => {
    setFormData((prev) => ({
      ...prev,
      rooms: [...prev.rooms, { name: "" }],
    }));
  };

  const handlePlanSelect = (selection: { planCode: string; price: number; priceId?: string; seats?: number; couponCode?: string }) => {
    setPlanData(selection);
    setStep(2);
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
      console.log("[Onboarding] Iniciando cadastro de clínica...");
      let currentUser = user;

      if (!currentUser) {
        const { data: { user: fetchedUser }, error: userError } = await supabase.auth.getUser();
        if (userError || !fetchedUser) {
          sonnerToast.error("Sessão expirada. Faça login novamente.");
          return;
        }
        currentUser = fetchedUser;
      }

      // Check existing
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", currentUser.id)
        .single();

      if (existingProfile?.tenant_id) {
        navigate("/dashboard");
        return;
      }

      // Create Tenant
      const { data: tenant, error: tenantError } = await (supabase as any)
        .from("tenants")
        .insert({
          nome: formData.name,
          razao_social: formData.razaoSocial,
          tipo: "clinica",
          telefone: formData.phone,
          email: currentUser.email,
          cidade: formData.city,
          uf: formData.state,
          cep: formData.cep,
          logradouro: formData.address,
          bairro: formData.neighborhood,
          numero: formData.number,
          complemento: formData.complement,

          segmentos: formData.hasOtherSegment && formData.otherSegment
            ? [formData.otherSegment]
            : [formData.segment],
          modo_agendamento: formData.scheduleMode === "professional" ? "por_profissional" : "por_clinica_sala",
        })
        .select()
        .single();

      if (tenantError) throw tenantError;

      // Create Profile
      const { error: profileError } = await (supabase as any)
        .from("profiles")
        .insert({
          id: currentUser.id,
          nome: formData.name, // Using clinic name as admin name for now if not asked
          telefone: formData.phone,
          email: currentUser.email,
          cidade: formData.city,
          uf: formData.state,
          role: "manager", // Using 'manager' as the owner role for clinics
          tenant_id: tenant.id,
        });

      if (profileError) {
        await supabase.from("tenants").delete().eq("id", tenant.id);
        throw profileError;
      }

      // Create Subscription
      const extraSeats = planData.seats ? Math.max(0, planData.seats - 5) : 0;

      if (planData.price > 0) {
        if (!planData.priceId) {
          sonnerToast.error("Erro de configuração: ID do preço não encontrado. Contate o suporte.");
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
          console.error("Erro ao criar checkout:", checkoutError);
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
            edition: 'company',
            extraSeats: { profissional: extraSeats },
            couponCode: planData.couponCode
          }
        });

        if (subError) console.error("Erro ao criar assinatura:", subError);
      }

      toast({
        title: "Cadastro concluído!",
        description: "Bem-vindo ao CleanFlow.",
      });

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);

    } catch (error: any) {
      console.error("Erro no cadastro:", error);
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
              Cadastro de Clínica/Empresa
            </h1>
            <span className="text-sm text-muted-foreground">
              Passo {step} de 3
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <PlanSelection
            edition="company"
            onSelect={handlePlanSelect}
            onBack={onBack}
          />
        )}

        {step === 2 && (
          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="razaoSocial">Razão Social *</Label>
                <Input
                  id="razaoSocial"
                  placeholder="Razão Social da empresa"
                  value={formData.razaoSocial}
                  onChange={(e) =>
                    setFormData({ ...formData, razaoSocial: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="name">Nome Fantasia *</Label>
                <Input
                  id="name"
                  placeholder="Nome fantasia"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone principal *</Label>
                <Input
                  id="phone"
                  placeholder="+55 99 99999-9999"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
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
            <div className="flex justify-end">
              <Button
                onClick={() => setStep(3)}
                disabled={!formData.name || !formData.phone || !formData.city}
              >
                Próximo
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Segmentos, Serviços e Recursos
              </h2>

              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block">Segmentos de atividade *</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {SEGMENTS.map((segmentItem) => (
                      <div key={segmentItem} className="flex items-center space-x-2">
                        <Checkbox
                          id={segmentItem}
                          checked={formData.segment === segmentItem}
                          onCheckedChange={() => handleSegmentSelect(segmentItem)}
                        />
                        <Label htmlFor={segmentItem} className="text-sm cursor-pointer">
                          {segmentItem}
                        </Label>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2 col-span-3">
                      <Checkbox
                        id="other_segment"
                        checked={formData.hasOtherSegment}
                        onCheckedChange={(checked) => handleOtherSegmentSelect(checked as boolean)}
                      />
                      <Label
                        htmlFor="other_segment"
                        className="text-sm cursor-pointer whitespace-nowrap"
                      >
                        Outro
                      </Label>
                      {formData.hasOtherSegment && (
                        <Input
                          className="h-8 flex-1 ml-2"
                          placeholder="Especifique o outro segmento"
                          value={formData.otherSegment}
                          onChange={(e) =>
                            setFormData({ ...formData, otherSegment: e.target.value })
                          }
                          autoFocus
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Modo de agendamento *</Label>
                  <RadioGroup
                    value={formData.scheduleMode}
                    onValueChange={(value) =>
                      setFormData({ ...formData, scheduleMode: value })
                    }
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="professional" id="mode-prof" />
                      <Label htmlFor="mode-prof" className="cursor-pointer">
                        Por Profissional (calendário por pessoa)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="room" id="mode-room" />
                      <Label htmlFor="mode-room" className="cursor-pointer">
                        Por Consultório/Sala/Box (calendário por recurso)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formData.scheduleMode === "professional" && (
                  <div>
                    <Label className="mb-3 block">Profissionais (opcional)</Label>
                    {formData.professionals.map((prof, index) => (
                      <div key={index} className="mb-3 grid grid-cols-2 gap-3">
                        <Input placeholder="Nome" value={prof.name} />
                        <Input placeholder="WhatsApp" value={prof.phone} />
                      </div>
                    ))}
                    <Button variant="outline" onClick={addProfessional} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar profissional
                    </Button>
                  </div>
                )}

                {formData.scheduleMode === "room" && (
                  <div>
                    <Label className="mb-3 block">Salas/Boxes (opcional)</Label>
                    {formData.rooms.map((room, index) => (
                      <div key={index} className="mb-3">
                        <Input placeholder="Nome da sala/box" value={room.name} />
                      </div>
                    ))}
                    <Button variant="outline" onClick={addRoom} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar sala
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button onClick={() => setStep(4)} disabled={!formData.segment && !formData.hasOtherSegment}>
                Próximo
              </Button>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card className="p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Confirmação</h2>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-3">
                  <h3 className="font-medium">Resumo do Cadastro</h3>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Plano:</strong> {planData?.planCode === 'company_base' ? 'Empresa' : planData?.planCode}
                    </p>
                    <p>
                      <strong>Profissionais Contratados:</strong> {planData?.seats || 5}
                    </p>
                    <p>
                      <strong>Nome da Clínica:</strong> {formData.name}
                    </p>
                    <p>
                      <strong>Segmento:</strong> {formData.hasOtherSegment ? formData.otherSegment : formData.segment}
                    </p>
                    <p>
                      <strong>Telefone:</strong> {formData.phone}
                    </p>
                    <p>
                      <strong>Cidade/UF:</strong> {formData.city}/{formData.state}
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
    </div>
  );
}
