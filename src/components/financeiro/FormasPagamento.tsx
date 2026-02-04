import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface FormaPagamento {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
  ordem: number;
}

export default function FormasPagamento() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    tipo: "dinheiro",
    ativo: true,
    ordem: 0
  });

  const queryClient = useQueryClient();

  const { data: formas, isLoading } = useQuery({
    queryKey: ["formas-pagamento"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      const { data, error } = await supabase
        .from("formas_pagamento")
        .select("*")
        .eq("tenant_id", profile?.tenant_id)
        .order("ordem");

      if (error) throw error;
      return data as FormaPagamento[];
    }
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
        const { error } = await supabase
          .from("formas_pagamento")
          .update(data)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("formas_pagamento")
          .insert({ ...data, tenant_id: profile?.tenant_id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formas-pagamento"] });
      setOpen(false);
      setEditingId(null);
      setFormData({ nome: "", tipo: "dinheiro", ativo: true, ordem: 0 });
      toast.success(editingId ? "Forma de pagamento atualizada!" : "Forma de pagamento criada!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar forma de pagamento");
      console.error(error);
    }
  });

  const handleEdit = (forma: FormaPagamento) => {
    setEditingId(forma.id);
    setFormData({
      nome: forma.nome,
      tipo: forma.tipo,
      ativo: forma.ativo,
      ordem: forma.ordem
    });
    setOpen(true);
  };

  const tipoLabels: Record<string, string> = {
    dinheiro: "Dinheiro",
    pix: "PIX",
    cartao_debito: "Cartão Débito",
    cartao_credito: "Cartão Crédito",
    plano_saude: "Plano de Saúde",
    outro: "Outro"
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Formas de Pagamento</CardTitle>
          <CardDescription>Gerencie as formas de pagamento aceitas</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({ nome: "", tipo: "dinheiro", ativo: true, ordem: 0 });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Forma
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Dinheiro, PIX..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ordem">Ordem</Label>
                <Input
                  id="ordem"
                  type="number"
                  value={formData.ordem}
                  onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Ativo</Label>
              </div>
              <Button onClick={() => saveMutation.mutate(formData)} className="w-full">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Carregando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formas?.map((forma) => (
                <TableRow key={forma.id}>
                  <TableCell className="font-medium">{forma.nome}</TableCell>
                  <TableCell>{tipoLabels[forma.tipo]}</TableCell>
                  <TableCell>
                    <Badge variant={forma.ativo ? "default" : "secondary"}>
                      {forma.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>{forma.ordem}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(forma)}>
                      Editar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
