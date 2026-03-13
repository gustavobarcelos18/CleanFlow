import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, QrCode, Pencil, Star, Wifi, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ContaPix {
  id: string;
  nome: string;
  chave_pix: string;
  tipo_chave: string;
  banco: string | null;
  titular: string | null;
  ativo: boolean;
  padrao: boolean;
}

const tipoChaveLabels: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "E-mail",
  telefone: "Telefone",
  aleatoria: "Chave Aleatória",
};

const defaultFormData = {
  nome: "",
  chave_pix: "",
  tipo_chave: "cpf",
  banco: "",
  titular: "",
  ativo: true,
  padrao: false,
};

function PixCardSkeleton() {
  return (
    <div className="rounded-xl border border-muted/50 p-5 space-y-3 bg-muted/30">
      <div className="flex justify-between items-start">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-6 w-48" />
      <div className="flex gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export default function ContasPix() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const queryClient = useQueryClient();

  const { data: contas, isLoading } = useQuery({
    queryKey: ["contas-pix"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      const { data, error } = await supabase
        .from("contas_pix")
        .select("*")
        .eq("tenant_id", profile?.tenant_id)
        .order("padrao", { ascending: false });

      if (error) throw error;
      return data as ContaPix[];
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

      if (editingId) {
        const { error } = await supabase.from("contas_pix").update(data).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("contas_pix")
          .insert({ ...data, tenant_id: profile?.tenant_id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas-pix"] });
      queryClient.invalidateQueries({ queryKey: ["financeiro-stats"] });
      setOpen(false);
      setEditingId(null);
      setFormData(defaultFormData);
      toast.success(editingId ? "Conta PIX atualizada!" : "Conta PIX criada!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar conta PIX");
      console.error(error);
    },
  });

  const handleEdit = (conta: ContaPix) => {
    setEditingId(conta.id);
    setFormData({
      nome: conta.nome,
      chave_pix: conta.chave_pix,
      tipo_chave: conta.tipo_chave,
      banco: conta.banco ?? "",
      titular: conta.titular ?? "",
      ativo: conta.ativo,
      padrao: conta.padrao,
    });
    setOpen(true);
  };

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData(defaultFormData);
  };

  return (
    <Card className="bg-muted/30 border-muted/50 rounded-xl shadow-sm transition-colors hover:bg-muted/50">
      <CardHeader className="pb-4 border-b border-muted/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <QrCode className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Contas PIX</CardTitle>
              <CardDescription className="text-sm mt-0.5">Chaves de recebimento via PIX</CardDescription>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                className="shadow-lg shadow-violet-500/20 transition-all hover:scale-105 active:scale-95 bg-violet-600 hover:bg-violet-700 text-white font-bold h-10 px-4 rounded-xl gap-2"
                onClick={handleOpenNew}
              >
                <Plus className="h-4 w-4" />
                Nova Conta PIX
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-xl border-muted/60 bg-background/95 backdrop-blur-md shadow-2xl">
              <DialogHeader className="pb-4 border-b border-muted/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <QrCode className="h-4 w-4 text-violet-500" />
                  </div>
                  <DialogTitle className="text-lg font-bold">
                    {editingId ? "Editar Conta PIX" : "Nova Conta PIX"}
                  </DialogTitle>
                </div>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="nome" className="text-sm font-semibold">Nome da Conta</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Conta Principal"
                    className="rounded-xl bg-background/50 h-10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Tipo de Chave</Label>
                    <Select
                      value={formData.tipo_chave}
                      onValueChange={(value) => setFormData({ ...formData, tipo_chave: value })}
                    >
                      <SelectTrigger className="rounded-xl bg-background/50 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(tipoChaveLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="banco" className="text-sm font-semibold">Banco</Label>
                    <Input
                      id="banco"
                      value={formData.banco}
                      onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                      placeholder="Ex: Nubank"
                      className="rounded-xl bg-background/50 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chave_pix" className="text-sm font-semibold">Chave PIX</Label>
                  <Input
                    id="chave_pix"
                    value={formData.chave_pix}
                    onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                    placeholder="Digite a chave PIX"
                    className="rounded-xl bg-background/50 h-10 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titular" className="text-sm font-semibold">Titular</Label>
                  <Input
                    id="titular"
                    value={formData.titular}
                    onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
                    placeholder="Nome do titular"
                    className="rounded-xl bg-background/50 h-10"
                  />
                </div>

                <div className="flex gap-4 pt-1">
                  <div className="flex items-center gap-2 flex-1 p-3 rounded-xl border border-muted/50 bg-muted/20">
                    <Switch
                      id="padrao"
                      checked={formData.padrao}
                      onCheckedChange={(checked) => setFormData({ ...formData, padrao: checked })}
                    />
                    <Label htmlFor="padrao" className="text-sm cursor-pointer">Conta Padrão</Label>
                  </div>
                  <div className="flex items-center gap-2 flex-1 p-3 rounded-xl border border-muted/50 bg-muted/20">
                    <Switch
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                    />
                    <Label htmlFor="ativo" className="text-sm cursor-pointer">Ativa</Label>
                  </div>
                </div>

                <Button
                  onClick={() => saveMutation.mutate(formData)}
                  disabled={saveMutation.isPending}
                  className="w-full h-11 rounded-xl font-bold"
                >
                  {saveMutation.isPending ? "Salvando..." : "Salvar Conta"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <PixCardSkeleton key={i} />)}
          </div>
        ) : contas?.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="p-4 rounded-xl bg-muted/50 border border-muted/50">
              <QrCode className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">Nenhuma conta PIX cadastrada</p>
              <p className="text-xs text-muted-foreground mt-1">
                Crie sua primeira chave PIX para começar a receber.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-1 gap-2 rounded-xl"
              onClick={() => { handleOpenNew(); setOpen(true); }}
            >
              <Plus className="h-4 w-4" />
              Criar primeira conta
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contas?.map((conta) => (
              <div
                key={conta.id}
                className={cn(
                  "group relative rounded-xl border p-5 bg-muted/30 hover:shadow-md hover:bg-muted/50 transition-all",
                  conta.padrao
                    ? "border-violet-500/40 bg-violet-500/5 hover:bg-violet-500/10"
                    : "border-muted/50"
                )}
              >
                {conta.padrao && (
                  <div className="absolute top-3 right-3">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold border-violet-400/50 bg-violet-400/10 text-violet-600 dark:text-violet-400 gap-1 rounded-full"
                    >
                      <Star className="h-2.5 w-2.5" />
                      Padrão
                    </Badge>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3 pr-16">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    conta.padrao ? "bg-violet-500/15" : "bg-muted/60"
                  )}>
                    <QrCode className={cn("h-4 w-4", conta.padrao ? "text-violet-500" : "text-muted-foreground")} />
                  </div>
                  <p className="font-semibold text-sm text-foreground truncate">{conta.nome}</p>
                </div>

                <div className="mb-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                    {tipoChaveLabels[conta.tipo_chave]}
                  </p>
                  <p className="text-sm font-mono text-foreground break-all">{conta.chave_pix}</p>
                </div>

                {conta.banco && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Wifi className="h-3 w-3 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">{conta.banco}</p>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-muted/40">
                  <div className="flex items-center gap-1.5">
                    {conta.ativo ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-muted-foreground/40" />
                    )}
                    <span className={cn("text-xs font-medium", conta.ativo ? "text-emerald-500" : "text-muted-foreground/50")}>
                      {conta.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleEdit(conta)}
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
