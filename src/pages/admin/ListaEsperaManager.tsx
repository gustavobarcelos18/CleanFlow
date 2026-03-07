import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Plus,
  UserPlus,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  Calendar,
  BarChart3,
} from "lucide-react";
import { EncaixeAutomaticoService } from "@/domain/encaixe/EncaixeAutomaticoService";
import { ListaEspera, EncaixeAnalytics } from "@/domain/encaixe/types";

export default function ListaEsperaManager() {
  const { profile } = useAuth();
  const [listaEspera, setListaEspera] = useState<ListaEspera[]>([]);
  const [analytics, setAnalytics] = useState<EncaixeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Carregar lista de espera
      const { data: lista, error: listaError } = await supabase
        .from("lista_espera")
        .select(
          `
          *,
          pacientes(id, nome, telefone),
          profiles(nome),
          servicos(nome)
        `,
        )
        .eq("tenant_id", profile.tenant_id)
        .eq("ativo", true)
        .order("prioridade", { ascending: false })
        .order("created_at", { ascending: true });

      if (listaError) throw listaError;
      setListaEspera(lista || []);

      // Carregar analytics
      const analyticsData = await EncaixeAutomaticoService.obterAnalytics(
        profile.tenant_id,
      );
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar lista de espera");
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id]);

  useEffect(() => {
    if (profile?.tenant_id) {
      loadData();
    }
  }, [profile?.tenant_id, loadData]);

  const handleAdicionarListaEspera = async (
    pacienteId: string,
    dados: Partial<ListaEspera>,
  ) => {
    try {
      await EncaixeAutomaticoService.adicionarListaEspera({
        tenant_id: profile.tenant_id,
        paciente_id: pacienteId,
        ...dados,
      });

      toast.success("Paciente adicionado à lista de espera");
      loadData();
    } catch (error) {
      toast.error("Erro ao adicionar à lista de espera");
    }
  };

  const handleRemoverListaEspera = async (id: string) => {
    try {
      await supabase.from("lista_espera").update({ ativo: false }).eq("id", id);

      toast.success("Removido da lista de espera");
      loadData();
    } catch (error) {
      toast.error("Erro ao remover da lista");
    }
  };

  const getPrioridadeBadge = (prioridade: number) => {
    switch (prioridade) {
      case 2:
        return <Badge variant="destructive">Urgente</Badge>;
      case 1:
        return <Badge variant="default">Alta</Badge>;
      default:
        return <Badge variant="secondary">Normal</Badge>;
    }
  };

  const getTempoEspera = (createdAt: string) => {
    const diff = Date.now() - new Date(createdAt).getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (dias > 0) return `${dias}d ${horas}h`;
    return `${horas}h`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lista de Espera</h1>
          <p className="text-muted-foreground">
            Gerencie pacientes aguardando encaixe automático
          </p>
        </div>
        <NovoListaEsperaDialog onAdd={handleAdicionarListaEspera} />
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Na Lista</p>
                  <p className="text-2xl font-bold">
                    {analytics.lista_espera_ativos}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Taxa de Aceitação
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.taxa_aceitacao_pct}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Ofertas Aceitas
                  </p>
                  <p className="text-2xl font-bold">
                    {analytics.ofertas_aceitas}
                  </p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Tempo Médio Resposta
                  </p>
                  <p className="text-2xl font-bold">
                    {Math.round(analytics.tempo_medio_resposta_min || 0)}min
                  </p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de Espera */}
      <Card>
        <CardHeader>
          <CardTitle>Pacientes Aguardando</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : listaEspera.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum paciente na lista de espera</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listaEspera.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{item.pacientes?.nome}</h3>
                      {getPrioridadeBadge(item.prioridade)}
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {getTempoEspera(item.created_at)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>📞 {item.pacientes?.telefone}</p>
                      {item.profiles && (
                        <p>👨‍⚕️ Profissional: {item.profiles.nome}</p>
                      )}
                      {item.servicos && <p>🔧 Serviço: {item.servicos.nome}</p>}
                      {item.periodo_preferencial && (
                        <p>🕐 Período: {item.periodo_preferencial}</p>
                      )}
                      {item.observacoes && (
                        <p className="text-xs">💬 {item.observacoes}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoverListaEspera(item.id)}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function NovoListaEsperaDialog({
  onAdd,
}: {
  onAdd: (pacienteId: string, dados: any) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pacienteId, setPacienteId] = useState("");
  const [prioridade, setPrioridade] = useState("0");
  const [periodo, setPeriodo] = useState("qualquer");
  const [observacoes, setObservacoes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(pacienteId, {
      prioridade: parseInt(prioridade),
      periodo_preferencial: periodo,
      observacoes,
    });
    setOpen(false);
    setPacienteId("");
    setPrioridade("0");
    setPeriodo("qualquer");
    setObservacoes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Adicionar à Lista
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar à Lista de Espera</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Paciente</Label>
            <Input
              placeholder="ID do paciente"
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Prioridade</Label>
            <Select value={prioridade} onValueChange={setPrioridade}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Normal</SelectItem>
                <SelectItem value="1">Alta</SelectItem>
                <SelectItem value="2">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Período Preferencial</Label>
            <Select value={periodo} onValueChange={setPeriodo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="qualquer">Qualquer</SelectItem>
                <SelectItem value="manha">Manhã</SelectItem>
                <SelectItem value="tarde">Tarde</SelectItem>
                <SelectItem value="noite">Noite</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observações</Label>
            <Input
              placeholder="Observações opcionais"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            Adicionar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
