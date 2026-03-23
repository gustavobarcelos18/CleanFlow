import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Trash2, Clock, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export function ListaEsperaPanel() {
  const [listaEspera, setListaEspera] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadData = useCallback(async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.tenant_id) return;

      const [listaRes, pacientesRes, servicosRes] = await Promise.all([
        supabase
          .from("lista_espera" as any)
          .select(
            "*, pacientes(nome, telefone), procedimentos:servico_id(nome)",
          )
          .eq("tenant_id", profile.tenant_id)
          .eq("status", "ativo")
          .order("score_total", { ascending: false }),
        supabase
          .from("pacientes")
          .select("id, nome, telefone")
          .eq("tenant_id", profile.tenant_id),
        supabase
          .from("procedimentos")
          .select("id, nome")
          .eq("tenant_id", profile.tenant_id)
          .order("nome"),
      ]);

      if (listaRes.data) setListaEspera(listaRes.data);
      if (pacientesRes.data) setPacientes(pacientesRes.data);
      if (servicosRes.data) setServicos(servicosRes.data);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { error } = await supabase.from("lista_espera" as any).insert({
        tenant_id: profile?.tenant_id,
        paciente_id: formData.get("paciente_id"),
        servico_id: formData.get("servico_id") || null,
        prioridade_clinica: formData.get("prioridade_clinica"),
        proximidade_score: parseInt(
          formData.get("proximidade_score") as string,
        ),
        probabilidade_comparecimento: parseInt(
          formData.get("probabilidade_comparecimento") as string,
        ),
        notas: formData.get("notas"),
        consentimento_ofertas: formData.get("consentimento_ofertas") === "on",
        data_consentimento:
          formData.get("consentimento_ofertas") === "on"
            ? new Date().toISOString()
            : null,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Paciente adicionado à lista de espera",
      });

      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("lista_espera" as any)
        .update({ status: "removido" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Paciente removido da lista",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const colors: Record<string, string> = {
      urgente: "destructive",
      alta: "default",
      media: "secondary",
      baixa: "outline",
    };
    return (
      <Badge variant={colors[prioridade] as any}>
        {prioridade.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Slim Toolbar for Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/30 p-4 md:p-5 rounded-xl border border-border/50 backdrop-blur-md">
         <div className="flex-1 min-w-0 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">Fila de Prioridade</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">Ordenada por score de IA</p>
            </div>
         </div>

         <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
           <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
             <DialogTrigger asChild>
               <Button className="w-full md:w-auto shadow-lg shadow-primary/20 transition-colors bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-6 rounded-xl group uppercase tracking-wider text-xs">
                 <Plus className="h-4 w-4 mr-2" />
                 Adicionar Paciente
               </Button>
             </DialogTrigger>
             <DialogContent className="max-w-2xl bg-card border-border/50">
               <DialogHeader>
                 <DialogTitle className="text-2xl font-black tracking-tight">Adicionar à Lista de Espera</DialogTitle>
               </DialogHeader>
               <form onSubmit={handleAdd} className="space-y-4 pt-4">
                <div>
                  <Label>Paciente *</Label>
                  <Select name="paciente_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {pacientes.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Serviço</Label>
                  <Select name="servico_id">
                    <SelectTrigger>
                      <SelectValue placeholder="Qualquer serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicos.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Prioridade Clínica *</Label>
                  <Select name="prioridade_clinica" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Score Proximidade (0-100)</Label>
                    <Input
                      type="number"
                      name="proximidade_score"
                      defaultValue="50"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <Label>Probabilidade Comparecimento (0-100)</Label>
                    <Input
                      type="number"
                      name="probabilidade_comparecimento"
                      defaultValue="70"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <Label>Notas</Label>
                  <Textarea
                    name="notas"
                    placeholder="Observações clínicas..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch name="consentimento_ofertas" id="consentimento" />
                  <Label htmlFor="consentimento">
                    Paciente consentiu receber ofertas de vagas via WhatsApp
                  (LGPD)
                </Label>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-border/20">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-lg h-10 px-6 font-semibold"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="rounded-lg h-10 px-8 font-bold bg-primary hover:bg-primary/90">
                  Adicionar à Fila
                </Button>
              </div>

               </form>
             </DialogContent>
           </Dialog>
         </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-card/20 rounded-xl border border-border/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Paciente</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Score Total</TableHead>
              <TableHead>Consentimento</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listaEspera.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  {item.pacientes?.nome}
                </TableCell>
                <TableCell>{item.pacientes?.telefone}</TableCell>
                <TableCell>{item.servicos?.nome || "Qualquer"}</TableCell>
                <TableCell>
                  {getPrioridadeBadge(item.prioridade_clinica)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-semibold">{item.score_total}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {item.consentimento_ofertas ? (
                    <Badge variant="outline" className="bg-green-50">
                      ✓ Sim
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50">
                      ✗ Não
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(item.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {listaEspera.length === 0 && (
          <div className="text-center py-16 text-muted-foreground bg-muted/5">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Nenhum paciente na lista de espera</p>
            <p className="text-xs opacity-60">Novos pacientes aparecerão aqui conforme forem adicionados</p>
          </div>
        )}
      </div>
    </div>
  );
}
