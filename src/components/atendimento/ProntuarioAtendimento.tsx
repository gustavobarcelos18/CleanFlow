import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Save,
  FileCheck,
  Clock,
  Activity,
  Stethoscope,
  ClipboardList,
  History,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AtendimentoTimer } from "./AtendimentoTimer";

interface ProntuarioAtendimentoProps {
  agendamento: any;
  onClose: () => void;
}

export function ProntuarioAtendimento({
  agendamento,
  onClose,
}: ProntuarioAtendimentoProps) {
  const [loading, setLoading] = useState(false);
  const [historicoLoading, setHistoricoLoading] = useState(true);
  const [historico, setHistorico] = useState<any[]>([]);
  const [pacienteInfo, setPacienteInfo] = useState<any>(null);
  const [prontuarioAtual, setProntuarioAtual] = useState<any>(null);
  const [proximoAgendamento, setProximoAgendamento] = useState<
    Date | undefined
  >(undefined);
  const [formData, setFormData] = useState({
    // Anamnese (primeira consulta)
    queixa_principal: "",
    historia_doenca_atual: "",
    historia_pregressa: "",
    alergias: [] as string[],
    medicamentos_uso: [] as string[],
    historia_familiar: "",
    historia_social: "",

    // SOAP
    subjetivo: "",
    objetivo: "",
    avaliacao: "",
    plano: "",

    // Sinais Vitais
    pressao_arterial: "",
    frequencia_cardiaca: "",
    temperatura: "",
    peso: "",
    altura: "",
    saturacao_o2: "",

    // Diagnóstico
    cid10_principal: "",
    hipotese_diagnostica: "",

    // Observações
    observacoes: "",
    evolucao: "",
  });

  const loadPacienteInfo = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pacientes")
        .select("*")
        .eq("id", agendamento.paciente_id)
        .single();

      if (error) throw error;
      setPacienteInfo(data);
    } catch (error: any) {
      console.error("Erro ao carregar dados do paciente:", error);
    }
  }, [agendamento.paciente_id]);

  const loadProximoAgendamento = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("agenda")
        .select("inicio")
        .eq("profissional_id", user.id)
        .gt("inicio", agendamento.inicio)
        .neq("status", "cancelado")
        .order("inicio", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) {
        setProximoAgendamento(new Date(data.inicio));
      }
    } catch (error: any) {
      console.error("Erro ao carregar pr├│ximo agendamento:", error);
    }
  }, [agendamento.inicio]);

  const loadHistorico = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("prontuarios" as any)
        .select("*")
        .eq("paciente_id", agendamento.paciente_id)
        .eq("profissional_id", user.id)
        .order("data_atendimento", { ascending: false });

      if (error) throw error;
      setHistorico(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar hist├│rico:", error);
    } finally {
      setHistoricoLoading(false);
    }
  }, [agendamento.paciente_id]);

  const checkProntuarioExistente = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("prontuarios" as any)
        .select("*")
        .eq("agendamento_id", agendamento.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setProntuarioAtual(data);
        const prontuario = data as any;
        setFormData({
          queixa_principal: prontuario.queixa_principal || "",
          historia_doenca_atual: prontuario.historia_doenca_atual || "",
          historia_pregressa: prontuario.historia_pregressa || "",
          alergias: prontuario.alergias || [],
          medicamentos_uso: prontuario.medicamentos_uso || [],
          historia_familiar: prontuario.historia_familiar || "",
          historia_social: prontuario.historia_social || "",
          subjetivo: prontuario.subjetivo || "",
          objetivo: prontuario.objetivo || "",
          avaliacao: prontuario.avaliacao || "",
          plano: prontuario.plano || "",
          pressao_arterial: prontuario.pressao_arterial || "",
          frequencia_cardiaca: prontuario.frequencia_cardiaca?.toString() || "",
          temperatura: prontuario.temperatura?.toString() || "",
          peso: prontuario.peso?.toString() || "",
          altura: prontuario.altura?.toString() || "",
          saturacao_o2: prontuario.saturacao_o2?.toString() || "",
          cid10_principal: prontuario.cid10_principal || "",
          hipotese_diagnostica: prontuario.hipotese_diagnostica || "",
          observacoes: prontuario.observacoes || "",
          evolucao: prontuario.evolucao || "",
        });
      }
    } catch (error: any) {
      console.error("Erro ao verificar prontu├írio:", error);
    }
  }, [agendamento.id]);

  useEffect(() => {
    loadPacienteInfo();
    loadHistorico();
    checkProntuarioExistente();
    loadProximoAgendamento();
  }, [
    loadPacienteInfo,
    loadHistorico,
    checkProntuarioExistente,
    loadProximoAgendamento,
  ]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calcularIMC = () => {
    const peso = parseFloat(formData.peso);
    const altura = parseFloat(formData.altura);
    if (peso && altura && altura > 0) {
      return (peso / (altura * altura)).toFixed(2);
    }
    return null;
  };

  const handleSave = async (finalizar: boolean = false) => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      const imc = calcularIMC();
      const prontuarioData = {
        tenant_id: profile.tenant_id,
        paciente_id: agendamento.paciente_id,
        profissional_id: user.id,
        agendamento_id: agendamento.id,
        data_atendimento: new Date().toISOString(),

        queixa_principal: formData.queixa_principal || null,
        historia_doenca_atual: formData.historia_doenca_atual || null,
        historia_pregressa: formData.historia_pregressa || null,
        alergias: formData.alergias.length > 0 ? formData.alergias : null,
        medicamentos_uso:
          formData.medicamentos_uso.length > 0
            ? formData.medicamentos_uso
            : null,
        historia_familiar: formData.historia_familiar || null,
        historia_social: formData.historia_social || null,

        subjetivo: formData.subjetivo || null,
        objetivo: formData.objetivo || null,
        avaliacao: formData.avaliacao || null,
        plano: formData.plano || null,

        pressao_arterial: formData.pressao_arterial || null,
        frequencia_cardiaca: formData.frequencia_cardiaca
          ? parseInt(formData.frequencia_cardiaca)
          : null,
        temperatura: formData.temperatura
          ? parseFloat(formData.temperatura)
          : null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        imc: imc ? parseFloat(imc) : null,
        saturacao_o2: formData.saturacao_o2
          ? parseInt(formData.saturacao_o2)
          : null,

        cid10_principal: formData.cid10_principal || null,
        hipotese_diagnostica: formData.hipotese_diagnostica || null,

        observacoes: formData.observacoes || null,
        evolucao: formData.evolucao || null,

        status: finalizar ? "finalizado" : "rascunho",
        finalizado_em: finalizar ? new Date().toISOString() : null,
      };

      let result;
      if (prontuarioAtual) {
        result = await supabase
          .from("prontuarios" as any)
          .update(prontuarioData)
          .eq("id", prontuarioAtual.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from("prontuarios" as any)
          .insert(prontuarioData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Atualizar status do agendamento
      if (finalizar) {
        await supabase
          .from("agenda")
          .update({ status: "concluido" })
          .eq("id", agendamento.id);
      } else {
        await supabase
          .from("agenda")
          .update({ status: "em_atendimento" })
          .eq("id", agendamento.id);
      }

      toast.success(
        finalizar ? "Prontuário finalizado com sucesso" : "Rascunho salvo",
      );

      if (finalizar) {
        onClose();
      } else {
        setProntuarioAtual(result.data);
      }
    } catch (error: any) {
      console.error("Erro ao salvar prontuário:", error);
      toast.error("Erro ao salvar prontuário");
    } finally {
      setLoading(false);
    }
  };

  const isPrimeiraConsulta = historico.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                {pacienteInfo?.nome}
              </h2>
              <Badge
                variant="outline"
                className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-bold tracking-widest px-2"
              >
                Em Atendimento
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <Clock className="h-4 w-4" />
              {format(
                new Date(agendamento.inicio),
                "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                { locale: ptBR },
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => handleSave(false)}
            disabled={loading}
            className="h-11 px-6 border-border/50 hover:bg-muted font-bold uppercase tracking-widest text-[11px] transition-all"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button
            onClick={() => handleSave(true)}
            disabled={loading}
            className="h-11 px-6 shadow-lg shadow-primary/20 font-bold uppercase tracking-widest text-[11px] transition-all active:scale-95"
          >
            <FileCheck className="h-4 w-4 mr-2" />
            Finalizar Atendimento
          </Button>
        </div>
      </div>

      {/* Temporizador de Atendimento */}
      <AtendimentoTimer
        inicioAtendimento={new Date(agendamento.inicio)}
        duracaoMinutos={agendamento.servicos?.duracao_minutos || 60}
        proximoAtendimento={proximoAgendamento}
      />

      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <CardHeader className="bg-muted/10 border-b border-border/50">
          <CardTitle className="flex items-center gap-2 text-lg font-bold italic text-primary uppercase tracking-tighter">
            <Activity className="h-5 w-5" />
            Monitoramento de Sinais Vitais
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Pressão (mmHg)
              </Label>
              <Input
                placeholder="120/80"
                value={formData.pressao_arterial}
                onChange={(e) =>
                  handleInputChange("pressao_arterial", e.target.value)
                }
                className="bg-muted/30 border-none font-medium text-center"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                FC (bpm)
              </Label>
              <Input
                type="number"
                placeholder="72"
                value={formData.frequencia_cardiaca}
                onChange={(e) =>
                  handleInputChange("frequencia_cardiaca", e.target.value)
                }
                className="bg-muted/30 border-none font-medium text-center"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Temp. (°C)
              </Label>
              <Input
                type="number"
                step="0.1"
                placeholder="36.5"
                value={formData.temperatura}
                onChange={(e) =>
                  handleInputChange("temperatura", e.target.value)
                }
                className="bg-muted/30 border-none font-medium text-center"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                SpO2 (%)
              </Label>
              <Input
                type="number"
                placeholder="98"
                value={formData.saturacao_o2}
                onChange={(e) =>
                  handleInputChange("saturacao_o2", e.target.value)
                }
                className="bg-muted/30 border-none font-medium text-center"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Peso (kg)
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="70"
                value={formData.peso}
                onChange={(e) => handleInputChange("peso", e.target.value)}
                className="bg-muted/30 border-none font-medium text-center"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Altura (m)
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="1.75"
                value={formData.altura}
                onChange={(e) => handleInputChange("altura", e.target.value)}
                className="bg-muted/30 border-none font-medium text-center"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                IMC
              </Label>
              <div className="h-10 bg-primary/5 rounded-md flex items-center justify-center font-black text-primary border border-primary/10 shadow-inner">
                {calcularIMC() || "—"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={isPrimeiraConsulta ? "anamnese" : "soap"}>
        <TabsList className="grid w-full grid-cols-3">
          {isPrimeiraConsulta && (
            <TabsTrigger value="anamnese">
              <ClipboardList className="h-4 w-4 mr-2" />
              Anamnese
            </TabsTrigger>
          )}
          <TabsTrigger value="soap">
            <Stethoscope className="h-4 w-4 mr-2" />
            SOAP
          </TabsTrigger>
          <TabsTrigger value="historico">
            <History className="h-4 w-4 mr-2" />
            Histórico ({historico.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="anamnese" className="space-y-8 mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Queixa Principal
              </Label>
              <Textarea
                placeholder="Relato principal do paciente..."
                value={formData.queixa_principal}
                onChange={(e) =>
                  handleInputChange("queixa_principal", e.target.value)
                }
                className="bg-muted/30 border-none min-h-[120px] resize-none leading-relaxed"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                História da Doença
              </Label>
              <Textarea
                placeholder="Desenvolvimento dos sintomas..."
                value={formData.historia_doenca_atual}
                onChange={(e) =>
                  handleInputChange("historia_doenca_atual", e.target.value)
                }
                className="bg-muted/30 border-none min-h-[120px] resize-none leading-relaxed"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Antecedentes Pessoais
              </Label>
              <Textarea
                placeholder="Doenças prévias, cirurgias..."
                value={formData.historia_pregressa}
                onChange={(e) =>
                  handleInputChange("historia_pregressa", e.target.value)
                }
                className="bg-muted/30 border-none min-h-[120px] resize-none leading-relaxed"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Medicamentos em Uso
              </Label>
              <Textarea
                placeholder="Lista de medicamentos e dosagens..."
                value={formData.medicamentos_uso.join(", ")}
                onChange={(e) =>
                  handleInputChange(
                    "medicamentos_uso",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                className="bg-muted/30 border-none min-h-[120px] resize-none leading-relaxed"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="soap" className="space-y-8 mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3 group">
              <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Subjetivo (S)
              </Label>
              <Textarea
                placeholder="Sintomas relatados pelo paciente, queixa principal..."
                value={formData.subjetivo}
                onChange={(e) => handleInputChange("subjetivo", e.target.value)}
                rows={6}
                className="bg-muted/30 border-none focus-visible:ring-primary/20 min-h-[180px] resize-none leading-relaxed"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Objetivo (O)
              </Label>
              <Textarea
                placeholder="Observações clínicas objetivas, exame físico..."
                value={formData.objetivo}
                onChange={(e) => handleInputChange("objetivo", e.target.value)}
                rows={6}
                className="bg-muted/30 border-none focus-visible:ring-primary/20 min-h-[180px] resize-none leading-relaxed"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Avaliação (A)
              </Label>
              <Textarea
                placeholder="Avaliação clínica, diagnóstico, impressão..."
                value={formData.avaliacao}
                onChange={(e) => handleInputChange("avaliacao", e.target.value)}
                rows={6}
                className="bg-muted/30 border-none focus-visible:ring-primary/20 min-h-[180px] resize-none leading-relaxed"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Plano (P)
              </Label>
              <Textarea
                placeholder="Plano terapêutico, orientações, conduta..."
                value={formData.plano}
                onChange={(e) => handleInputChange("plano", e.target.value)}
                rows={6}
                className="bg-muted/30 border-none focus-visible:ring-primary/20 min-h-[180px] resize-none leading-relaxed"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border/50">
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                Observações Adicionais & Evolução do Quadro
              </Label>
              <Textarea
                placeholder="Notas internas, evolução clínica geral..."
                value={formData.evolucao}
                onChange={(e) => handleInputChange("evolucao", e.target.value)}
                className="bg-muted/20 border-border/50 min-h-[100px] resize-none"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="historico" className="space-y-6 outline-none">
          <Card className="border border-border/50 shadow-sm overflow-hidden bg-card/50">
            <CardHeader className="bg-muted/30 border-b border-border/30">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Histórico de Atendimentos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {historicoLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : historico.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/5 rounded-lg border border-dashed border-border/50">
                  <History className="h-8 w-8 mb-2 opacity-20" />
                  <p className="text-sm font-medium">
                    Primeira consulta registrada
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {historico.map((record: any) => (
                      <Card
                        key={record.id}
                        className="border border-border/50 shadow-sm bg-card hover:bg-muted/5 transition-colors"
                      >
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground italic">
                              <Calendar className="h-3 w-3" />
                              {format(
                                new Date(record.data_atendimento),
                                "dd/MM/yyyy 'às' HH:mm",
                                { locale: ptBR },
                              )}
                            </div>
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase bg-success/5 text-success border-success/20"
                            >
                              Finalizado
                            </Badge>
                          </div>
                          {record.avaliacao && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">
                                Avaliação
                              </p>
                              <p className="text-sm text-foreground/90 line-clamp-3">
                                {record.avaliacao}
                              </p>
                            </div>
                          )}
                          {record.plano && (
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1 border-t border-border/30 pt-2">
                                Plano
                              </p>
                              <p className="text-sm text-foreground/90">
                                {record.plano}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
