import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus, Pencil, Trash2, Stethoscope, Syringe, Heart, Activity,
  Pill, TestTube, Microscope, Eye, Ear, Brain, Bone, HeartPulse,
  Users, User, UserCog, Clipboard, FileText, ClipboardList,
  Phone, Calendar, Settings, Shield, Sparkles
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TipoProfissional {
  id: string;
  nome: string;
  descricao: string | null;
  acesso_prontuarios: boolean;
  cor: string;
  icone: string;
  ativo: boolean;
}

// Ícones disponíveis para tipos de profissional
const HEALTH_ICONS = [
  { name: "Stethoscope", icon: Stethoscope, label: "Estetoscópio" },
  { name: "Syringe", icon: Syringe, label: "Seringa" },
  { name: "Heart", icon: Heart, label: "Coração" },
  { name: "Activity", icon: Activity, label: "Atividade" },
  { name: "Pill", icon: Pill, label: "Pílula" },
  { name: "TestTube", icon: TestTube, label: "Tubo de Ensaio" },
  { name: "Microscope", icon: Microscope, label: "Microscópio" },
  { name: "Eye", icon: Eye, label: "Olho" },
  { name: "Ear", icon: Ear, label: "Ouvido" },
  { name: "Brain", icon: Brain, label: "Cérebro" },
  { name: "Bone", icon: Bone, label: "Osso" },
  { name: "HeartPulse", icon: HeartPulse, label: "Batimento Cardíaco" },
  { name: "Users", icon: Users, label: "Equipe" },
  { name: "User", icon: User, label: "Usuário" },
  { name: "UserCog", icon: UserCog, label: "Usuário Config" },
  { name: "Clipboard", icon: Clipboard, label: "Prancheta" },
  { name: "FileText", icon: FileText, label: "Documento" },
  { name: "ClipboardList", icon: ClipboardList, label: "Lista" },
  { name: "Phone", icon: Phone, label: "Telefone" },
  { name: "Calendar", icon: Calendar, label: "Calendário" },
  { name: "Settings", icon: Settings, label: "Configurações" },
  { name: "Shield", icon: Shield, label: "Escudo" },
  { name: "Sparkles", icon: Sparkles, label: "Estrelas" },
];

export default function TiposProfissional() {
  const [tipos, setTipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoProfissional | null>(null);
  const [initialFormData, setInitialFormData] = useState({
    nome: "",
    descricao: "",
    acesso_prontuarios: false,
    cor: "#6366f1",
    icone: "User",
    ativo: true
  });
  const [formData, setFormData] = useState(initialFormData);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTipos();
  }, []);

  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    setHasChanges(changed);
  }, [formData, initialFormData]);

  const fetchTipos = async () => {
    try {
      const { data, error } = await supabase
        .from("tipos_profissional")
        .select("*")
        .order("nome");

      if (error) throw error;
      setTipos(data || []);
    } catch (error) {
      console.error("Erro ao buscar tipos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tipos de profissional.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast({
        title: "Erro",
        description: "O nome é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

      if (editingTipo) {
        const { error } = await supabase
          .from("tipos_profissional")
          .update({
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null,
            acesso_prontuarios: formData.acesso_prontuarios,
            cor: formData.cor,
            icone: formData.icone,
            ativo: formData.ativo
          })
          .eq("id", editingTipo.id);

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Tipo de profissional atualizado."
        });
      } else {
        const { error } = await (supabase as any)
          .from("tipos_profissional")
          .insert({
            tenant_id: profile.tenant_id,
            nome: formData.nome.trim(),
            descricao: formData.descricao.trim() || null,
            acesso_prontuarios: formData.acesso_prontuarios,
            cor: formData.cor,
            icone: formData.icone,
            ativo: formData.ativo
          });

        if (error) throw error;

        toast({
          title: "Sucesso!",
          description: "Tipo de profissional criado."
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchTipos();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o tipo de profissional.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (tipo: TipoProfissional) => {
    const data = {
      nome: tipo.nome,
      descricao: tipo.descricao || "",
      acesso_prontuarios: tipo.acesso_prontuarios,
      cor: tipo.cor,
      icone: tipo.icone,
      ativo: tipo.ativo
    };
    setFormData(data);
    setInitialFormData(data);
    setEditingTipo(tipo);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este tipo de profissional?")) return;

    try {
      const { error } = await (supabase as any)
        .from("tipos_profissional")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Tipo de profissional excluído."
      });

      fetchTipos();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir o tipo de profissional.",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    const defaultData = {
      nome: "",
      descricao: "",
      acesso_prontuarios: false,
      cor: "#6366f1",
      icone: "User",
      ativo: true
    };
    setFormData(defaultData);
    setInitialFormData(defaultData);
    setEditingTipo(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tipos de Profissional</h1>
            <p className="text-muted-foreground">
              Gerencie os tipos de profissionais e suas permissões
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Tipo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-3">
                <DialogTitle>
                  {editingTipo ? "Editar" : "Novo"} Tipo de Profissional
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Médico, Fisioterapeuta, Recepcionista"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição do tipo de profissional"
                    rows={2}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cor">Cor</Label>
                  <Input
                    id="cor"
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Selecione um Ícone *</Label>
                  <div className="grid grid-cols-8 gap-2 p-2 border rounded-lg max-h-[120px] overflow-y-auto">
                    {HEALTH_ICONS.map(({ name, icon: IconComponent, label }) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setFormData({ ...formData, icone: name })}
                        className={cn(
                          "flex flex-col items-center justify-center p-1.5 rounded-lg border-2 transition-all hover:bg-accent",
                          formData.icone === name
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        )}
                        title={label}
                      >
                        <IconComponent className="h-4 w-4" />
                        <span className="text-[8px] mt-0.5 text-center line-clamp-1">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Acesso a Prontuários</Label>
                    <p className="text-xs text-muted-foreground">
                      Permite que este tipo de profissional acesse prontuários de pacientes
                    </p>
                  </div>
                  <Switch
                    checked={formData.acesso_prontuarios}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, acesso_prontuarios: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-sm">Ativo</Label>
                    <p className="text-xs text-muted-foreground">
                      Define se este tipo está disponível para uso
                    </p>
                  </div>
                  <Switch
                    checked={formData.ativo}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, ativo: checked })
                    }
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  {hasChanges && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormData(initialFormData);
                        setHasChanges(false);
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit" disabled={!hasChanges || !formData.nome.trim()}>
                    {editingTipo ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">Carregando...</div>
        ) : tipos.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Nenhum tipo de profissional cadastrado
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tipos.map((tipo) => {
              const IconData = HEALTH_ICONS.find(i => i.name === tipo.icone);
              const IconComponent = IconData?.icon || User;

              return (
                <Card key={tipo.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: tipo.cor + "20" }}
                        >
                          <IconComponent className="h-5 w-5" style={{ color: tipo.cor }} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{tipo.nome}</CardTitle>
                          {!tipo.ativo && (
                            <Badge variant="secondary" className="mt-1">
                              Inativo
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tipo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tipo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {tipo.descricao && (
                      <CardDescription className="mt-2">
                        {tipo.descricao}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {tipo.acesso_prontuarios ? (
                        <Badge variant="default">Acessa Prontuários</Badge>
                      ) : (
                        <Badge variant="outline">Sem Acesso a Prontuários</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
