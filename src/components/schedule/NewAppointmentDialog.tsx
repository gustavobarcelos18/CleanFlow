import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewPatientDialog } from "./NewPatientDialog";
import { NewProfessionalDialog } from "./NewProfessionalDialog";
import { PatientCombobox } from "./PatientCombobox";
import { ProfessionalCombobox } from "./ProfessionalCombobox";
import { checkNewAppointmentConflict } from "@/lib/scheduleConflicts";
import { automationEngine } from "@/domain/automations/automationEngine";
import { noShowModel } from "@/domain/analytics/noShowModel";

interface NewAppointmentDialogProps {
  children: React.ReactNode;
  selectedDate?: Date;
  selectedTime?: string;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewAppointmentDialog({ children, selectedDate, selectedTime, onSuccess, open: controlledOpen, onOpenChange }: NewAppointmentDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const [conflictWarning, setConflictWarning] = useState<{ show: boolean; minutes: number } | null>(null);
  const [forceCreate, setForceCreate] = useState(false);

  const [pacientes, setPacientes] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [pacientesPacotes, setPacientesPacotes] = useState<any[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<any[]>([]);
  const [profissionalEspecialidades, setProfissionalEspecialidades] = useState<any[]>([]);
  const [planosSaude, setPlanosSaude] = useState<any[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<any[]>([]);
  const [contasPix, setContasPix] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    paciente_id: "",
    profissional_id: "",
    especialidade_id: "",
    servico_id: "",
    paciente_pacote_id: "",
    data: selectedDate || new Date(),
    hora_inicio: selectedTime || "",
    sala: "",
    notas: "",
    tipo_atendimento: "particular",
    plano_saude_id: "",
    valor_consulta: "",
    forma_pagamento_id: "",
    conta_pix_id: ""
  });

  // Atualizar data e hora quando props mudarem
  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({ ...prev, data: selectedDate }));
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedTime) {
      setFormData(prev => ({ ...prev, hora_inicio: selectedTime }));
    }
  }, [selectedTime]);

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      setIsFetchingData(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const [pacientesRes, profissionaisRes, servicosRes, planosSaudeRes, formasPagamentoRes, contasPixRes] = await Promise.all([
        supabase.from('pacientes').select('id, nome, telefone').eq('tenant_id', profileData.tenant_id).order('nome'),
        supabase.from('profiles').select('id, nome, role').eq('tenant_id', profileData.tenant_id).order('nome'),
        supabase.from('servicos').select('id, nome, duracao_minutos, preco').eq('tenant_id', profileData.tenant_id).eq('ativo', true).order('nome'),
        supabase.from('planos_saude').select('id, nome').eq('tenant_id', profileData.tenant_id).eq('ativo', true).order('nome'),
        supabase.from('formas_pagamento').select('id, nome, tipo').eq('tenant_id', profileData.tenant_id).eq('ativo', true).order('ordem'),
        supabase.from('contas_pix').select('id, nome, chave_pix').eq('tenant_id', profileData.tenant_id).eq('ativo', true).order('nome')
      ]);

      if (pacientesRes.error) throw pacientesRes.error;
      if (profissionaisRes.error) throw profissionaisRes.error;
      if (servicosRes.error) throw servicosRes.error;
      console.log('Procedimentos encontrados:', servicosRes.data);

      // Filtrar apenas profissionais no frontend
      const profissionaisFiltrados = (profissionaisRes.data || []).filter(
        prof => prof.role === 'profissional' || prof.role === 'admin' || prof.role === 'admin_tenant'
      );

      setPacientes(pacientesRes.data || []);
      setProfissionais(profissionaisFiltrados);
      setServicos(servicosRes.data || []);
      setPlanosSaude(planosSaudeRes.data || []);
      setFormasPagamento(formasPagamentoRes.data || []);
      setContasPix(contasPixRes.data || []);

      // Buscar agendamentos existentes no dia selecionado
      await fetchExistingAppointments(formData.data);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados necessários.",
        variant: "destructive"
      });
    } finally {
      setIsFetchingData(false);
    }
  };

  const fetchExistingAppointments = async (date: Date) => {
    try {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const { data, error } = await supabase
        .from('agenda')
        .select('id, inicio, fim, procedimentos:servico_id(duracao_minutos)')
        .gte('inicio', dayStart.toISOString())
        .lte('inicio', dayEnd.toISOString())
        .order('inicio');

      if (error) throw error;

      const appointments = (data || []).map(apt => ({
        id: apt.id,
        inicio: apt.inicio,
        duration: apt.procedimentos?.duracao_minutos || 30
      }));

      setExistingAppointments(appointments);
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
    }
  };

  // Verificar conflitos quando hora ou serviço mudam
  useEffect(() => {
    if (formData.hora_inicio && formData.servico_id && existingAppointments.length > 0) {
      const servico = servicos.find(s => s.id === formData.servico_id);
      if (!servico) return;

      const [hours, minutes] = formData.hora_inicio.split(':');
      const inicio = new Date(formData.data);
      inicio.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const conflict = checkNewAppointmentConflict(
        inicio,
        servico.duracao_minutos,
        existingAppointments
      );

      if (conflict.hasConflict) {
        setConflictWarning({ show: true, minutes: conflict.overlapMinutes });
      } else {
        setConflictWarning(null);
      }
    } else {
      setConflictWarning(null);
    }
  }, [formData.hora_inicio, formData.servico_id, formData.data, existingAppointments, servicos]);

  const fetchPacotesPaciente = async (pacienteId: string) => {
    if (!pacienteId) {
      setPacientesPacotes([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pacientes_pacotes')
        .select('*, pacotes(nome)')
        .eq('paciente_id', pacienteId)
        .eq('status', 'ativo')
        .gt('sessoes_restantes', 0);

      if (error) throw error;
      setPacientesPacotes(data || []);
    } catch (error) {
      console.error('Erro ao buscar pacotes do paciente:', error);
      setPacientesPacotes([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.paciente_id || !formData.profissional_id || !formData.servico_id || !formData.hora_inicio) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Se há conflito e usuário não confirmou, alertar
    if (conflictWarning?.show && !forceCreate) {
      toast({
        title: "Conflito de horário",
        description: `Há uma sobreposição de ${conflictWarning.minutes} minutos. Clique em "Criar Mesmo Assim" para continuar.`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      const servico = servicos.find(s => s.id === formData.servico_id);
      if (!servico) throw new Error("Serviço não encontrado");

      const [hours, minutes] = formData.hora_inicio.split(':');
      const inicio = new Date(formData.data);
      inicio.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const fim = new Date(inicio);
      fim.setMinutes(inicio.getMinutes() + servico.duracao_minutos);

      // Buscar tenant_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        toast({ title: "Perfil não encontrado", description: "Conclua seu cadastro em Configurações.", variant: "destructive" });
        throw new Error("Perfil do usuário não encontrado");
      }
      if (!profile.tenant_id) {
        toast({ title: "Tenant não encontrado", description: "Associe seu perfil a uma clínica em Configurações.", variant: "destructive" });
        throw new Error("Tenant não encontrado");
      }

      // Buscar ordem máxima atual
      const { data: maxOrdem } = await supabase
        .from('agenda')
        .select('ordem')
        .eq('tenant_id', profile.tenant_id)
        .order('ordem', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      const novaOrdem = (maxOrdem?.ordem || 0) + 1;

      // Calcular Score de Risco de No-Show
      const riskAnalysis = await noShowModel.calcularScore({
        paciente_id: formData.paciente_id,
        data_agendamento: inicio,
        data_criacao: new Date(),
        origem: 'recepção', // ou pegar do contexto se for online
        servico_preco: servico.preco || 0
      });

      const { data: agendaData, error } = await supabase
        .from('agenda')
        .insert([{
          paciente_id: formData.paciente_id,
          profissional_id: formData.profissional_id,
          servico_id: formData.servico_id,
          especialidade_id: formData.especialidade_id || null,
          paciente_pacote_id: formData.paciente_pacote_id || null,
          inicio: inicio.toISOString(),
          fim: fim.toISOString(),
          sala: formData.sala || null,
          notas: formData.notas || null,
          status: 'agendado',
          tenant_id: profile.tenant_id,
          origem: 'recepção',
          ordem: novaOrdem,
          tipo_atendimento: formData.tipo_atendimento,
          plano_saude_id: formData.tipo_atendimento === 'plano' ? formData.plano_saude_id || null : null,
          valor_consulta: formData.valor_consulta ? parseFloat(formData.valor_consulta) : null,
          forma_pagamento_id: formData.tipo_atendimento === 'particular' ? formData.forma_pagamento_id || null : null,
          conta_pix_id: formData.conta_pix_id || null,
          no_show_score: riskAnalysis.score,
          no_show_risk_level: riskAnalysis.level
        }])
        .select()
        .single();

      if (error) throw error;

      // Se for atendimento particular com valor, criar lançamento no caixa
      if (formData.tipo_atendimento === 'particular' && formData.valor_consulta && agendaData) {
        await supabase.from('caixa_diario').insert({
          tenant_id: profile.tenant_id,
          agendamento_id: agendaData.id,
          paciente_id: formData.paciente_id,
          profissional_id: formData.profissional_id,
          data: format(formData.data, 'yyyy-MM-dd'),
          tipo_lancamento: 'entrada',
          valor: parseFloat(formData.valor_consulta),
          forma_pagamento: formasPagamento.find(f => f.id === formData.forma_pagamento_id)?.nome || 'Não especificado',
          conta_pix_id: formData.conta_pix_id || null,
          descricao: `Consulta - ${servico.nome}`,
          created_by: user.id
        });
      }

      toast({
        title: "Sucesso!",
        description: "Consulta cadastrada com sucesso."
      });

      // Trigger Automation
      const paciente = pacientes.find(p => p.id === formData.paciente_id);
      if (paciente && agendaData) {
        automationEngine.processarEventoAutomacao({
          tenant_id: profile.tenant_id,
          event_type: 'onAppointmentCreated',
          data: {
            agendamento: agendaData,
            paciente: paciente,
            servico: servico
          }
        }).catch(err => console.error("Erro ao disparar automação:", err));
      }

      // Resetar formulário
      setFormData({
        paciente_id: "",
        profissional_id: "",
        especialidade_id: "",
        servico_id: "",
        paciente_pacote_id: "",
        data: new Date(),
        hora_inicio: "",
        sala: "",
        notas: "",
        tipo_atendimento: "particular",
        plano_saude_id: "",
        valor_consulta: "",
        forma_pagamento_id: "",
        conta_pix_id: ""
      });

      // Fechar dialog e chamar callback com delay para evitar conflitos
      setOpen(false);
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 150);
    } catch (error) {
      console.error('Erro ao cadastrar consulta:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar a consulta.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl">Nova Consulta</DialogTitle>
          <DialogDescription className="text-sm">Preencha os campos para agendar uma nova consulta.</DialogDescription>
        </DialogHeader>

        {isFetchingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="paciente">Paciente *</Label>
                  <NewPatientDialog onSuccess={(patientId) => {
                    fetchData();
                    setFormData({ ...formData, paciente_id: patientId });
                  }} />
                </div>
                <PatientCombobox
                  value={formData.paciente_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, paciente_id: value, paciente_pacote_id: "" });
                    fetchPacotesPaciente(value);
                  }}
                  patients={pacientes}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="profissional">Profissional *</Label>
                  <NewProfessionalDialog onSuccess={(professionalId) => {
                    fetchData();
                    setFormData({ ...formData, profissional_id: professionalId });
                  }} />
                </div>
                <ProfessionalCombobox
                  value={formData.profissional_id}
                  onValueChange={(value) => setFormData({ ...formData, profissional_id: value })}
                  professionals={profissionais}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="servico">Procedimento *</Label>
                <Select
                  value={formData.servico_id}
                  onValueChange={(value) => setFormData({ ...formData, servico_id: value })}
                >
                  <SelectTrigger id="servico">
                    <SelectValue placeholder="Selecione o procedimento" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {servicos.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Nenhum procedimento cadastrado
                      </div>
                    ) : (
                      servicos.map((servico) => (
                        <SelectItem key={servico.id} value={servico.id}>
                          {servico.nome} - {servico.duracao_minutos}min
                          {servico.preco && ` - R$ ${servico.preco}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pacote">Usar Pacote (Opcional)</Label>
                <Select
                  value={formData.paciente_pacote_id}
                  onValueChange={(value) => setFormData({ ...formData, paciente_pacote_id: value === "none" ? "" : value })}
                  disabled={!formData.paciente_id || pacientesPacotes.length === 0}
                >
                  <SelectTrigger id="pacote">
                    <SelectValue placeholder="Nenhum pacote" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="none">Não usar pacote</SelectItem>
                    {pacientesPacotes.map((pp) => (
                      <SelectItem key={pp.id} value={pp.id}>
                        {pp.pacotes?.nome} ({pp.sessoes_restantes} sessões restantes)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formData.paciente_id && pacientesPacotes.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Paciente sem pacotes ativos
                  </p>
                )}
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
                        !formData.data && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        {formData.data ? format(formData.data, "dd/MM/yyyy") : "Selecione a data"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.data}
                      onSelect={(date) => date && setFormData({ ...formData, data: date })}
                      initialFocus
                      locale={ptBR}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hora_inicio">Horário *</Label>
                <Input
                  id="hora_inicio"
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sala">Sala/Consultório</Label>
                <Input
                  id="sala"
                  value={formData.sala}
                  onChange={(e) => setFormData({ ...formData, sala: e.target.value })}
                  placeholder="Ex: Consultório 1"
                  className="w-full"
                />
              </div>
            </div>

            {conflictWarning?.show && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold">Conflito de horário detectado!</p>
                  <p className="text-sm mt-1">
                    Há uma sobreposição de {conflictWarning.minutes} minutos com um agendamento anterior.
                    Você pode criar mesmo assim, mas recomendamos ajustar o horário.
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tipo_atendimento">Tipo de Atendimento *</Label>
                <Select
                  value={formData.tipo_atendimento}
                  onValueChange={(value: "plano" | "particular") => {
                    setFormData({ ...formData, tipo_atendimento: value, plano_saude_id: "", forma_pagamento_id: "", conta_pix_id: "" });
                  }}
                >
                  <SelectTrigger id="tipo_atendimento">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="plano">Plano de Saúde</SelectItem>
                    <SelectItem value="particular">Particular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="valor_consulta">Valor da Consulta</Label>
                <Input
                  id="valor_consulta"
                  type="number"
                  step="0.01"
                  value={formData.valor_consulta}
                  onChange={(e) => setFormData({ ...formData, valor_consulta: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            {formData.tipo_atendimento === 'plano' && (
              <div className="space-y-1.5">
                <Label>Plano de Saúde *</Label>
                <Select
                  value={formData.plano_saude_id}
                  onValueChange={(value) => setFormData({ ...formData, plano_saude_id: value })}
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

            {formData.tipo_atendimento === 'particular' && (
              <>
                <div className="space-y-1.5">
                  <Label>Forma de Pagamento</Label>
                  <Select
                    value={formData.forma_pagamento_id}
                    onValueChange={(value) => {
                      setFormData({ ...formData, forma_pagamento_id: value });
                      const forma = formasPagamento.find(f => f.id === value);
                      if (forma?.tipo !== 'pix') {
                        setFormData(prev => ({ ...prev, conta_pix_id: "" }));
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

                {formasPagamento.find(f => f.id === formData.forma_pagamento_id)?.tipo === 'pix' && (
                  <div className="space-y-1.5">
                    <Label>Conta PIX</Label>
                    <Select
                      value={formData.conta_pix_id}
                      onValueChange={(value) => setFormData({ ...formData, conta_pix_id: value })}
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
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
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
              {conflictWarning?.show ? (
                <>
                  <Button
                    type="submit"
                    disabled={isLoading || !forceCreate}
                    variant="outline"
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Cadastrar Consulta
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      setForceCreate(true);
                      setTimeout(() => {
                        const form = document.querySelector('form');
                        form?.requestSubmit();
                      }, 50);
                    }}
                    disabled={isLoading}
                  >
                    Criar Mesmo Assim
                  </Button>
                </>
              ) : (
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Cadastrar Consulta
                </Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
