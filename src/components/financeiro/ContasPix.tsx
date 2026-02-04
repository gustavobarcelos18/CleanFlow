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

export default function ContasPix() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    chave_pix: "",
    tipo_chave: "cpf",
    banco: "",
    titular: "",
    ativo: true,
    padrao: false
  });

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
          .from("contas_pix")
          .update(data)
          .eq("id", editingId);
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
      setOpen(false);
      setEditingId(null);
      setFormData({ nome: "", chave_pix: "", tipo_chave: "cpf", banco: "", titular: "", ativo: true, padrao: false });
      toast.success(editingId ? "Conta PIX atualizada!" : "Conta PIX criada!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar conta PIX");
      console.error(error);
    }
  });

  const handleEdit = (conta: ContaPix) => {
    setEditingId(conta.id);
    setFormData({
      nome: conta.nome,
      chave_pix: conta.chave_pix,
      tipo_chave: conta.tipo_chave,
      banco: conta.banco || "",
      titular: conta.titular || "",
      ativo: conta.ativo,
      padrao: conta.padrao
    });
    setOpen(true);
  };

  const tipoChaveLabels: Record<string, string> = {
    cpf: "CPF",
    cnpj: "CNPJ",
    email: "E-mail",
    telefone: "Telefone",
    aleatoria: "Chave Aleatória"
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Contas PIX</CardTitle>
          <CardDescription>Gerencie as contas PIX para recebimento</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({ nome: "", chave_pix: "", tipo_chave: "cpf", banco: "", titular: "", ativo: true, padrao: false });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Conta PIX" : "Nova Conta PIX"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Conta</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Conta Principal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tipo_chave">Tipo de Chave</Label>
                <Select value={formData.tipo_chave} onValueChange={(value) => setFormData({ ...formData, tipo_chave: value })}>
                  <SelectTrigger>
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
                <Label htmlFor="chave_pix">Chave PIX</Label>
                <Input
                  id="chave_pix"
                  value={formData.chave_pix}
                  onChange={(e) => setFormData({ ...formData, chave_pix: e.target.value })}
                  placeholder="Digite a chave PIX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banco">Banco</Label>
                <Input
                  id="banco"
                  value={formData.banco}
                  onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                  placeholder="Ex: Banco do Brasil"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="titular">Titular</Label>
                <Input
                  id="titular"
                  value={formData.titular}
                  onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
                  placeholder="Nome do titular"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="padrao"
                  checked={formData.padrao}
                  onCheckedChange={(checked) => setFormData({ ...formData, padrao: checked })}
                />
                <Label htmlFor="padrao">Conta Padrão</Label>
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
                <TableHead>Tipo de Chave</TableHead>
                <TableHead>Chave PIX</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contas?.map((conta) => (
                <TableRow key={conta.id}>
                  <TableCell className="font-medium">
                    {conta.nome}
                    {conta.padrao && <Badge className="ml-2" variant="outline">Padrão</Badge>}
                  </TableCell>
                  <TableCell>{tipoChaveLabels[conta.tipo_chave]}</TableCell>
                  <TableCell>{conta.chave_pix}</TableCell>
                  <TableCell>{conta.banco}</TableCell>
                  <TableCell>
                    <Badge variant={conta.ativo ? "default" : "secondary"}>
                      {conta.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(conta)}>
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
