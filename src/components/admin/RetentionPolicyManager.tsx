import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Clock, Play, Plus, Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface RetentionPolicy {
  id: string;
  policy_name: string;
  target_table: string;
  retention_months: number;
  description: string;
  active: boolean;
  last_applied_at: string | null;
}

export function RetentionPolicyManager() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<RetentionPolicy | null>(null);
  const [formData, setFormData] = useState({
    policy_name: "",
    target_table: "",
    retention_months: 24,
    description: "",
    active: true,
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('retention_policies_detailed' as any)
        .select('*')
        .order('policy_name');

      if (error) throw error;
      setPolicies((data as any) || []);
    } catch (error) {
      console.error('Erro ao carregar políticas:', error);
      toast.error('Erro ao carregar políticas de retenção');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingPolicy) {
        const { error } = await supabase
          .from('retention_policies_detailed' as any)
          .update(formData)
          .eq('id', editingPolicy.id);

        if (error) throw error;
        toast.success('Política atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('retention_policies_detailed' as any)
          .insert(formData);

        if (error) throw error;
        toast.success('Política criada com sucesso');
      }

      setDialogOpen(false);
      setEditingPolicy(null);
      setFormData({
        policy_name: "",
        target_table: "",
        retention_months: 24,
        description: "",
        active: true,
      });
      loadPolicies();
    } catch (error: any) {
      console.error('Erro ao salvar política:', error);
      toast.error(error.message || 'Erro ao salvar política');
    }
  };

  const handleApplyPolicies = async () => {
    try {
      toast.info('Aplicando políticas de retenção...');
      
      const { data, error } = await supabase.functions.invoke('apply-retention-policies');

      if (error) throw error;

      toast.success('Políticas de retenção aplicadas com sucesso');
      console.log('Resultado:', data);
      loadPolicies();
    } catch (error: any) {
      console.error('Erro ao aplicar políticas:', error);
      toast.error('Erro ao aplicar políticas de retenção');
    }
  };

  const handleToggleActive = async (policy: RetentionPolicy) => {
    try {
      const { error } = await supabase
        .from('retention_policies_detailed' as any)
        .update({ active: !policy.active })
        .eq('id', policy.id);

      if (error) throw error;
      toast.success('Status atualizado');
      loadPolicies();
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta política?')) return;

    try {
      const { error } = await supabase
        .from('retention_policies_detailed' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Política excluída');
      loadPolicies();
    } catch (error: any) {
      console.error('Erro ao excluir política:', error);
      toast.error('Erro ao excluir política');
    }
  };

  if (loading) {
    return <div>Carregando políticas de retenção...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Políticas de Retenção de Dados</CardTitle>
                <CardDescription>
                  Configuração de períodos de retenção: 24 meses mensagens, 36 meses auditoria
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => {
                    setEditingPolicy(null);
                    setFormData({
                      policy_name: "",
                      target_table: "",
                      retention_months: 24,
                      description: "",
                      active: true,
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Política
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingPolicy ? 'Editar Política' : 'Nova Política de Retenção'}
                    </DialogTitle>
                    <DialogDescription>
                      Configure o período de retenção de dados para uma tabela específica
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome da Política</Label>
                      <Input
                        value={formData.policy_name}
                        onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
                        placeholder="Ex: Retenção de Mensagens"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tabela Alvo</Label>
                      <Input
                        value={formData.target_table}
                        onChange={(e) => setFormData({ ...formData, target_table: e.target.value })}
                        placeholder="Ex: log_mensagens"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Período de Retenção (meses)</Label>
                      <Input
                        type="number"
                        value={formData.retention_months}
                        onChange={(e) => setFormData({ ...formData, retention_months: parseInt(e.target.value) })}
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descreva o propósito desta política..."
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={formData.active}
                        onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                      />
                      <Label>Ativa</Label>
                    </div>
                    <Button onClick={handleSave} className="w-full">
                      Salvar Política
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={handleApplyPolicies} variant="outline">
                <Play className="h-4 w-4 mr-2" />
                Aplicar Agora
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead>Retenção</TableHead>
                <TableHead>Última Aplicação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{policy.policy_name}</p>
                      <p className="text-xs text-muted-foreground">{policy.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{policy.target_table}</code>
                  </TableCell>
                  <TableCell>{policy.retention_months} meses</TableCell>
                  <TableCell className="text-xs">
                    {policy.last_applied_at 
                      ? new Date(policy.last_applied_at).toLocaleString('pt-BR')
                      : 'Nunca aplicada'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={policy.active ? "default" : "secondary"}>
                      {policy.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingPolicy(policy);
                          setFormData({
                            policy_name: policy.policy_name,
                            target_table: policy.target_table,
                            retention_months: policy.retention_months,
                            description: policy.description,
                            active: policy.active,
                          });
                          setDialogOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleActive(policy)}
                      >
                        <Switch checked={policy.active} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(policy.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
