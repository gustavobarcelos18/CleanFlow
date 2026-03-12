import { useState, useEffect, useCallback } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Ruler,
  Weight,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RegistroMedicoProps {
  prontuarioId: string;
  pacienteId: string;
  readOnly?: boolean;
}

interface RegistroPeso {
  id: string;
  peso_kg: number;
  imc: number | null;
  data_registro: string;
  observacoes: string | null;
}

export function RegistroMedico({
  prontuarioId,
  pacienteId,
  readOnly = false,
}: RegistroMedicoProps) {
  const [altura, setAltura] = useState<number | null>(null);
  const [editandoAltura, setEditandoAltura] = useState(false);
  const [novaAltura, setNovaAltura] = useState("");

  const [registrosPeso, setRegistrosPeso] = useState<RegistroPeso[]>([]);
  const [adicionandoPeso, setAdicionandoPeso] = useState(false);
  const [novoPeso, setNovoPeso] = useState("");
  const [observacaoPeso, setObservacaoPeso] = useState("");

  const [loading, setLoading] = useState(true);

  const fetchDados = useCallback(async () => {
    try {
      setLoading(true);

      // Buscar altura do prontuário
      const { data: prontuario, error: errorProntuario } = await supabase
        .from("prontuarios" as any)
        .select("altura_cm")
        .eq("id", prontuarioId)
        .maybeSingle();

      if (errorProntuario) throw errorProntuario;
      if (prontuario) {
        setAltura(prontuario.altura_cm);
      }

      // Buscar histórico de peso
      const { data: historico, error: errorHistorico } = await supabase
        .from("historico_peso" as any)
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("data_registro", { ascending: false });

      if (errorHistorico) throw errorHistorico;
      setRegistrosPeso(historico || []);
    } catch (error: any) {
      console.error("Erro ao buscar dados médicos:", error);
      toast.error("Não foi possível carregar os dados médicos.");
    } finally {
      setLoading(false);
    }
  }, [prontuarioId, pacienteId]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const [unitSystem, setUnitSystem] = useState<"metric" | "imperial">("metric");

  const toggleUnitSystem = () => {
    setUnitSystem((prev) => (prev === "metric" ? "imperial" : "metric"));
  };

  const convertHeight = (cm: number | null, to: "metric" | "imperial") => {
    if (cm === null) return "";
    if (to === "metric") return cm.toString();
    // cm to inches
    return (cm / 2.54).toFixed(1);
  };

  const convertWeight = (kg: number | null, to: "metric" | "imperial") => {
    if (kg === null) return "";
    if (to === "metric") return kg.toString();
    // kg to lbs
    return (kg * 2.20462).toFixed(1);
  };

  const parseHeightInput = (val: string, system: "metric" | "imperial") => {
    const num = parseFloat(val);
    if (isNaN(num)) return null;
    if (system === "metric") return num;
    // inches to cm
    return num * 2.54;
  };

  const parseWeightInput = (val: string, system: "metric" | "imperial") => {
    const num = parseFloat(val);
    if (isNaN(num)) return null;
    if (system === "metric") return num;
    // lbs to kg
    return num / 2.20462;
  };

  const handleSalvarAltura = async () => {
    const alturaCm = parseHeightInput(novaAltura, unitSystem);
    if (alturaCm === null) {
      toast.error("Digite uma altura válida.");
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from("prontuarios")
        .update({ altura_cm: alturaCm })
        .eq("id", prontuarioId);

      if (error) throw error;

      setAltura(alturaCm);
      setEditandoAltura(false);
      setNovaAltura("");

      toast.success("Altura atualizada.");
      fetchDados();
    } catch (error: any) {
      console.error("Erro ao salvar altura:", error);
      toast.error(error.message || "Não foi possível salvar a altura.");
    }
  };

  const handleAdicionarPeso = async () => {
    const pesoKg = parseWeightInput(novoPeso, unitSystem);
    if (pesoKg === null) {
      toast.error("Digite um peso válido.");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

      const { error } = await (supabase as any).from("historico_peso").insert({
        tenant_id: profile.tenant_id,
        paciente_id: pacienteId,
        profissional_id: user.id,
        prontuario_id: prontuarioId,
        peso_kg: pesoKg,
        observacoes: observacaoPeso || null,
      });

      if (error) throw error;

      toast.success("Registro de peso adicionado.");
      setNovoPeso("");
      setObservacaoPeso("");
      setAdicionandoPeso(false);
      fetchDados();
    } catch (error: any) {
      console.error("Erro ao adicionar peso:", error);
      toast.error(
        error.message || "Não foi possível adicionar o registro de peso.",
      );
    }
  };

  const handleExcluirPeso = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from("historico_peso")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Registro excluído.");
      fetchDados();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast.error("Não foi possível excluir o registro.");
    }
  };

  const classificarIMC = (imc: number | null) => {
    if (!imc) return { texto: "N/A", cor: "bg-muted text-muted-foreground" };
    if (imc < 18.5)
      return {
        texto: "Abaixo do peso",
        cor: "bg-destructive/10 text-destructive border-destructive/20",
      };
    if (imc < 25)
      return {
        texto: "Peso normal",
        cor: "bg-success/10 text-success border-success/20",
      };
    if (imc < 30)
      return {
        texto: "Sobrepeso",
        cor: "bg-warning/10 text-warning border-warning/20",
      };
    return {
      texto: "Obesidade",
      cor: "bg-destructive/10 text-destructive border-destructive/20",
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Activity className="h-6 w-6 text-primary animate-pulse mr-2" />
        <span className="text-sm font-medium text-muted-foreground animate-pulse">
          Carregando dados biométricos...
        </span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
      {/* Coluna Biometria Rápida (Altura e IMC) */}
      <div className="lg:col-span-1 space-y-4">
        <div className="flex items-center justify-between mb-4 ml-1">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <Activity className="h-3 w-3" />
            Biometria Atual
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleUnitSystem}
            className="h-6 px-2 text-[8px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors border border-border/30 rounded-lg"
          >
            {unitSystem === "metric" ? "Métrico (cm/kg)" : "Imperial (in/lb)"}
          </Button>
        </div>

        {/* Altura */}
        <Card className="border-none shadow-sm bg-card/40 overflow-hidden backdrop-blur-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Ruler className="h-3 w-3" />
                Altura ({unitSystem === "metric" ? "cm" : "in"})
              </Label>
              {!readOnly && !editandoAltura && (
                <Button
                  onClick={() => {
                    setEditandoAltura(true);
                    setNovaAltura(convertHeight(altura, unitSystem));
                  }}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-primary/10 hover:text-primary"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>

            {editandoAltura ? (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="relative group">
                  <Input
                    type="text"
                    value={novaAltura}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 3);
                      if (unitSystem === "metric") {
                        if (val.length <= 1) {
                          setNovaAltura(val);
                        } else if (val.length === 2) {
                          setNovaAltura(`${val[0]}.${val[1]}`);
                        } else {
                          setNovaAltura(`${val[0]}.${val[1]}${val[2]}`);
                        }
                      } else {
                        setNovaAltura(val);
                      }
                    }}
                    placeholder={
                      unitSystem === "metric" ? "Ex: 1.75" : "Ex: 68"
                    }
                    className="bg-muted/30 border-none font-black italic text-lg pl-4 pr-14 h-11 rounded-xl focus-visible:ring-primary/20"
                    autoFocus
                  />
                  <div className="absolute right-0 top-0 h-full flex items-center px-4 bg-primary/5 rounded-r-xl border-l border-primary/10">
                    <span className="text-[10px] font-black uppercase text-primary italic leading-none">
                      {unitSystem === "metric" ? "m" : "in"}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSalvarAltura}
                    size="sm"
                    className="flex-1 h-8 text-[9px] font-black uppercase tracking-widest italic shadow-sm"
                  >
                    Salvar
                  </Button>
                  <Button
                    onClick={() => setEditandoAltura(false)}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-[9px] font-black uppercase tracking-widest border-border/50 italic"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black tracking-tighter italic text-foreground leading-none">
                  {altura ? convertHeight(altura, unitSystem) : "--"}
                </span>
                <span className="text-[10px] font-bold uppercase text-muted-foreground italic">
                  {unitSystem === "metric" ? "cm" : "in"}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* IMC Atual (Apenas se tiver peso) */}
        {registrosPeso.length > 0 && (
          <Card className="border-none shadow-sm bg-card/40 overflow-hidden backdrop-blur-sm">
            <CardContent className="p-5">
              <Label className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1.5 mb-4">
                <Activity className="h-3 w-3" />
                IMC Calculado
              </Label>
              <div className="flex flex-col gap-2">
                <div className="text-3xl font-black tracking-tighter italic text-foreground leading-none">
                  {registrosPeso[0].imc?.toFixed(1) || "--"}
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "w-fit px-2 py-0.5 font-bold uppercase tracking-widest text-[8px] border-none shadow-sm",
                    classificarIMC(registrosPeso[0].imc).cor,
                  )}
                >
                  {classificarIMC(registrosPeso[0].imc).texto}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Histórico de Peso (Coluna Maior) */}
      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center justify-between mb-4 ml-1">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <Weight className="h-3 w-3" />
            Histórico Ponderal ({unitSystem === "metric" ? "kg" : "lb"})
          </label>
          {!readOnly && !adicionandoPeso && (
            <Button
              onClick={() => {
                setAdicionandoPeso(true);
                setNovoPeso("");
              }}
              size="sm"
              variant="outline"
              className="h-7 px-3 text-[9px] font-black uppercase tracking-widest border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all italic shadow-sm"
            >
              <Plus className="h-3 w-3 mr-1.5" />
              Novo Registro
            </Button>
          )}
        </div>

        <Card className="border-none shadow-sm bg-card/20 overflow-hidden min-h-[300px]">
          <CardContent
            className={cn(
              "p-0 max-h-[460px] overflow-y-auto custom-scrollbar-subtle",
              adicionandoPeso ? "pt-0" : "pt-2",
            )}
          >
            {adicionandoPeso && (
              <div className="p-6 border-b border-border/30 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-400">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black tracking-widest text-primary italic ml-1">
                      Peso ({unitSystem === "metric" ? "kg" : "lb"})
                    </Label>
                    <div className="relative group">
                      <Input
                        type="text"
                        value={novoPeso}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 5);
                          if (unitSystem === "metric") {
                            if (val.length <= 2) {
                              setNovoPeso(val);
                            } else if (val.length === 3) {
                              setNovoPeso(`${val.slice(0, 1)}.${val.slice(1)}`);
                            } else if (val.length === 4) {
                              setNovoPeso(`${val.slice(0, 2)}.${val.slice(2)}`);
                            } else {
                              setNovoPeso(`${val.slice(0, 3)}.${val.slice(3)}`);
                            }
                          } else {
                            setNovoPeso(val);
                          }
                        }}
                        placeholder={
                          unitSystem === "metric" ? "Ex: 70.00" : "Ex: 154"
                        }
                        className="bg-card/50 border-none font-black italic text-base h-11 pl-4 pr-14 rounded-xl focus-visible:ring-primary/20 shadow-inner"
                        autoFocus
                      />
                      <div className="absolute right-0 top-0 h-full flex items-center px-4 bg-primary/5 rounded-r-xl border-l border-primary/10">
                        <span className="text-[10px] font-black uppercase text-primary italic leading-none">
                          {unitSystem === "metric" ? "kg" : "lb"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[9px] uppercase font-black tracking-widest text-primary italic ml-1">
                      Observações
                    </Label>
                    <Input
                      value={observacaoPeso}
                      onChange={(e) => setObservacaoPeso(e.target.value)}
                      placeholder="Ex: Medição pós-refeição"
                      className="bg-card/50 border-none font-bold text-xs h-11 px-4 rounded-xl focus-visible:ring-primary/20 shadow-inner"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={handleAdicionarPeso}
                    size="sm"
                    className="h-10 px-8 font-black text-[10px] uppercase tracking-widest italic shadow-lg shadow-primary/20"
                  >
                    Confirmar Registro
                  </Button>
                  <Button
                    onClick={() => setAdicionandoPeso(false)}
                    variant="ghost"
                    size="sm"
                    className="h-10 px-6 font-black text-[10px] uppercase tracking-widest italic hover:bg-destructive/10 hover:text-destructive"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {registrosPeso.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40 italic">
                <Activity className="h-12 w-12 opacity-10 mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">
                  Sem medições registradas
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {registrosPeso.map((registro, idx) => (
                  <div
                    key={registro.id}
                    className="group flex items-center justify-between p-5 hover:bg-primary/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-8">
                      {/* Peso */}
                      <div className="flex flex-col">
                        <p className="text-2xl font-black tracking-tighter text-foreground italic leading-none">
                          {convertWeight(registro.peso_kg, unitSystem)}
                          <span className="text-[10px] font-bold uppercase text-muted-foreground ml-1 italic">
                            {unitSystem === "metric" ? "kg" : "lb"}
                          </span>
                        </p>
                        <Label className="text-[8px] uppercase font-bold tracking-widest text-muted-foreground mt-1">
                          Peso Ponderal
                        </Label>
                      </div>

                      {/* IMC */}
                      {registro.imc && (
                        <div className="hidden sm:flex flex-col border-l border-border/30 pl-8">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black italic text-foreground/80 leading-none">
                              {registro.imc.toFixed(1)}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-2 h-4 text-[7px] font-black uppercase tracking-widest border-none shadow-sm",
                                classificarIMC(registro.imc).cor,
                              )}
                            >
                              {classificarIMC(registro.imc).texto}
                            </Badge>
                          </div>
                          <Label className="text-[8px] uppercase font-bold tracking-widest text-muted-foreground mt-1">
                            Indice de Massa
                          </Label>
                        </div>
                      )}

                      {/* Data */}
                      <div className="hidden md:flex flex-col border-l border-border/30 pl-8">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/60 italic leading-none">
                          <Calendar className="h-3 w-3 opacity-40" />
                          {format(
                            new Date(registro.data_registro),
                            "dd/MM/yyyy HH:mm",
                            { locale: ptBR },
                          )}
                        </div>
                        <Label className="text-[8px] uppercase font-bold tracking-widest text-muted-foreground mt-1">
                          Data da Coleta
                        </Label>
                      </div>

                      {/* Obs */}
                      {registro.observacoes && (
                        <div className="hidden lg:flex flex-col border-l border-border/30 pl-8 max-w-[200px]">
                          <p className="text-[10px] font-semibold text-muted-foreground italic truncate leading-none">
                            {registro.observacoes}
                          </p>
                          <Label className="text-[8px] uppercase font-bold tracking-widest text-muted-foreground mt-1">
                            Observações
                          </Label>
                        </div>
                      )}
                    </div>

                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleExcluirPeso(registro.id)}
                        className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Utility function duplicated here for safety or import from lib/utils if available
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
