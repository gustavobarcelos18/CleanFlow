import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PatientCombobox } from "./PatientCombobox";
import { ProfessionalCombobox } from "./ProfessionalCombobox";
import { PackageUsageNotification } from "@/components/pacotes/PackageUsageNotification";

interface EditAppointmentDialogProps {
  children: React.ReactNode;
  appointmentId: string;
  onSuccess?: () => void;
}

export function EditAppointmentDialog({
  children,
  appointmentId,
  onSuccess,
}: EditAppointmentDialogProps) {
  const [open, setOpen] = useState(false);

  // Abrir automaticamente quando houver appointmentId
  useEffect(() => {
    if (appointmentId) {
      setOpen(true);
    }
  }, [appointmentId]);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [packageUsageNotification, setPackageUsageNotification] =
    useState<any>(null);
  const [showPackageNotification, setShowPackageNotification] = useState(false);

  const [pacientes, setPacientes] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [pacientesPacotes, setPacientesPacotes] = useState<any[]>([]);

  const [formData, setFormData] = useState<{
    paciente_id: string;
    profissional_id: string;
    servico_id: string;
    paciente_pacote_id: string;
    data: Date;
    hora_inicio: string;
    sala: string;
    notas: string;
    status: any;
    tipo_atendimento: string;
    plano_saude_id: string;
    valor_consulta: string;
    forma_pagamento_id: string;
    conta_pix_id: string;
  }>({
    paciente_id: "",
    profissional_id: "",
    servico_id: "",
    paciente_pacote_id: "",
    data: new Date(),
    hora_inicio: "",
    sala: "",
    notas: "",
    status: "agendado",
    tipo_atendimento: "particular",
    plano_saude_id: "",
    valor_consulta: "",
    forma_pagamento_id: "",
    conta_pix_id: "",
  });

  const [planosSaude, setPlanosSaude] = useState<any[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<any[]>([]);
  const [contasPix, setContasPix] = useState<any[]>([]);
  const [canEditValues, setCanEditValues] = useState(false);

  const { toast } = useToast();

  const fetchAppointmentData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Verificar permissão para alterar valores
      const { data: profileData } = await supabase
        .from("profiles")
        .select("pode_alterar_valores, role")
        .eq("id", user.id)
        .single();

      setCanEditValues(
        profileData?.pode_alterar_valores === true ||
          profileData?.role === "admin",
      );

      const { data, error } = await supabase
        .from("agenda")
        .select("*")
        .eq("id", appointmentId)
        .single();

      if (error) throw error;

      const inicioDate = new Date(data.inicio);

      setFormData({
        paciente_id: data.paciente_id,
        profissional_id: data.profissional_id || "",
        servico_id: data.servico_id,
        paciente_pacote_id: data.paciente_pacote_id || "",
        data: inicioDate,
        hora_inicio: format(inicioDate, "HH:mm"),
        sala: data.sala || "",
        notas: data.notas || "",
        status: data.status || "agendado",
        tipo_atendimento: data.tipo_atendimento || "particular",
        plano_saude_id: data.plano_saude_id || "",
        valor_consulta: data.valor_consulta?.toString() || "",
        forma_pagamento_id: data.forma_pagamento_id || "",
        conta_pix_id: data.conta_pix_id || "",
      });

      // Buscar pacotes do paciente
      if (data.paciente_id) {
        fetchPacotesPaciente(data.paciente_id);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do agendamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do agendamento.",
        variant: "destructive",
      });
    }
  }, [appointmentId, toast]);

  const fetchData = useCallback(async () => {
    try {
      setIsFetchingData(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profileData) throw new Error("Perfil não encontrado");

      const [
        pacientesRes,
        profissionaisRes,
        servicosRes,
        planosSaudeRes,
        formasPagamentoRes,
        contasPixRes,
      ] = await Promise.all([
        supabase
          .from("pacientes")
          .select("id, nome, telefone")
          .eq("tenant_id", profileData.tenant_id)
          .order("nome"),
        supabase
          .from("profiles")
          .select("id, nome, role")
          .eq("tenant_id", profileData.tenant_id)
          .order("nome"),
        supabase
          .from("servicos")
          .select("id, nome, duracao_minutos, preco")
          .eq("tenant_id", profileData.tenant_id)
          .eq("ativo", true)
          .order("nome"),
        supabase
          .from("planos_saude")
          .select("id, nome")
          .eq("tenant_id", profileData.tenant_id)
          .eq("ativo", true)
          .order("nome"),
        supabase
          .from("formas_pagamento")
          .select("id, nome, tipo")
          .eq("tenant_id", profileData.tenant_id)
          .eq("ativo", true)
          .order("ordem"),
        supabase
          .from("contas_pix")
          .select("id, nome, chave_pix")
          .eq("tenant_id", profileData.tenant_id)
          .eq("ativo", true)
          .order("nome"),
      ]);

      if (pacientesRes.error) throw pacientesRes.error;
      if (profissionaisRes.error) throw profissionaisRes.error;
      if (servicosRes.error) throw servicosRes.error;

      const profissionaisFiltrados = (profissionaisRes.data || []).filter(
        (prof) =>
          prof.role === "profissional" ||
          prof.role === "admin" ||
          prof.role === "admin_tenant",
      );

      setPacientes(pacientesRes.data || []);
      setProfissionais(profissionaisFiltrados);
      setServicos(servicosRes.data || []);
      setPlanosSaude(planosSaudeRes.data || []);
      setFormasPagamento(formasPagamentoRes.data || []);
      setContasPix(contasPixRes.data || []);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados necessários.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingData(false);
    }
  }, [toast]);

  const fetchPacotesPaciente = useCallback(async (pacienteId: string) => {
    if (!pacienteId) {
      setPacientesPacotes([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("pacientes_pacotes")
        .select("*, pacotes(nome)")
        .eq("paciente_id", pacienteId)
        .eq("status", "ativo")
        .gt("sessoes_restantes", 0);

      if (error) throw error;
      setPacientesPacotes(data || []);
    } catch (error) {
      console.error("Erro ao buscar pacotes do paciente:", error);
      setPacientesPacotes([]);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchData();
      fetchAppointmentData();
    }
  }, [open, fetchData, fetchAppointmentData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.paciente_id ||
      !formData.profissional_id ||
      !formData.servico_id ||
      !formData.hora_inicio
    ) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const servico = servicos.find((s) => s.id === formData.servico_id);
      if (!servico) throw new Error("Serviço não encontrado");

      const [hours, minutes] = formData.hora_inicio.split(":");
      const inicio = new Date(formData.data);
      inicio.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Validar se o horário é futuro
      const now = new Date();
      if (inicio < now) {
        toast({
          title: "Horário inválido",
          description: "Não é possível agendar para um horário que já passou.",
          variant: "destructive",
        });
        return;
      }

      const fim = new Date(inicio);
      fim.setMinutes(inicio.getMinutes() + servico.duracao_minutos);

      const updateData: any = {
        paciente_id: formData.paciente_id,
        profissional_id: formData.profissional_id,
        servico_id: formData.servico_id,
        paciente_pacote_id: formData.paciente_pacote_id || null,
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
        sala: formData.sala || null,
        notas: formData.notas || null,
        status: formData.status,
        updated_at: new Date().toISOString(),
      };

      // Só permitir alteração de valores financeiros se o usuário tiver permissão
      if (canEditValues) {
        updateData.tipo_atendimento = formData.tipo_atendimento;
        updateData.plano_saude_id =
          formData.tipo_atendimento === "plano"
            ? formData.plano_saude_id || null
            : null;
        updateData.valor_consulta = formData.valor_consulta
          ? parseFloat(formData.valor_consulta)
          : null;
        updateData.forma_pagamento_id =
          formData.tipo_atendimento === "particular"
            ? formData.forma_pagamento_id || null
            : null;
        updateData.conta_pix_id = formData.conta_pix_id || null;
      }

      const { error } = await supabase
        .from("agenda")
        .update(updateData)
        .eq("id", appointmentId);

      if (error) throw error;

      // Se status mudou para "realizado" e há um pacote vinculado, processar uso
      if (formData.status === "realizado" && formData.paciente_pacote_id) {
        const { data: usageData, error: usageError } = await supabase.rpc(
          "usar_sessao_pacote",
          {
            p_paciente_pacote_id: formData.paciente_pacote_id,
            p_agendamento_id: appointmentId,
          },
        );

        if (usageError) {
          console.error("Erro ao usar sessão do pacote:", usageError);
          toast({
            title: "Aviso",
            description:
              "Consulta atualizada, mas houve erro ao processar o pacote.",
            variant: "destructive",
          });
        } else if (
          usageData &&
          typeof usageData === "object" &&
          "success" in usageData &&
          usageData.success
        ) {
          setPackageUsageNotification(usageData);
          setShowPackageNotification(true);
        }
      }

      toast({
        title: "Sucesso!",
        description: "Consulta atualizada com sucesso.",
      });

      setOpen(false);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 150);
    } catch (error) {
      console.error("Erro ao atualizar consulta:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a consulta.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen && onSuccess) {
          onSuccess();
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">Editar Consulta</DialogTitle>
          <DialogDescription className="text-sm">
            Altere os dados da consulta agendada.
          </DialogDescription>
        </DialogHeader>

        {isFetchingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 flex-1 overflow-y-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="paciente">Paciente *</Label>
                <PatientCombobox
                  value={formData.paciente_id}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      paciente_id: value,
                      paciente_pacote_id: "",
                    });
                    fetchPacotesPaciente(value);
                  }}
                  patients={pacientes}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profissional">Profissional *</Label>
                <ProfessionalCombobox
                  value={formData.profissional_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, profissional_id: value })
                  }
                  professionals={profissionais}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="servico">Procedimento *</Label>
                <Select
                  value={formData.servico_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, servico_id: value })
                  }
                >
                  <SelectTrigger id="servico">
                    <SelectValue placeholder="Selecione o procedimento" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {servicos.map((servico) => (
                      <SelectItem key={servico.id} value={servico.id}>
                        {servico.nome} - {servico.duracao_minutos}min
                        {servico.preco && ` - R$ ${servico.preco}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as any })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="agendado">Agendado</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="faltou">Faltou</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.data && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {formData.data
                          ? format(formData.data, "dd/MM/yyyy")
                          : "Selecione a data"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-background z-50"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={formData.data}
                      onSelect={(date) =>
                        date && setFormData({ ...formData, data: date })
                      }
                      initialFocus
                      locale={ptBR}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hora_inicio">Horário *</Label>
                <TimePicker
                  value={formData.hora_inicio}
                  onChange={(val) =>
                    setFormData({ ...formData, hora_inicio: val })
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sala">Sala/Consultório</Label>
                <Input
                  id="sala"
                  value={formData.sala}
                  onChange={(e) =>
                    setFormData({ ...formData, sala: e.target.value })
                  }
                  placeholder="Ex: Consultório 1"
                  className="w-full"
                />
              </div>
            </div>

            {canEditValues && (
              <>
                <div className="space-y-1.5">
                  <Label>Tipo de Atendimento</Label>
                  <Select
                    value={formData.tipo_atendimento}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        tipo_atendimento: value,
                        plano_saude_id: "",
                        forma_pagamento_id: "",
                        conta_pix_id: "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      <SelectItem value="particular">Particular</SelectItem>
                      <SelectItem value="plano">Plano de Saúde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.tipo_atendimento === "plano" && (
                  <div className="space-y-1.5">
                    <Label>Plano de Saúde</Label>
                    <Select
                      value={formData.plano_saude_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, plano_saude_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o plano" />
                      </SelectTrigger>
                      <SelectContent className="bg-background z-50">
                        {planosSaude.map((plano) => (
                          <SelectItem key={plano.id} value={plano.id}>
                            {plano.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Valor da Consulta</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.valor_consulta}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          valor_consulta: e.target.value,
                        })
                      }
                      placeholder="R$ 0,00"
                    />
                  </div>

                  {formData.tipo_atendimento === "particular" && (
                    <div className="space-y-1.5">
                      <Label>Forma de Pagamento</Label>
                      <Select
                        value={formData.forma_pagamento_id}
                        onValueChange={(value) => {
                          setFormData({
                            ...formData,
                            forma_pagamento_id: value,
                          });
                          const forma = formasPagamento.find(
                            (f) => f.id === value,
                          );
                          if (forma?.tipo !== "pix") {
                            setFormData((prev) => ({
                              ...prev,
                              conta_pix_id: "",
                            }));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {formasPagamento.map((forma) => (
                            <SelectItem key={forma.id} value={forma.id}>
                              {forma.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {formData.tipo_atendimento === "particular" &&
                  formasPagamento.find(
                    (f) => f.id === formData.forma_pagamento_id,
                  )?.tipo === "pix" && (
                    <div className="space-y-1.5">
                      <Label>Conta PIX</Label>
                      <Select
                        value={formData.conta_pix_id}
                        onValueChange={(value) =>
                          setFormData({ ...formData, conta_pix_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a conta PIX" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          {contasPix.map((conta) => (
                            <SelectItem key={conta.id} value={conta.id}>
                              {conta.nome} - {conta.chave_pix}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notas">Observações</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) =>
                  setFormData({ ...formData, notas: e.target.value })
                }
                placeholder="Notas adicionais sobre a consulta..."
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 flex-shrink-0 border-t mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        )}
      </DialogContent>

      {packageUsageNotification && (
        <PackageUsageNotification
          open={showPackageNotification}
          onOpenChange={setShowPackageNotification}
          packageName={packageUsageNotification.pacote_nome || ""}
          currentSession={packageUsageNotification.sessao_atual || 0}
          totalSessions={packageUsageNotification.sessoes_totais || 0}
          remainingSessions={packageUsageNotification.sessoes_restantes || 0}
          shouldOfferRenewal={
            packageUsageNotification.deve_oferecer_renovacao || false
          }
          onRenewPackage={() => {
            toast({
              title: "Renovação de Pacote",
              description:
                "Funcionalidade de renovação será implementada em breve.",
            });
          }}
        />
      )}
    </Dialog>
  );
}
