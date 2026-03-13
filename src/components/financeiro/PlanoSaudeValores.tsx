import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, DollarSign, FileX, Pencil, Trash2 } from "lucide-react";
import { formatCurrencyBRL, parseCurrencyToNumber } from "@/lib/currency";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PlanoSaudeValor {
  id: string;
  plano_saude_id: string;
  servico_id: string | null;
  exame_procedimento_id: string | null;
  valor: number;
  dias_recebimento: number;
  vigencia_inicio: string;
  vigencia_fim: string | null;
  ativo: boolean;
  planos_saude?: { nome: string };
  servicos?: { nome: string };
  exames?: { nome: string };
}

const defaultFormData = {
  plano_saude_id: "",
  tipo_item: "servico",
  servico_id: "",
  exame_procedimento_id: "",
  valor: "",
  dias_recebimento: "30",
  vigencia_inicio: new Date().toISOString().split("T")[0],
  vigencia_fim: "",
  ativo: true,
};

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 6 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function PlanoSaudeValores() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const queryClient = useQueryClient();

  const { data: valores, isLoading } = useQuery({
    queryKey: ["plano-saude-valores"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from("plano_saude_valores")
        .select(`
          *,
          planos_saude:plano_saude_id(nome),
          servicos:servico_id(nome),
          exames:exame_procedimento_id(nome)
        `)
        .eq("tenant_id", profile?.tenant_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as any[] as PlanoSaudeValor[];
    },
  });

  const { data: planos } = useQuery({
    queryKey: ["planos-saude"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      const { data, error } = await supabase
        .from("planos_saude")
        .select("id, nome")
        .eq("tenant_id", profile?.tenant_id)
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data;
    },
  });

  const { data: servicos } = useQuery({
    queryKey: ["servicos"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from("servicos")
        .select("id, nome")
        .eq("tenant_id", profile?.tenant_id)
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data;
    },
  });

  const { data: exames } = useQuery({
    queryKey: ["exames"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from("exames")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      const payload = {
        plano_saude_id: data.plano_saude_id,
        servico_id: data.tipo_item === "servico" ? data.servico_id : null,
        exame_procedimento_id: data.tipo_item === "exame" ? data.exame_procedimento_id : null,
        valor: parseCurrencyToNumber(data.valor),
        dias_recebimento: parseInt(data.dias_recebimento),
        vigencia_inicio: data.vigencia_inicio,
        vigencia_fim: data.vigencia_fim || null,
        ativo: data.ativo,
        tenant_id: profile?.tenant_id,
      };

      if (editingId) {
        const { error } = await supabase.from("plano_saude_valores").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("plano_saude_valores").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plano-saude-valores"] });
      queryClient.invalidateQueries({ queryKey: ["planos-saude"] }); // Garantir que novos planos apareçam
      setOpen(false);
      setEditingId(null);
      setFormData(defaultFormData);
      toast.success(editingId ? "Valor atualizado!" : "Valor cadastrado!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar valor");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plano_saude_valores").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plano-saude-valores"] });
      toast.success("Valor excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir valor");
      console.error(error);
    },
  });

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData(defaultFormData);
  };

  const formatBRL = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <Card className="bg-muted/30 border-muted/50 rounded-xl shadow-sm transition-colors hover:bg-muted/50">
      <CardHeader className="pb-4 border-b border-muted/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/20">
              <DollarSign className="h-4 w-4 text-sky-500" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Valores de Planos de Saúde</CardTitle>
              <CardDescription className="text-sm mt-0.5">
                Tabela de valores pagos por planos para serviços e procedimentos
              </CardDescription>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-sky-500/20 transition-all hover:scale-105 active:scale-95 bg-sky-500 hover:bg-sky-600 text-white font-bold h-10 px-4 rounded-xl gap-2" onClick={handleOpenNew}>
                <Plus className="h-4 w-4" />
                Novo Valor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg rounded-xl border-muted/60 bg-background/95 backdrop-blur-md shadow-2xl">
              <DialogHeader className="pb-4 border-b border-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-500/10">
                    <DollarSign className="h-4 w-4 text-sky-500" />
                  </div>
                  <DialogTitle className="text-lg font-bold">
                    {editingId ? "Editar Valor" : "Cadastrar Novo Valor"}
                  </DialogTitle>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                {/* Plano */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Plano de Saúde</Label>
                  <Select
                    value={formData.plano_saude_id}
                    onValueChange={(value) => setFormData({ ...formData, plano_saude_id: value })}
                  >
                    <SelectTrigger className="rounded-xl bg-background/50 h-10">
                      <SelectValue placeholder="Selecione o plano" />
                    </SelectTrigger>
                    <SelectContent>
                      {planos?.map((plano) => (
                        <SelectItem key={plano.id} value={plano.id}>{plano.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Tipo + Item */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Tipo</Label>
                    <Select
                      value={formData.tipo_item}
                      onValueChange={(value) => setFormData({ ...formData, tipo_item: value })}
                    >
                      <SelectTrigger className="rounded-xl bg-background/50 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="servico">Serviço / Consulta</SelectItem>
                        <SelectItem value="exame">Exame / Procedimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.tipo_item === "servico" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Serviço / Procedimento</Label>
                      <Select
                        value={formData.servico_id}
                        onValueChange={(value) => setFormData({ ...formData, servico_id: value })}
                      >
                        <SelectTrigger className="rounded-xl bg-background/50 h-10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {servicos?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {formData.tipo_item === "exame" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Exame Clínico</Label>
                      <Select
                        value={formData.exame_procedimento_id}
                        onValueChange={(value) => setFormData({ ...formData, exame_procedimento_id: value })}
                      >
                        <SelectTrigger className="rounded-xl bg-background/50 h-10">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {exames?.map((e) => (
                            <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Valor + Dias */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="valor" className="text-sm font-semibold">Valor (R$)</Label>
                    <Input
                      id="valor"
                      type="text"
                      inputMode="numeric"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: formatCurrencyBRL(e.target.value) })}
                      placeholder="R$ 0,00"
                      className="rounded-xl bg-background/50 h-10 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dias" className="text-sm font-semibold">Prazo Recebimento</Label>
                    <div className="relative">
                      <Input
                        id="dias"
                        type="number"
                        value={formData.dias_recebimento}
                        onChange={(e) => setFormData({ ...formData, dias_recebimento: e.target.value })}
                        className="rounded-xl bg-background/50 h-10 pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground select-none">dias</span>
                    </div>
                  </div>
                </div>

                {/* Vigências */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="inicio" className="text-sm font-semibold">Vigência Início</Label>
                    <Input
                      id="inicio"
                      type="date"
                      value={formData.vigencia_inicio}
                      onChange={(e) => setFormData({ ...formData, vigencia_inicio: e.target.value })}
                      className="rounded-xl bg-background/50 h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fim" className="text-sm font-semibold">Vigência Fim</Label>
                    <Input
                      id="fim"
                      type="date"
                      value={formData.vigencia_fim}
                      onChange={(e) => setFormData({ ...formData, vigencia_fim: e.target.value })}
                      className="rounded-xl bg-background/50 h-10"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl border border-muted/50 bg-muted/20">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  />
                  <Label htmlFor="ativo" className="text-sm cursor-pointer">Ativo</Label>
                </div>

                <Button
                  onClick={() => saveMutation.mutate(formData)}
                  disabled={saveMutation.isPending}
                  className="w-full h-11 rounded-xl font-bold"
                >
                  {saveMutation.isPending ? "Salvando..." : "Salvar Valor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="pl-6 font-semibold text-xs uppercase tracking-wider">Plano</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Item</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Valor</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Prazo</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Vigência</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonRows />
              ) : valores?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <div className="p-4 rounded-xl bg-muted/50 border border-muted/50">
                        <FileX className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Nenhum valor de plano cadastrado</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Cadastre valores para começar a controlar o recebimento por plano.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                valores?.map((valor) => (
                  <TableRow key={valor.id} className="hover:bg-muted/20 transition-colors group">
                    <TableCell className="pl-6 font-semibold text-sm">{valor.planos_saude?.nome}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {valor.servicos?.nome ?? valor.exames?.nome ?? "—"}
                    </TableCell>
                    <TableCell className="font-bold text-sky-600 dark:text-sky-400 text-sm">
                      {formatBRL(valor.valor)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {valor.dias_recebimento} dias
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(valor.vigencia_inicio)}
                      {valor.vigencia_fim && (
                        <span className="text-muted-foreground/60"> → {formatDate(valor.vigencia_fim)}</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={
                            valor.ativo
                              ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold rounded-full"
                              : "border-muted/50 bg-muted/50 text-muted-foreground text-[11px] font-semibold rounded-full"
                          }
                        >
                          {valor.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg"
                            onClick={() => {
                              setEditingId(valor.id);
                              setFormData({
                                plano_saude_id: valor.plano_saude_id,
                                tipo_item: valor.servico_id ? "servico" : "exame",
                                servico_id: valor.servico_id ?? "",
                                exame_procedimento_id: valor.exame_procedimento_id ?? "",
                                valor: formatCurrencyBRL(valor.valor),
                                dias_recebimento: valor.dias_recebimento.toString(),
                                vigencia_inicio: valor.vigencia_inicio.split("T")[0],
                                vigencia_fim: valor.vigencia_fim ? valor.vigencia_fim.split("T")[0] : "",
                                ativo: valor.ativo,
                              });
                              setOpen(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja excluir este valor?")) {
                                deleteMutation.mutate(valor.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
