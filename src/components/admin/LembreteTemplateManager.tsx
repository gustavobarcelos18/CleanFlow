import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown, Pause, Play, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Template {
  id: string;
  titulo: string;
  corpo_mensagem: string;
  janela_horas: number;
  tipo_servico: string;
  variante: string;
  ativo: boolean;
  score: number;
  taxa_confirmacao: number;
  total_envios: number;
  total_confirmacoes: number;
  recomendacao: string;
}

export function LembreteTemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const loadTemplates = async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .single();

      if (!profile?.tenant_id) return;

      const { data, error } = await supabase
        .from("lembrete_templates" as any)
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .order("score", { ascending: false });

      if (error) throw error;
      setTemplates((data as any) || []);
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
      toast.error("Erro ao carregar templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSaveTemplate = async (template: Partial<Template>) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .single();

      if (!profile?.tenant_id) return;

      if (template.id) {
        const { error } = await supabase
          .from("lembrete_templates" as any)
          .update(template)
          .eq("id", template.id);
        if (error) throw error;
        toast.success("Template atualizado!");
      } else {
        const { error } = await supabase
          .from("lembrete_templates" as any)
          .insert({ ...template, tenant_id: profile.tenant_id });
        if (error) throw error;
        toast.success("Template criado!");
      }
      
      loadTemplates();
      setIsDialogOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error("Erro ao salvar template:", error);
      toast.error("Erro ao salvar template");
    }
  };

  const toggleTemplateStatus = async (template: Template) => {
    try {
      const { error } = await supabase
        .from("lembrete_templates" as any)
        .update({ ativo: !template.ativo })
        .eq("id", template.id);
      
      if (error) throw error;
      toast.success(template.ativo ? "Template pausado" : "Template ativado");
      loadTemplates();
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status");
    }
  };

  const getRecommendationBadge = (recomendacao: string) => {
    const config = {
      promover: { label: "Promover", variant: "default" as const, icon: TrendingUp },
      pausar: { label: "Pausar", variant: "destructive" as const, icon: TrendingDown },
      manter: { label: "Manter", variant: "secondary" as const, icon: Play },
      testar: { label: "Em Teste", variant: "outline" as const, icon: Play },
    };

    const rec = config[recomendacao as keyof typeof config] || config.testar;
    const Icon = rec.icon;

    return (
      <Badge variant={rec.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {rec.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Templates de Lembretes</h2>
          <p className="text-muted-foreground">
            Gerencie templates com A/B testing e visualize performance
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTemplate(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Editar Template" : "Novo Template"}
              </DialogTitle>
            </DialogHeader>
            <TemplateForm
              template={editingTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingTemplate(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Carregando templates...
          </CardContent>
        </Card>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nenhum template cadastrado. Crie seu primeiro template!
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>{template.titulo}</CardTitle>
                      {getRecommendationBadge(template.recomendacao)}
                      <Badge variant={template.ativo ? "default" : "secondary"}>
                        {template.ativo ? "Ativo" : "Pausado"}
                      </Badge>
                    </div>
                    <CardDescription>
                      Janela: {template.janela_horas}h | Tipo: {template.tipo_servico} | 
                      Variante: {template.variante}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTemplate(template);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTemplateStatus(template)}
                    >
                      {template.ativo ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    {template.corpo_mensagem}
                  </div>
                  
                  {template.total_envios >= 30 && (
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Score</div>
                        <div className="text-2xl font-bold">{template.score.toFixed(1)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Taxa Confirmação</div>
                        <div className="text-2xl font-bold">{template.taxa_confirmacao.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total Envios</div>
                        <div className="text-2xl font-bold">{template.total_envios}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Confirmações</div>
                        <div className="text-2xl font-bold">{template.total_confirmacoes}</div>
                      </div>
                    </div>
                  )}
                  
                  {template.total_envios < 30 && (
                    <div className="text-sm text-muted-foreground">
                      📊 Amostra em coleta: {template.total_envios}/30 envios necessários para análise completa
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateForm({ 
  template, 
  onSave, 
  onCancel 
}: { 
  template: Template | null; 
  onSave: (t: Partial<Template>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    titulo: template?.titulo || "",
    corpo_mensagem: template?.corpo_mensagem || "",
    janela_horas: template?.janela_horas || 24,
    tipo_servico: template?.tipo_servico || "geral",
    variante: template?.variante || "A",
    ativo: template?.ativo ?? true,
  });

  return (
    <div className="space-y-4">
      <div>
        <Label>Título</Label>
        <Input
          value={formData.titulo}
          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          placeholder="Ex: Lembrete Padrão 24h"
        />
      </div>

      <div>
        <Label>Corpo da Mensagem</Label>
        <Textarea
          value={formData.corpo_mensagem}
          onChange={(e) => setFormData({ ...formData, corpo_mensagem: e.target.value })}
          placeholder="Use: {{nome_paciente}}, {{data}}, {{hora}}, {{servico}}"
          rows={4}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Variáveis disponíveis: nome_paciente, data, hora, servico
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Janela (horas)</Label>
          <Select
            value={formData.janela_horas.toString()}
            onValueChange={(v) => setFormData({ ...formData, janela_horas: parseInt(v) })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 hora</SelectItem>
              <SelectItem value="24">24 horas</SelectItem>
              <SelectItem value="72">72 horas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tipo de Serviço</Label>
          <Input
            value={formData.tipo_servico}
            onChange={(e) => setFormData({ ...formData, tipo_servico: e.target.value })}
            placeholder="geral, consulta, exame..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Variante (A/B)</Label>
          <Input
            value={formData.variante}
            onChange={(e) => setFormData({ ...formData, variante: e.target.value })}
            placeholder="A, B, C..."
            maxLength={1}
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={formData.ativo}
            onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
          />
          <Label>Template Ativo</Label>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => onSave({ ...template, ...formData })}>
          Salvar
        </Button>
      </div>
    </div>
  );
}
