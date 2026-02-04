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
  exames_procedimentos?: { nome: string };
}

export default function PlanoSaudeValores() {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    plano_saude_id: "",
    tipo_item: "servico",
    servico_id: "",
    exame_procedimento_id: "",
    valor: "",
    dias_recebimento: "30",
    vigencia_inicio: new Date().toISOString().split('T')[0],
    vigencia_fim: "",
    ativo: true
  });

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
        .single();

      const { data, error } = await supabase
        .from("plano_saude_valores")
        .select(`
          *,
          planos_saude:plano_saude_id(nome),
          servicos:servico_id(nome),
          exames_procedimentos:exame_procedimento_id(nome)
        `)
        .eq("tenant_id", profile?.tenant_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PlanoSaudeValor[];
    }
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
    }
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
        .single();

      const { data, error } = await supabase
        .from("servicos")
        .select("id, nome")
        .eq("tenant_id", profile?.tenant_id)
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data;
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

      const payload = {
        plano_saude_id: data.plano_saude_id,
        servico_id: data.tipo_item === "servico" ? data.servico_id : null,
        exame_procedimento_id: data.tipo_item === "exame" ? data.exame_procedimento_id : null,
        valor: parseFloat(data.valor),
        dias_recebimento: parseInt(data.dias_recebimento),
        vigencia_inicio: data.vigencia_inicio,
        vigencia_fim: data.vigencia_fim || null,
        ativo: data.ativo,
        tenant_id: profile?.tenant_id
      };

      if (editingId) {
        const { error } = await supabase
          .from("plano_saude_valores")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("plano_saude_valores")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plano-saude-valores"] });
      setOpen(false);
      setEditingId(null);
      setFormData({
        plano_saude_id: "",
        tipo_item: "servico",
        servico_id: "",
        exame_procedimento_id: "",
        valor: "",
        dias_recebimento: "30",
        vigencia_inicio: new Date().toISOString().split('T')[0],
        vigencia_fim: "",
        ativo: true
      });
      toast.success(editingId ? "Valor atualizado!" : "Valor cadastrado!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar valor");
      console.error(error);
    }
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Valores de Planos de Saúde</CardTitle>
          <CardDescription>Cadastre os valores pagos pelos planos para serviços e procedimentos</CardDescription>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingId(null);
              setFormData({
                plano_saude_id: "",
                tipo_item: "servico",
                servico_id: "",
                exame_procedimento_id: "",
                valor: "",
                dias_recebimento: "30",
                vigencia_inicio: new Date().toISOString().split('T')[0],
                vigencia_fim: "",
                ativo: true
              });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Valor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Valor" : "Cadastrar Novo Valor"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="plano">Plano de Saúde</Label>
                <Select value={formData.plano_saude_id} onValueChange={(value) => setFormData({ ...formData, plano_saude_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {planos?.map((plano) => (
                      <SelectItem key={plano.id} value={plano.id}>{plano.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={formData.tipo_item} onValueChange={(value) => setFormData({ ...formData, tipo_item: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="servico">Serviço/Consulta</SelectItem>
                    <SelectItem value="exame">Exame/Procedimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo_item === "servico" && (
                <div className="space-y-2">
                  <Label htmlFor="servico">Serviço</Label>
                  <Select value={formData.servico_id} onValueChange={(value) => setFormData({ ...formData, servico_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicos?.map((servico) => (
                        <SelectItem key={servico.id} value={servico.id}>{servico.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dias">Dias para Recebimento</Label>
                  <Input
                    id="dias"
                    type="number"
                    value={formData.dias_recebimento}
                    onChange={(e) => setFormData({ ...formData, dias_recebimento: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inicio">Vigência Início</Label>
                  <Input
                    id="inicio"
                    type="date"
                    value={formData.vigencia_inicio}
                    onChange={(e) => setFormData({ ...formData, vigencia_inicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fim">Vigência Fim</Label>
                  <Input
                    id="fim"
                    type="date"
                    value={formData.vigencia_fim}
                    onChange={(e) => setFormData({ ...formData, vigencia_fim: e.target.value })}
                  />
                </div>
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
                <TableHead>Plano</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Dias Receb.</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {valores?.map((valor) => (
                <TableRow key={valor.id}>
                  <TableCell className="font-medium">{valor.planos_saude?.nome}</TableCell>
                  <TableCell>{valor.servicos?.nome || valor.exames_procedimentos?.nome}</TableCell>
                  <TableCell>R$ {valor.valor.toFixed(2)}</TableCell>
                  <TableCell>{valor.dias_recebimento} dias</TableCell>
                  <TableCell>
                    {new Date(valor.vigencia_inicio).toLocaleDateString()}
                    {valor.vigencia_fim && ` - ${new Date(valor.vigencia_fim).toLocaleDateString()}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant={valor.ativo ? "default" : "secondary"}>
                      {valor.ativo ? "Ativo" : "Inativo"}
                    </Badge>
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
