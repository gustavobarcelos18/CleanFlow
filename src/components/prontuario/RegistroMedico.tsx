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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Ruler, Weight, TrendingUp, Plus, Pencil, Trash2 } from "lucide-react";
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
  const { toast } = useToast();

  const fetchDados = useCallback(async () => {
    try {
      setLoading(true);

      // Buscar altura do prontuário
      const { data: prontuario, error: errorProntuario } = await (
        supabase as any
      )
        .from("prontuarios")
        .select("altura_cm")
        .eq("id", prontuarioId)
        .maybeSingle();

      if (errorProntuario) throw errorProntuario;
      if (prontuario) {
        setAltura(prontuario.altura_cm);
      }

      // Buscar histórico de peso
      const { data: historico, error: errorHistorico } = await (supabase as any)
        .from("historico_peso")
        .select("*")
        .eq("paciente_id", pacienteId)
        .order("data_registro", { ascending: false });

      if (errorHistorico) throw errorHistorico;
      setRegistrosPeso(historico || []);
    } catch (error: any) {
      console.error("Erro ao buscar dados médicos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados médicos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [prontuarioId, pacienteId, toast]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  const handleSalvarAltura = async () => {
    if (!novaAltura || isNaN(parseFloat(novaAltura))) {
      toast({
        title: "Erro",
        description: "Digite uma altura válida.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from("prontuarios")
        .update({ altura_cm: parseFloat(novaAltura) })
        .eq("id", prontuarioId);

      if (error) throw error;

      setAltura(parseFloat(novaAltura));
      setEditandoAltura(false);
      setNovaAltura("");

      toast({
        title: "Sucesso!",
        description: "Altura atualizada.",
      });

      // Recalcular IMC dos registros de peso existentes
      fetchDados();
    } catch (error: any) {
      console.error("Erro ao salvar altura:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar a altura.",
        variant: "destructive",
      });
    }
  };

  const handleAdicionarPeso = async () => {
    if (!novoPeso || isNaN(parseFloat(novoPeso))) {
      toast({
        title: "Erro",
        description: "Digite um peso válido.",
        variant: "destructive",
      });
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
        peso_kg: parseFloat(novoPeso),
        observacoes: observacaoPeso || null,
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Registro de peso adicionado.",
      });

      setNovoPeso("");
      setObservacaoPeso("");
      setAdicionandoPeso(false);
      fetchDados();
    } catch (error: any) {
      console.error("Erro ao adicionar peso:", error);
      toast({
        title: "Erro",
        description:
          error.message || "Não foi possível adicionar o registro de peso.",
        variant: "destructive",
      });
    }
  };

  const handleExcluirPeso = async (id: string) => {
    if (!confirm("Deseja excluir este registro de peso?")) return;

    try {
      const { error } = await (supabase as any)
        .from("historico_peso")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Registro excluído.",
      });

      fetchDados();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o registro.",
        variant: "destructive",
      });
    }
  };

  const classificarIMC = (imc: number | null) => {
    if (!imc) return { texto: "N/A", cor: "secondary" };
    if (imc < 18.5) return { texto: "Abaixo do peso", cor: "destructive" };
    if (imc < 25) return { texto: "Peso normal", cor: "default" };
    if (imc < 30) return { texto: "Sobrepeso", cor: "secondary" };
    return { texto: "Obesidade", cor: "destructive" };
  };

  if (loading) {
    return <div className="text-center py-4">Carregando dados médicos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Altura */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Altura
          </CardTitle>
          <CardDescription>
            Registro único da altura do paciente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editandoAltura ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  value={novaAltura}
                  onChange={(e) => setNovaAltura(e.target.value)}
                  placeholder="Ex: 175.5"
                  className="max-w-xs"
                />
                <span className="flex items-center">cm</span>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSalvarAltura} size="sm">
                  Salvar
                </Button>
                <Button
                  onClick={() => {
                    setEditandoAltura(false);
                    setNovaAltura("");
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                {altura ? (
                  <p className="text-2xl font-bold">{altura} cm</p>
                ) : (
                  <p className="text-muted-foreground">Não cadastrada</p>
                )}
              </div>
              {!readOnly && (
                <Button
                  onClick={() => {
                    setEditandoAltura(true);
                    setNovaAltura(altura?.toString() || "");
                  }}
                  variant="outline"
                  size="sm"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  {altura ? "Editar" : "Cadastrar"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Peso */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Weight className="h-5 w-5" />
                Histórico de Peso
              </CardTitle>
              <CardDescription>
                Registros de peso ao longo do tempo
              </CardDescription>
            </div>
            {!readOnly && !adicionandoPeso && (
              <Button onClick={() => setAdicionandoPeso(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Registro
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {adicionandoPeso && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
              <div className="space-y-2">
                <Label>Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={novoPeso}
                  onChange={(e) => setNovoPeso(e.target.value)}
                  placeholder="Ex: 75.5"
                  className="max-w-xs"
                />
              </div>
              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Textarea
                  value={observacaoPeso}
                  onChange={(e) => setObservacaoPeso(e.target.value)}
                  placeholder="Observações sobre a medição"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdicionarPeso} size="sm">
                  Adicionar
                </Button>
                <Button
                  onClick={() => {
                    setAdicionandoPeso(false);
                    setNovoPeso("");
                    setObservacaoPeso("");
                  }}
                  variant="outline"
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {registrosPeso.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum registro de peso cadastrado
            </p>
          ) : (
            <div className="space-y-3">
              {registrosPeso.map((registro) => {
                const classificacao = classificarIMC(registro.imc);
                return (
                  <div
                    key={registro.id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-semibold">
                          {registro.peso_kg} kg
                        </p>
                        {registro.imc && (
                          <div className="flex items-center gap-2">
                            <Badge variant={classificacao.cor as any}>
                              IMC: {registro.imc.toFixed(1)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {classificacao.texto}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(
                          new Date(registro.data_registro),
                          "dd 'de' MMMM 'de' yyyy 'às' HH:mm",
                          { locale: ptBR },
                        )}
                      </p>
                      {registro.observacoes && (
                        <p className="text-sm mt-2">{registro.observacoes}</p>
                      )}
                    </div>
                    {!readOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExcluirPeso(registro.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
