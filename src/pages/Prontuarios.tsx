import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Search, Plus, User, Clock, ShieldCheck, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProntuarioCardSkeleton } from "@/components/prontuario/ProntuarioCardSkeleton";
import { cn } from "@/lib/utils";
import { useTerminology } from "@/stores/useSegmentStore";
import { useLayoutTitle } from "@/hooks/useLayoutTitle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProntuarioForm from "@/components/prontuario/ProntuarioForm";
import { PatientCombobox } from "@/components/schedule/PatientCombobox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Prontuarios() {
  const t = useTerminology();
  const { setTitle, setSubtitle } = useLayoutTitle();
  const [prontuarios, setProntuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSelectionDialogOpen, setIsSelectionDialogOpen] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [tempSelectedPacienteId, setTempSelectedPacienteId] = useState<string>("");
  const [selectedProntuarioId, setSelectedProntuarioId] = useState<string | undefined>(undefined);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setTitle(`Prontuários Eletrônicos`);
    setSubtitle(`Consulta e gerenciamento do histórico clínico de ${t.client_label.toLowerCase()}s.`);
  }, [setTitle, setSubtitle, t.client_label]);

  const loadPatients = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      const { data, error } = await supabase
        .from("pacientes")
        .select("id, nome, telefone")
        .eq("tenant_id", profile.tenant_id)
        .order("nome");

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error("Erro ao carregar pacientes:", error);
    }
  }, []);

  const loadProntuarios = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id, role")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      let query = supabase
        .from("prontuarios" as any)
        .select(`
          *,
          pacientes(nome, telefone),
          profiles(nome)
        `)
        .eq("tenant_id", profile.tenant_id)
        .order("data_atendimento", { ascending: false });

      if (profile.role === "profissional") {
        query = query.eq("profissional_id", user.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setProntuarios(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar prontuários:", error);
      toast.error("Erro ao carregar prontuários");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProntuarios();
    loadPatients();
  }, [loadProntuarios, loadPatients]);

  const filteredProntuarios = prontuarios.filter(
    (p) =>
      p.pacientes?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.profiles?.nome.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "finalizado":
      case "concluido":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 font-bold">
            <FileText className="w-3 h-3" />
            Finalizado
          </Badge>
        );
      case "rascunho":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1 font-bold">
            <Clock className="w-3 h-3" />
            Rascunho
          </Badge>
        );
      case "assinado":
        return (
          <Badge className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20 gap-1 font-bold">
            <ShieldCheck className="w-3 h-3" />
            Assinado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleViewRecord = (prontuario: any) => {
    setSelectedProntuarioId(prontuario.id);
    setSelectedPacienteId(prontuario.paciente_id);
    setIsFormOpen(true);
  };

  const handleNewRecord = () => {
    setTempSelectedPacienteId("");
    setIsSelectionDialogOpen(true);
  };

  const handleStartNewRecord = () => {
    if (!tempSelectedPacienteId) {
      toast.error("Por favor, selecione um paciente.");
      return;
    }
    setSelectedProntuarioId(undefined);
    setSelectedPacienteId(tempSelectedPacienteId);
    setIsSelectionDialogOpen(false);
    setIsFormOpen(true);
  };

  const renderProntuarioList = (list: any[]) => {
    if (loading) {
      return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProntuarioCardSkeleton key={i} />
          ))}
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-xl border border-dashed border-muted/50">
          <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <FileText className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-1">
            Nenhum prontuário encontrado
          </h3>
          <p className="text-muted-foreground text-center max-w-xs">
            Tente ajustar sua busca ou filtro para encontrar o que procura.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((prontuario) => (
          <Card
            key={prontuario.id}
            className="group overflow-hidden bg-muted/30 rounded-xl border border-muted/50 transition-colors hover:bg-muted/50 h-full flex flex-col shadow-sm"
          >
            <CardContent className="p-6 flex-grow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {prontuario.pacientes?.nome}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(prontuario.status)}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center shrink-0 border border-muted/50">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <User className="h-4 w-4 mr-2 text-primary/60" />
                  <span className="font-medium line-clamp-1">
                    Dr(a). {prontuario.profiles?.nome}
                  </span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2 text-primary/60" />
                  <span>
                    {format(new Date(prontuario.data_atendimento), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                {prontuario.cid10_principal && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 border border-muted/50 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    <Filter className="h-3 w-3" />
                    CID: {prontuario.cid10_principal}
                  </div>
                )}
              </div>
            </CardContent>

            <div className="px-6 py-4 bg-muted/20 border-t border-muted/50 mt-auto">
              <Button
                variant="ghost"
                onClick={() => handleViewRecord(prontuario)}
                className="w-full justify-between text-primary font-bold group/btn hover:bg-primary/5 p-0 h-auto"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 px-2 rounded-md bg-primary/10 text-[10px] uppercase tracking-tighter">
                    Registro
                  </div>
                  <span className="text-xs uppercase tracking-widest group-hover/btn:translate-x-1 transition-transform">
                    Ver Detalhes
                  </span>
                </div>
                <Plus className="h-4 w-4 group-hover/btn:rotate-90 transition-all opacity-40 group-hover/btn:opacity-100" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        <Tabs defaultValue="todos" className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-muted/30 backdrop-blur-md p-3 rounded-xl border border-muted/50 shadow-sm mb-6 sticky top-0 z-40">
            <TabsList className="bg-transparent p-1 h-auto flex flex-wrap gap-1">
              <TabsTrigger value="todos" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all font-bold text-xs uppercase tracking-wider">Todos</TabsTrigger>
              <TabsTrigger value="rascunhos" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-amber-500 data-[state=active]:text-white transition-all font-bold text-xs uppercase tracking-wider">Rascunhos</TabsTrigger>
              <TabsTrigger value="finalizados" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-emerald-500 data-[state=active]:text-white transition-all font-bold text-xs uppercase tracking-wider">Finalizados</TabsTrigger>
            </TabsList>

            <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:max-w-2xl">
              <div className="relative group w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder={`Buscar por ${t.client_label.toLowerCase()} ou profissional...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-background/50 border-muted/50 shadow-inner focus:bg-background transition-all rounded-full h-10 text-sm"
                />
              </div>
              <Button
                onClick={handleNewRecord}
                className="h-10 px-6 whitespace-nowrap text-xs shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary hover:bg-primary/90 text-primary-foreground font-bold group rounded-full"
              >
                <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                Novo Prontuário
              </Button>
            </div>
          </div>

          <TabsContent value="todos" className="m-0 mt-2">
            {renderProntuarioList(filteredProntuarios)}
          </TabsContent>
          
          <TabsContent value="rascunhos" className="m-0 mt-2">
            {renderProntuarioList(filteredProntuarios.filter(p => p.status === 'rascunho'))}
          </TabsContent>
          
          <TabsContent value="finalizados" className="m-0 mt-2">
            {renderProntuarioList(filteredProntuarios.filter(p => p.status === 'finalizado' || p.status === 'concluido' || p.status === 'assinado'))}
          </TabsContent>
        </Tabs>

        <Dialog open={isSelectionDialogOpen} onOpenChange={setIsSelectionDialogOpen}>
          <DialogContent className="max-w-md bg-zinc-950/98 backdrop-blur-xl border-cyan-500/20 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[2.5rem] p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic tracking-tighter text-white uppercase text-center">
                Iniciar Registro Médico
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-8 py-6">
              <div className="space-y-4">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] text-center italic">
                  Selecione o {t.client_label.toLowerCase()} para abertura de protocolo
                </p>
                <div className="bg-zinc-900/50 p-2 rounded-2xl border border-white/5 shadow-inner">
                  <PatientCombobox
                    value={tempSelectedPacienteId}
                    onValueChange={setTempSelectedPacienteId}
                    patients={patients}
                  />
                </div>
              </div>
              <Button 
                onClick={handleStartNewRecord} 
                className="w-full h-14 font-black uppercase tracking-widest rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-zinc-950 shadow-[0_15px_30px_-10px_rgba(6,182,212,0.4)] transition-all active:scale-95 disabled:opacity-50"
                disabled={!tempSelectedPacienteId}
              >
                Abrir Prontuário Digital
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-7xl h-[92vh] bg-zinc-950 border-cyan-500/10 p-0 shadow-[0_0_100px_rgba(0,0,0,0.8)] rounded-[2rem] overflow-hidden">
            {selectedPacienteId && (
              <ProntuarioForm
                pacienteId={selectedPacienteId}
                existingProntuarioId={selectedProntuarioId}
                onSave={() => {
                  setIsFormOpen(false);
                  loadProntuarios();
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
