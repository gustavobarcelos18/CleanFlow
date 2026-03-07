import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle,
} from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function AgendamentoPublico() {
  const [searchParams] = useSearchParams();
  const tenantSlug = searchParams.get("clinica");

  const [step, setStep] = useState<
    "select-service" | "select-datetime" | "fill-data" | "confirm"
  >("select-service");
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<any[]>([]);
  const [professionals, setProfessionals] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  const [patientData, setPatientData] = useState({
    nome: "",
    telefone: "",
    email: "",
    notas: "",
  });

  const [tenantId, setTenantId] = useState<string | null>(null);

  const loadTenantAndServices = useCallback(async () => {
    try {
      setLoading(true);

      // Buscar configuração de agendamento online pelo slug
      const { data: config, error: configError } = await supabase
        .from("agendamento_online_config")
        .select("*, tenants(*)")
        .eq("slug_publico", tenantSlug)
        .eq("ativo", true)
        .single();

      if (configError || !config) {
        toast.error("Link de agendamento não encontrado ou inativo");
        return;
      }

      setTenantId(config.tenant_id);

      // Buscar serviços disponíveis
      const { data: servicesData } = await supabase
        .from("servicos")
        .select("*")
        .eq("tenant_id", config.tenant_id)
        .eq("ativo", true);

      setServices(servicesData || []);

      // Buscar profissionais
      const { data: profsData } = await supabase
        .from("profiles")
        .select("*")
        .eq("tenant_id", config.tenant_id)
        .in("role", ["profissional", "admin"]);

      setProfessionals(profsData || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar informações de agendamento");
    } finally {
      setLoading(false);
    }
  }, [tenantSlug]);

  useEffect(() => {
    loadTenantAndServices();
  }, [loadTenantAndServices]);

  const loadAvailableSlots = useCallback(async () => {
    if (!selectedDate || !selectedService || !selectedProfessional) return;

    try {
      // Buscar horários já ocupados
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: appointments } = await supabase
        .from("agenda")
        .select("inicio, fim")
        .eq("profissional_id", selectedProfessional.id)
        .gte("inicio", startOfDay.toISOString())
        .lte("inicio", endOfDay.toISOString());

      // Gerar slots disponíveis (8h às 18h, a cada 30 min)
      const slots = [];
      const startHour = 8;
      const endHour = 18;

      for (let hour = startHour; hour < endHour; hour++) {
        for (const minute of [0, 30]) {
          const slotTime = new Date(selectedDate);
          slotTime.setHours(hour, minute, 0, 0);

          const slotEndTime = new Date(slotTime);
          slotEndTime.setMinutes(
            slotEndTime.getMinutes() + selectedService.duracao_minutos,
          );

          // Verificar se está ocupado
          const isOccupied = appointments?.some((apt: any) => {
            const aptStart = new Date(apt.inicio);
            const aptEnd = new Date(apt.fim);
            return (
              (slotTime >= aptStart && slotTime < aptEnd) ||
              (slotEndTime > aptStart && slotEndTime <= aptEnd)
            );
          });

          if (!isOccupied && slotTime > new Date()) {
            slots.push({
              time: slotTime.toTimeString().slice(0, 5),
              datetime: slotTime,
            });
          }
        }
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error("Erro ao carregar horários:", error);
      toast.error("Erro ao carregar horários disponíveis");
    }
  }, [selectedDate, selectedService, selectedProfessional]);

  useEffect(() => {
    if (selectedDate && selectedService && selectedProfessional) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedService, selectedProfessional, loadAvailableSlots]);

  const handleConfirmAppointment = async () => {
    try {
      if (!selectedSlot || !selectedDate || !tenantId) return;

      // Criar ou buscar paciente
      let patientId;

      const { data: existingPatient } = await supabase
        .from("pacientes")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("telefone", patientData.telefone)
        .single();

      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        const { data: newPatient, error: patientError } = await supabase
          .from("pacientes")
          .insert({
            tenant_id: tenantId,
            nome: patientData.nome,
            telefone: patientData.telefone,
            email: patientData.email,
            notas_internas: patientData.notas,
            consentimento_lgpd: true,
            consentimento_data: new Date().toISOString(),
          })
          .select()
          .single();

        if (patientError) throw patientError;
        patientId = newPatient.id;
      }

      // Criar agendamento
      const [hours, minutes] = selectedSlot.split(":").map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(
        endTime.getMinutes() + selectedService.duracao_minutos,
      );

      const { error: agendamentoError } = await supabase.from("agenda").insert({
        tenant_id: tenantId,
        paciente_id: patientId,
        profissional_id: selectedProfessional.id,
        servico_id: selectedService.id,
        inicio: startTime.toISOString(),
        fim: endTime.toISOString(),
        status: "agendado",
        origem: "online",
        confirmado: false,
      });

      if (agendamentoError) throw agendamentoError;

      // Registrar consentimento
      await supabase.from("consent_records" as any).insert({
        tenant_id: tenantId,
        contact_id: patientId,
        contact_type: "paciente",
        consent_type: "operational",
        status: "opted_in",
        origin: "agendamento_online",
        term_version: "1.0",
        given_at: new Date().toISOString(),
      });

      setStep("confirm");
      toast.success("Agendamento realizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao confirmar agendamento:", error);
      toast.error("Erro ao realizar agendamento");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!tenantSlug || !tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Link de agendamento inválido
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />

      <main className="container mx-auto px-4 py-12">
        {step === "confirm" ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                Agendamento Confirmado!
              </h2>
              <p className="text-muted-foreground mb-4">
                Seu agendamento foi realizado com sucesso. Em breve você
                receberá uma confirmação por WhatsApp.
              </p>
              <div className="bg-muted p-4 rounded-lg mb-6">
                <p className="font-medium">{selectedService?.nome}</p>
                <p className="text-sm text-muted-foreground">
                  Dr(a). {selectedProfessional?.nome}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedDate?.toLocaleDateString("pt-BR")} às {selectedSlot}
                </p>
              </div>
              <Button onClick={() => window.location.reload()}>
                Fazer Novo Agendamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Agendamento Online</CardTitle>
                <CardDescription>
                  Siga os passos para agendar sua consulta
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Progress Steps */}
                <div className="flex justify-between mb-8">
                  {["Serviço", "Data e Hora", "Dados", "Confirmar"].map(
                    (label, idx) => (
                      <div key={idx} className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            [
                              "select-service",
                              "select-datetime",
                              "fill-data",
                              "confirm",
                            ][idx] === step
                              ? "bg-primary text-white"
                              : "bg-muted"
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span className="ml-2 text-sm hidden sm:inline">
                          {label}
                        </span>
                      </div>
                    ),
                  )}
                </div>

                {step === "select-service" && (
                  <div className="space-y-4">
                    <h3 className="font-semibold mb-4">Selecione o Serviço</h3>
                    <div className="grid gap-4">
                      {services.map((service) => (
                        <Card
                          key={service.id}
                          className={`cursor-pointer hover:border-primary transition-colors ${
                            selectedService?.id === service.id
                              ? "border-primary"
                              : ""
                          }`}
                          onClick={() => setSelectedService(service)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{service.nome}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {service.duracao_minutos} minutos
                                </p>
                              </div>
                              {service.preco && (
                                <Badge>R$ {service.preco}</Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Button
                      onClick={() => setStep("select-datetime")}
                      disabled={!selectedService}
                      className="w-full"
                    >
                      Continuar
                    </Button>
                  </div>
                )}

                {step === "select-datetime" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">
                        Selecione o Profissional
                      </h3>
                      <div className="grid gap-3">
                        {professionals.map((prof) => (
                          <Card
                            key={prof.id}
                            className={`cursor-pointer hover:border-primary transition-colors ${
                              selectedProfessional?.id === prof.id
                                ? "border-primary"
                                : ""
                            }`}
                            onClick={() => setSelectedProfessional(prof)}
                          >
                            <CardContent className="p-3 flex items-center gap-3">
                              <User className="h-8 w-8 text-muted-foreground" />
                              <div>
                                <p className="font-medium">
                                  Dr(a). {prof.nome}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {selectedProfessional && (
                      <div>
                        <h3 className="font-semibold mb-4">Selecione a Data</h3>
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) =>
                            date < new Date() || date.getDay() === 0
                          }
                          className="rounded-md border mx-auto"
                        />
                      </div>
                    )}

                    {selectedDate && availableSlots.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-4">
                          Horários Disponíveis
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                          {availableSlots.map((slot) => (
                            <Button
                              key={slot.time}
                              variant={
                                selectedSlot === slot.time
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => setSelectedSlot(slot.time)}
                              className="text-sm"
                            >
                              {slot.time}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setStep("select-service")}
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={() => setStep("fill-data")}
                        disabled={!selectedSlot}
                        className="flex-1"
                      >
                        Continuar
                      </Button>
                    </div>
                  </div>
                )}

                {step === "fill-data" && (
                  <div className="space-y-4">
                    <h3 className="font-semibold mb-4">Seus Dados</h3>
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome Completo *</Label>
                      <Input
                        id="nome"
                        value={patientData.nome}
                        onChange={(e) =>
                          setPatientData({
                            ...patientData,
                            nome: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone (WhatsApp) *</Label>
                      <Input
                        id="telefone"
                        type="tel"
                        value={patientData.telefone}
                        onChange={(e) =>
                          setPatientData({
                            ...patientData,
                            telefone: e.target.value,
                          })
                        }
                        placeholder="(00) 00000-0000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={patientData.email}
                        onChange={(e) =>
                          setPatientData({
                            ...patientData,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notas">Observações</Label>
                      <Input
                        id="notas"
                        value={patientData.notas}
                        onChange={(e) =>
                          setPatientData({
                            ...patientData,
                            notas: e.target.value,
                          })
                        }
                        placeholder="Algo que o profissional deva saber..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setStep("select-datetime")}
                      >
                        Voltar
                      </Button>
                      <Button
                        onClick={handleConfirmAppointment}
                        disabled={!patientData.nome || !patientData.telefone}
                        className="flex-1"
                      >
                        Confirmar Agendamento
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <LandingFooter />
    </div>
  );
}
