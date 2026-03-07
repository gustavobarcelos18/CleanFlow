import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, FileSignature, Calendar } from "lucide-react";
import { RegistroMedico } from "./RegistroMedico";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProntuarioFormProps {
  pacienteId: string;
  agendamentoId?: string;
  onSave?: () => void;
}

export default function ProntuarioForm({
  pacienteId,
  agendamentoId,
  onSave,
}: ProntuarioFormProps) {
  const [loading, setLoading] = useState(false);
  const [prontuarioId, setProntuarioId] = useState<string | null>(null);
  const [pacienteInfo, setPacienteInfo] = useState<any>(null);
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
      const { data, error } = await (supabase as any)
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

  const calcularIdade = () => {
    if (pacienteInfo?.data_nascimento) {
      return differenceInYears(
        new Date(),
        new Date(pacienteInfo.data_nascimento),
      );
    }
    return null;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const calculateIMC = () => {
    if (formData.peso && formData.altura) {
      const peso = parseFloat(formData.peso);
      const altura = parseFloat(formData.altura);
      if (peso > 0 && altura > 0) {
        return (peso / (altura * altura)).toFixed(2);
      }
    }
    return null;
  };

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

        const imc = calculateIMC();

        const { data, error } = await (supabase as any)
          .from("prontuarios")
          .insert({
            tenant_id: profile.tenant_id,
            paciente_id: pacienteId,
            profissional_id: user.id,
            agendamento_id: agendamentoId,
            status,
            ...formData,
            frequencia_cardiaca: formData.frequencia_cardiaca
              ? parseInt(formData.frequencia_cardiaca)
              : null,
            temperatura: formData.temperatura
              ? parseFloat(formData.temperatura)
              : null,
            peso: null, // Peso agora é gerenciado pelo histórico
            altura: null, // Altura agora é gerenciada pelo RegistroMedico
            imc: null, // IMC calculado automaticamente no histórico de peso
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          setProntuarioId(data.id);
        }

        toast.success(
          status === "finalizado"
            ? "Prontuário salvo com sucesso!"
            : "Rascunho salvo!",
        );
        onSave?.();
      } catch (error: any) {
        console.error("Erro ao salvar prontuário:", error);
        toast.error(error.message || "Erro ao salvar prontuário");
      } finally {
        setLoading(false);
      }
    },
    [pacienteId, agendamentoId, formData, onSave],
  );

  return (
    <div className="space-y-6">
      {pacienteInfo && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informações do Paciente</CardTitle>
              {pacienteInfo.data_nascimento && (
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {calcularIdade()} anos
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-lg font-semibold">{pacienteInfo.nome}</p>
              {pacienteInfo.data_nascimento && (
                <p className="text-sm text-muted-foreground">
                  Nascimento:{" "}
                  {format(
                    new Date(pacienteInfo.data_nascimento),
                    "dd 'de' MMMM 'de' yyyy",
                    { locale: ptBR },
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {prontuarioId && (
        <RegistroMedico prontuarioId={prontuarioId} pacienteId={pacienteId} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Prontuário Eletrônico</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="soap" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="soap">SOAP</TabsTrigger>
              <TabsTrigger value="vitais">Sinais Vitais</TabsTrigger>
              <TabsTrigger value="diagnostico">Diagnóstico</TabsTrigger>
              <TabsTrigger value="prescricoes">Prescrições</TabsTrigger>
            </TabsList>

            <TabsContent value="soap" className="space-y-4">
              <div className="space-y-2">
                <Label>Subjetivo (S)</Label>
                <Textarea
                  placeholder="Sintomas relatados pelo paciente, queixa principal, história da doença atual..."
                  value={formData.subjetivo}
                  onChange={(e) =>
                    handleInputChange("subjetivo", e.target.value)
                  }
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Objetivo (O)</Label>
                <Textarea
                  placeholder="Observações clínicas objetivas, exame físico, resultados de exames..."
                  value={formData.objetivo}
                  onChange={(e) =>
                    handleInputChange("objetivo", e.target.value)
                  }
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Avaliação (A)</Label>
                <Textarea
                  placeholder="Avaliação clínica, diagnóstico, impressão diagnóstica..."
                  value={formData.avaliacao}
                  onChange={(e) =>
                    handleInputChange("avaliacao", e.target.value)
                  }
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Plano (P)</Label>
                <Textarea
                  placeholder="Plano terapêutico, orientações, retorno, encaminhamentos..."
                  value={formData.plano}
                  onChange={(e) => handleInputChange("plano", e.target.value)}
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="vitais" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pressão Arterial</Label>
                  <Input
                    placeholder="120/80 mmHg"
                    value={formData.pressao_arterial}
                    onChange={(e) =>
                      handleInputChange("pressao_arterial", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequência Cardíaca</Label>
                  <Input
                    type="number"
                    placeholder="75 bpm"
                    value={formData.frequencia_cardiaca}
                    onChange={(e) =>
                      handleInputChange("frequencia_cardiaca", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temperatura (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="36.5"
                    value={formData.temperatura}
                    onChange={(e) =>
                      handleInputChange("temperatura", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="70.5"
                    value={formData.peso}
                    onChange={(e) => handleInputChange("peso", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Altura (m)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="1.75"
                    value={formData.altura}
                    onChange={(e) =>
                      handleInputChange("altura", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>IMC</Label>
                  <Input
                    value={calculateIMC() || "-"}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="diagnostico" className="space-y-4">
              <div className="space-y-2">
                <Label>CID-10 Principal</Label>
                <Input
                  placeholder="Ex: A09 - Diarreia e gastroenterite"
                  value={formData.cid10_principal}
                  onChange={(e) =>
                    handleInputChange("cid10_principal", e.target.value)
                  }
                />
              </div>
            </TabsContent>

            <TabsContent value="prescricoes" className="space-y-4">
              <div className="space-y-2">
                <Label>Prescrições</Label>
                <Textarea
                  placeholder="Medicamentos prescritos, dosagem, frequência, duração..."
                  value={formData.prescricoes}
                  onChange={(e) =>
                    handleInputChange("prescricoes", e.target.value)
                  }
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Procedimentos Realizados</Label>
                <Textarea
                  placeholder="Procedimentos realizados durante a consulta..."
                  value={formData.procedimentos}
                  onChange={(e) =>
                    handleInputChange("procedimentos", e.target.value)
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Exames Solicitados</Label>
                <Textarea
                  placeholder="Exames complementares solicitados..."
                  value={formData.exames_solicitados}
                  onChange={(e) =>
                    handleInputChange("exames_solicitados", e.target.value)
                  }
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 mt-6">
            <Button
              onClick={() => handleSave("rascunho")}
              variant="outline"
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Rascunho
            </Button>
            <Button onClick={() => handleSave("finalizado")} disabled={loading}>
              <FileSignature className="h-4 w-4 mr-2" />
              Finalizar Prontuário
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
