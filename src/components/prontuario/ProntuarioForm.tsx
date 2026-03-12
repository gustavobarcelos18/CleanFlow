import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Save,
  FileSignature,
  Calendar,
  Activity,
  ClipboardList,
  Stethoscope,
  Pill,
  Microscope,
} from "lucide-react";
import { RegistroMedico } from "./RegistroMedico";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProntuarioFormProps {
  pacienteId: string;
  agendamentoId?: string;
  existingProntuarioId?: string;
  onSave?: () => void;
}

export default function ProntuarioForm({
  pacienteId,
  agendamentoId,
  existingProntuarioId,
  onSave,
}: ProntuarioFormProps) {
  const [loading, setLoading] = useState(false);
  const [prontuarioId, setProntuarioId] = useState<string | null>(
    existingProntuarioId || null,
  );
  const [pacienteInfo, setPacienteInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("soap");
  const [formData, setFormData] = useState({
    // SOAP
    subjetivo: "",
    objetivo: "",
    avaliacao: "",
    plano: "",
    // Vitais
    pressao_arterial: "",
    frequencia_cardiaca: "",
    temperatura: "",
    peso: "",
    altura: "",
    // CID-10
    cid10_principal: "",
    // Prescrições
    prescricoes: "",
    procedimentos: "",
    exames_solicitados: "",
  });

  const fetchPacienteInfo = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pacientes")
        .select("nome, data_nascimento")
        .eq("id", pacienteId)
        .maybeSingle();

      if (error) throw error;
      setPacienteInfo(data);
    } catch (error) {
      console.error("Erro ao buscar informações do paciente:", error);
    }
  }, [pacienteId]);

  useEffect(() => {
    fetchPacienteInfo();
  }, [fetchPacienteInfo]);

  const fetchExistingProntuario = useCallback(async () => {
    const idToFetch = existingProntuarioId || prontuarioId;
    if (!idToFetch) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("prontuarios" as any)
        .select("*")
        .eq("id", idToFetch)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          subjetivo: data.subjetivo || "",
          objetivo: data.objetivo || "",
          avaliacao: data.avaliacao || "",
          plano: data.plano || "",
          pressao_arterial: data.pressao_arterial || "",
          frequencia_cardiaca: data.frequencia_cardiaca?.toString() || "",
          temperatura: data.temperatura?.toString() || "",
          peso: data.peso?.toString() || "",
          altura: data.altura_cm?.toString() || data.altura?.toString() || "",
          cid10_principal: data.cid10_principal || "",
          prescricoes: data.prescricoes || "",
          procedimentos: data.procedimentos || "",
          exames_solicitados: data.exames_solicitados || "",
        });
        setProntuarioId(data.id);
      }
    } catch (error: any) {
      console.error("Erro ao buscar prontuário existente:", error);
      toast.error("Erro ao carregar dados do prontuário");
    } finally {
      setLoading(false);
    }
  }, [existingProntuarioId, prontuarioId]);

  useEffect(() => {
    fetchExistingProntuario();
  }, [fetchExistingProntuario]);

  const calcularIdade = useMemo(() => {
    if (pacienteInfo?.data_nascimento) {
      return differenceInYears(
        new Date(),
        new Date(pacienteInfo.data_nascimento),
      );
    }
    return null;
  }, [pacienteInfo]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateIMC = useMemo(() => {
    if (formData.peso && formData.altura) {
      const peso = parseFloat(formData.peso);
      const altura = parseFloat(formData.altura);
      if (peso > 0 && altura > 0) {
        // Altura em metros no cálculo padrão de IMC
        const alturaMetros = altura > 3 ? altura / 100 : altura;
        return (peso / (alturaMetros * alturaMetros)).toFixed(2);
      }
    }
    return null;
  }, [formData.peso, formData.altura]);

  const handleSave = useCallback(
    async (status: "rascunho" | "finalizado") => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const { data: profile } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .single();

        if (!profile) throw new Error("Perfil não encontrado");

        const imcValue = calculateIMC;

        const dataToSave = {
          ...formData,
          status,
          frequencia_cardiaca: formData.frequencia_cardiaca
            ? parseInt(formData.frequencia_cardiaca)
            : null,
          temperatura: formData.temperatura
            ? parseFloat(formData.temperatura)
            : null,
          peso: formData.peso ? parseFloat(formData.peso) : null,
          altura: formData.altura ? parseFloat(formData.altura) : null,
          altura_cm: formData.altura ? parseFloat(formData.altura) : null,
          imc: imcValue ? parseFloat(imcValue) : null,
        };

        // Ensure all fields are mapped correctly
        const finalData = dataToSave;

        let response;
        if (prontuarioId) {
          response = await supabase
            .from("prontuarios" as any)
            .update(finalData)
            .eq("id", prontuarioId)
            .select()
            .single();
        } else {
          response = await supabase
            .from("prontuarios" as any)
            .insert({
              tenant_id: profile.tenant_id,
              paciente_id: pacienteId,
              profissional_id: user.id,
              agendamento_id: agendamentoId,
              ...finalData,
            })
            .select()
            .single();
        }

        const { data, error } = response;
        if (error) throw error;
        if (data) {
          setProntuarioId(data.id);
        }

        toast.success(
          status === "finalizado"
            ? "Prontuário finalizado e assinado!"
            : "Rascunho salvo com sucesso.",
        );
        onSave?.();
      } catch (error: any) {
        console.error("Erro ao salvar prontuário:", error);
        toast.error(error.message || "Erro ao salvar prontuário");
      } finally {
        setLoading(false);
      }
    },
    [pacienteId, agendamentoId, formData, prontuarioId, onSave, calculateIMC],
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header do Prontuário */}
      <Card className="border-none shadow-sm bg-card overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/5 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl italic shadow-inner">
                {pacienteInfo?.nome?.charAt(0)}
              </div>
              <div className="space-y-0.5">
                <CardTitle className="text-xl font-black tracking-tight text-foreground italic">
                  {pacienteInfo?.nome || "Carregando..."}
                </CardTitle>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em]">
                  <Activity className="h-3 w-3 text-primary" />
                  Paciente em Atendimento
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {pacienteInfo?.data_nascimento && (
                <div className="text-right border-r border-border/50 pr-6 hidden sm:block">
                  <Label className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block mb-0.5">
                    Idade
                  </Label>
                  <p className="text-lg font-black italic">
                    {calcularIdade}{" "}
                    <span className="text-[10px] font-bold text-muted-foreground">
                      anos
                    </span>
                  </p>
                </div>
              )}
              <div className="text-right">
                <Label className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground block mb-0.5">
                  Status do Registro
                </Label>
                <Badge
                  variant="outline"
                  className="bg-primary/5 text-primary border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest italic"
                >
                  {existingProntuarioId
                    ? "Visualização/Edição"
                    : "Novo Atendimento"}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid Principal de Conteúdo */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6 outline-none"
      >
        <Card className="border-none shadow-lg bg-card overflow-hidden">
          <CardHeader className="p-0 border-b border-border/50 bg-muted/5">
            <TabsList className="w-full justify-start h-14 bg-transparent gap-0 rounded-none p-0">
              <TabsTrigger
                value="soap"
                className="flex-1 md:flex-none md:w-48 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-14 px-0 font-bold uppercase tracking-[0.15em] text-[10px] transition-all border-b border-transparent hover:bg-primary/5 group"
              >
                <ClipboardList className="h-3.5 w-3.5 mr-2 opacity-70 group-data-[state=active]:opacity-100" />
                Evolução (SOAP)
              </TabsTrigger>
              <TabsTrigger
                value="vitais"
                className="flex-1 md:flex-none md:w-48 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-14 px-0 font-bold uppercase tracking-[0.15em] text-[10px] transition-all border-b border-transparent hover:bg-primary/5 group"
              >
                <Activity className="h-3.5 w-3.5 mr-2 opacity-70 group-data-[state=active]:opacity-100" />
                Sinais Vitais
              </TabsTrigger>
              <TabsTrigger
                value="diagnostico"
                className="flex-1 md:flex-none md:w-48 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-14 px-0 font-bold uppercase tracking-[0.15em] text-[10px] transition-all border-b border-transparent hover:bg-primary/5 group"
              >
                <Stethoscope className="h-3.5 w-3.5 mr-2 opacity-70 group-data-[state=active]:opacity-100" />
                Diagnóstico
              </TabsTrigger>
              <TabsTrigger
                value="prescricoes"
                className="flex-1 md:flex-none md:w-48 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none h-14 px-0 font-bold uppercase tracking-[0.15em] text-[10px] transition-all border-b border-transparent hover:bg-primary/5 group"
              >
                <Pill className="h-3.5 w-3.5 mr-2 opacity-70 group-data-[state=active]:opacity-100" />
                Prescrições
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-8 pb-10 px-6 md:px-10">
            {/* SOAP Content */}
            <TabsContent
              value="soap"
              className="mt-0 outline-none animate-in fade-in duration-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                    </span>
                    Subjetivo (S)
                  </Label>
                  <Textarea
                    placeholder="Relato do paciente, história da moléstia atual, queixas principais e sintomas..."
                    value={formData.subjetivo}
                    onChange={(e) =>
                      handleInputChange("subjetivo", e.target.value)
                    }
                    className="bg-muted/20 border-border/50 focus-visible:ring-primary/20 min-h-[160px] md:min-h-[220px] resize-none leading-relaxed text-sm font-medium p-4 rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                    </span>
                    Objetivo (O)
                  </Label>
                  <Textarea
                    placeholder="Exame físico, resultados de exames complementares, observações clínicas objetivas..."
                    value={formData.objetivo}
                    onChange={(e) =>
                      handleInputChange("objetivo", e.target.value)
                    }
                    className="bg-muted/20 border-border/50 focus-visible:ring-primary/20 min-h-[160px] md:min-h-[220px] resize-none leading-relaxed text-sm font-medium p-4 rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                    </span>
                    Avaliação (A)
                  </Label>
                  <Textarea
                    placeholder="Diagnóstico provisório ou definitivo, análise crítica dos dados subjetivos e objetivos..."
                    value={formData.avaliacao}
                    onChange={(e) =>
                      handleInputChange("avaliacao", e.target.value)
                    }
                    className="bg-muted/20 border-border/50 focus-visible:ring-primary/20 min-h-[160px] md:min-h-[220px] resize-none leading-relaxed text-sm font-medium p-4 rounded-xl"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="w-1 h-1 rounded-full bg-primary" />
                    </span>
                    Plano (P)
                  </Label>
                  <Textarea
                    placeholder="Conduta terapêutica, orientações, solicitações de exames, data de retorno..."
                    value={formData.plano}
                    onChange={(e) => handleInputChange("plano", e.target.value)}
                    className="bg-muted/20 border-border/50 focus-visible:ring-primary/20 min-h-[160px] md:min-h-[220px] resize-none leading-relaxed text-sm font-medium p-4 rounded-xl"
                  />
                </div>
              </div>
            </TabsContent>

            {/* Vitais Content */}
            <TabsContent
              value="vitais"
              className="mt-0 outline-none animate-in fade-in duration-500 space-y-10"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-2">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground italic pl-1">
                    Pressão Arterial
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="12/8"
                      value={formData.pressao_arterial}
                      onChange={(e) =>
                        handleInputChange("pressao_arterial", e.target.value)
                      }
                      className="bg-muted/30 border-none font-black italic text-lg px-4 h-12 rounded-xl focus-visible:ring-primary/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground opacity-50">
                      mmHg
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground italic pl-1">
                    Freq. Cardíaca
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="80"
                      value={formData.frequencia_cardiaca}
                      onChange={(e) =>
                        handleInputChange("frequencia_cardiaca", e.target.value)
                      }
                      className="bg-muted/30 border-none font-black italic text-lg px-4 h-12 rounded-xl focus-visible:ring-primary/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground opacity-50">
                      bpm
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground italic pl-1">
                    Temperatura
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="36.5"
                      value={formData.temperatura}
                      onChange={(e) =>
                        handleInputChange("temperatura", e.target.value)
                      }
                      className="bg-muted/30 border-none font-black italic text-lg px-4 h-12 rounded-xl focus-visible:ring-primary/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground opacity-50">
                      °C
                    </span>
                  </div>
                </div>
                <div className="bg-primary/5 rounded-2xl p-4 flex flex-col items-center justify-center border border-primary/10 shadow-inner">
                  <Label className="text-[9px] uppercase font-black tracking-widest text-primary mb-1">
                    IMC Calculado
                  </Label>
                  <div className="text-2xl font-black tracking-tighter text-primary italic">
                    {calculateIMC || "--"}
                  </div>
                </div>
              </div>

              {/* Registro Médico Completo (Histórico de Peso/Altura) */}
              <div className="pt-6 border-t border-border/50">
                <div className="flex items-center gap-2 mb-6 ml-2">
                  <Activity className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
                    Histórico e Biometria
                  </h3>
                </div>
                {prontuarioId && (
                  <RegistroMedico
                    prontuarioId={prontuarioId}
                    pacienteId={pacienteId}
                  />
                )}
                {!prontuarioId && (
                  <div className="flex flex-col items-center justify-center py-12 bg-muted/20 rounded-3xl border border-dashed border-border/50 group">
                    <Activity className="h-8 w-8 text-muted-foreground/30 mb-3 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Salve o rascunho para habilitar biometria completa
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Diagnostico Content */}
            <TabsContent
              value="diagnostico"
              className="mt-0 outline-none animate-in fade-in duration-500"
            >
              <div className="space-y-8 max-w-2xl mx-auto">
                <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 shadow-inner">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-4">
                    <Stethoscope className="h-4 w-4" />
                    CID-10 Principal
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Ex: J00 - Nasofaringite aguda (resfriado comum)"
                      value={formData.cid10_principal}
                      onChange={(e) =>
                        handleInputChange("cid10_principal", e.target.value)
                      }
                      className="bg-card border-none font-bold text-sm h-14 px-5 rounded-2xl focus-visible:ring-primary/20 shadow-sm"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                      <Microscope className="h-6 w-6" />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-4 italic font-medium px-2">
                    * Busque pela descrição ou código oficial do CID-10 para
                    garantir precisão diagnóstica.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <Card className="border-none bg-muted/10 p-6 rounded-3xl group hover:bg-muted/20 transition-all cursor-pointer border border-transparent hover:border-primary/10">
                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 block">
                      Auxílio Clínico
                    </Label>
                    <p className="text-xs font-semibold leading-relaxed text-muted-foreground italic mb-0 group-hover:text-foreground transition-colors">
                      Utilize o campo de avaliação no SOAP para detalhar a
                      jornada diagnóstica antes de consolidar o CID-10 final.
                    </p>
                  </Card>
                  <Card className="border-none bg-muted/10 p-6 rounded-3xl group hover:bg-muted/20 transition-all cursor-pointer border border-transparent hover:border-primary/10">
                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4 block">
                      Segurança de Dados
                    </Label>
                    <p className="text-xs font-semibold leading-relaxed text-muted-foreground italic mb-0 group-hover:text-foreground transition-colors">
                      Registros assinados tornam-se parte oficial da ficha do
                      paciente e são protegidos por criptografia de ponta a
                      ponta.
                    </p>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Prescrições Content */}
            <TabsContent
              value="prescricoes"
              className="mt-0 outline-none animate-in fade-in duration-500 space-y-10"
            >
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-2 ml-2">
                  <Pill className="h-4 w-4" />
                  Prescrições Farmacológicas
                </Label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-2xl group-hover:w-2 transition-all" />
                  <Textarea
                    placeholder="Liste os medicamentos, via de administração, dosagem e periodicidade (Ex: Amoxicilina 500mg, VO, 8/8h por 7 dias)..."
                    value={formData.prescricoes}
                    onChange={(e) =>
                      handleInputChange("prescricoes", e.target.value)
                    }
                    className="bg-muted/20 border-border/50 focus-visible:ring-primary/20 min-h-[180px] resize-none leading-relaxed text-sm font-medium p-6 rounded-2xl pl-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-2 ml-2">
                    <Activity className="h-4 w-4 opacity-70" />
                    Condutas & Procedimentos
                  </Label>
                  <Textarea
                    placeholder="Descrição de procedimentos realizados em consultório ou orientações comportamentais..."
                    value={formData.procedimentos}
                    onChange={(e) =>
                      handleInputChange("procedimentos", e.target.value)
                    }
                    className="bg-muted/20 border-border/50 focus-visible:ring-primary/20 min-h-[140px] resize-none leading-relaxed text-sm font-medium p-6 rounded-2xl"
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 mb-2 ml-2">
                    <Microscope className="h-4 w-4 opacity-70" />
                    Exames Solicitados
                  </Label>
                  <Textarea
                    placeholder="Listagem de exames laboratoriais ou de imagem necessários para investigação complementar..."
                    value={formData.exames_solicitados}
                    onChange={(e) =>
                      handleInputChange("exames_solicitados", e.target.value)
                    }
                    className="bg-muted/20 border-border/50 focus-visible:ring-primary/20 min-h-[140px] resize-none leading-relaxed text-sm font-medium p-6 rounded-2xl"
                  />
                </div>
              </div>
            </TabsContent>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4">
          <Button
            onClick={() => handleSave("rascunho")}
            variant="outline"
            disabled={loading}
            className="flex-1 h-14 font-black uppercase tracking-[0.2em] text-[10px] border-border/50 hover:bg-muted hover:border-primary/20 transition-all rounded-2xl italic group"
          >
            <Save className="h-4 w-4 mr-2 transition-transform group-hover:-translate-y-0.5" />
            Salvar Rascunho
          </Button>
          <Button
            onClick={() => handleSave("finalizado")}
            disabled={loading}
            className="flex-1 h-14 font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 rounded-2xl italic group overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <FileSignature className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
            Finalizar e Assinar Digitalmente
          </Button>
        </div>
      </Tabs>
    </div>
  );
}

// Simple cn helper if not imported
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
