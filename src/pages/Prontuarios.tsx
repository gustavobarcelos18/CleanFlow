import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Search, Plus, Filter, User, Clock } from "lucide-react";
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
import ProntuarioForm from "@/components/prontuario/ProntuarioForm";

export default function Prontuarios() {
  const t = useTerminology();
  const titleScope = useLayoutTitle();
  const [prontuarios, setProntuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProntuarioId, setSelectedProntuarioId] = useState<
    string | undefined
  >(undefined);
  const [selectedPacienteId, setSelectedPacienteId] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    titleScope.setTitle(`Prontuários Eletrônicos`);
  }, [titleScope]);

  useEffect(() => {
    loadProntuarios();
  }, []);

  const loadProntuarios = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id, role")
        .eq("id", user.id)
        .single();

      if (!profile) return;

      let query = supabase
        .from("prontuarios" as any)
        .select(
          `
          *,
          pacientes(nome, telefone),
          profiles(nome)
        `,
        )
        .eq("tenant_id", profile.tenant_id)
        .order("data_atendimento", { ascending: false });

      // Profissionais veem apenas seus próprios prontuários
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
  };

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
          <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20 transition-colors">
            Finalizado
          </Badge>
        );
      case "rascunho":
        return (
          <Badge
            variant="outline"
            className="bg-muted/50 text-muted-foreground border-border/50"
          >
            Rascunho
          </Badge>
        );
      case "assinado":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
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
    // Para simplificar, poderíamos abrir um seletor de pacientes aqui
    // Por enquanto, vamos apenas emitir um aviso ou abrir vazio se o form suportar
    toast.info(
      "Para criar um novo prontuário, inicie um atendimento na agenda ou selecione um paciente.",
    );
  };

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder={`Buscar por ${t.client_label.toLowerCase()} ou profissional...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card border-none shadow-sm h-11 focus-visible:ring-primary/20 transition-all"
          />
        </div>

        <Button
          onClick={handleNewRecord}
          className="h-11 px-6 shadow-md hover:shadow-lg transition-all active:scale-95 group"
        >
          <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
          Novo Prontuário
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProntuarioCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProntuarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-xl border border-dashed border-border/50">
          <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <FileText className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-1">
            Nenhum prontuário encontrado
          </h3>
          <p className="text-muted-foreground text-center max-w-xs">
            Tente ajustar sua busca para encontrar o que procura.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProntuarios.map((prontuario) => (
            <Card
              key={prontuario.id}
              className="group overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300 bg-card flex flex-col"
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
                  <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center shrink-0 border border-border/50">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                <div className="space-y-2.5 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4 shrink-0" />
                    <span className="line-clamp-1">
                      Dr(a). {prontuario.profiles?.nome}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" />
                    <span>
                      {new Date(prontuario.data_atendimento).toLocaleDateString(
                        "pt-BR",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        },
                      )}{" "}
                      às{" "}
                      {new Date(prontuario.data_atendimento).toLocaleTimeString(
                        "pt-BR",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </span>
                  </div>
                  {prontuario.cid10_principal && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-muted/50 border border-border/50 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      <Filter className="h-3 w-3" />
                      CID: {prontuario.cid10_principal}
                    </div>
                  )}
                </div>

                {prontuario.avaliacao && (
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/30 mb-4">
                    <p className="text-xs text-muted-foreground font-medium mb-1 uppercase tracking-tight">
                      Avaliação
                    </p>
                    <p className="text-sm text-foreground line-clamp-2 leading-relaxed italic">
                      "{prontuario.avaliacao}"
                    </p>
                  </div>
                )}
              </CardContent>

              <div className="p-4 bg-muted/20 border-t border-border/50 mt-auto">
                <Button
                  variant="ghost"
                  onClick={() => handleViewRecord(prontuario)}
                  className="w-full justify-between hover:bg-primary/10 hover:text-primary transition-colors text-xs font-semibold uppercase tracking-widest p-0 px-4 h-10 group/btn"
                >
                  Ver Registro Completo
                  <Plus className="h-4 w-4 group-hover/btn:rotate-90 transition-transform" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold italic tracking-tight">
              {selectedProntuarioId
                ? "Visualizar Prontuário"
                : "Novo Prontuário"}
            </DialogTitle>
          </DialogHeader>
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
    </MainLayout>
  );
}
