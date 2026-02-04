import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Macro {
  id: string;
  nome: string;
  conteudo: string;
  visibilidade: string;
  categoria: string;
  variaveis_exemplo: any;
  ativo: boolean;
}

export const MacroManager = () => {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMacro, setEditingMacro] = useState<Macro | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    conteudo: "",
    visibilidade: "global",
    categoria: "",
    variaveis_exemplo: "{}"
  });

  const AVAILABLE_VARIABLES = [
    { label: "Nome do Cliente", value: "{{nome_cliente}}" },
    { label: "Email do Cliente", value: "{{email_cliente}}" },
    { label: "Telefone do Cliente", value: "{{telefone_cliente}}" },
    { label: "Número do Ticket", value: "{{numero_ticket}}" },
    { label: "Título do Ticket", value: "{{titulo_ticket}}" },
    { label: "Descrição do Ticket", value: "{{descricao_ticket}}" },
    { label: "Status", value: "{{status}}" },
    { label: "Prioridade", value: "{{prioridade}}" },
    { label: "Data de Criação", value: "{{data_criacao}}" },
    { label: "Nome do Agente", value: "{{nome_agente}}" },
    { label: "Email do Agente", value: "{{email_agente}}" },
    { label: "Saudação (Bom dia/tarde)", value: "{{saudacao_horario}}" },
    { label: "Data Atual", value: "{{data_atual}}" },
  ];

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('conteudo') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = formData.conteudo;
      const newText = text.substring(0, start) + variable + text.substring(end);

      setFormData({ ...formData, conteudo: newText });

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else {
      setFormData({ ...formData, conteudo: formData.conteudo + variable });
    }
  };

  useEffect(() => {
    loadMacros();
  }, []);

  const loadMacros = async () => {
    try {
      const { data, error } = await supabase
        .from("support_ticket_macros")
        .select("*")
        .order("categoria", { ascending: true });

      if (error) throw error;
      setMacros(data || []);
    } catch (error) {
      console.error("Error loading macros:", error);
      toast.error("Erro ao carregar macros");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const macroData = {
        ...formData,
        variaveis_exemplo: JSON.parse(formData.variaveis_exemplo),
        created_by: user.id
      };

      if (editingMacro) {
        const { error } = await supabase
          .from("support_ticket_macros")
          .update(macroData)
          .eq("id", editingMacro.id);

        if (error) throw error;
        toast.success("Macro atualizada com sucesso");
      } else {
        const { error } = await supabase
          .from("support_ticket_macros")
          .insert([macroData]);

        if (error) throw error;
        toast.success("Macro criada com sucesso");
      }

      setIsDialogOpen(false);
      resetForm();
      loadMacros();
    } catch (error: any) {
      console.error("Error saving macro:", error);
      toast.error(error.message || "Erro ao salvar macro");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta macro?")) return;

    try {
      const { error } = await supabase
        .from("support_ticket_macros")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Macro excluída com sucesso");
      loadMacros();
    } catch (error) {
      console.error("Error deleting macro:", error);
      toast.error("Erro ao excluir macro");
    }
  };

  const handleEdit = (macro: Macro) => {
    setEditingMacro(macro);
    setFormData({
      nome: macro.nome,
      conteudo: macro.conteudo,
      visibilidade: macro.visibilidade,
      categoria: macro.categoria || "",
      variaveis_exemplo: JSON.stringify(macro.variaveis_exemplo || {}, null, 2)
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingMacro(null);
    setFormData({
      nome: "",
      conteudo: "",
      visibilidade: "global",
      categoria: "",
      variaveis_exemplo: "{}"
    });
  };

  if (loading) {
    return <div className="text-center py-8">Carregando macros...</div>;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Macros de Resposta</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Macro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingMacro ? "Editar" : "Nova"} Macro</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Macro</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Input
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Ex: Saudações, Resoluções"
                />
              </div>

              <div>
                <Label htmlFor="visibilidade">Visibilidade</Label>
                <Select value={formData.visibilidade} onValueChange={(value) => setFormData({ ...formData, visibilidade: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global</SelectItem>
                    <SelectItem value="tenant">Tenant Específico</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="conteudo">Conteúdo</Label>
                <div className="space-y-2">
                  <Textarea
                    id="conteudo"
                    value={formData.conteudo}
                    onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                    rows={8}
                    required
                    placeholder="Use {{variavel}} para placeholders"
                  />
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_VARIABLES.map((v) => (
                      <Badge
                        key={v.value}
                        variant="outline"
                        className="cursor-pointer hover:bg-secondary transition-colors"
                        onClick={() => insertVariable(v.value)}
                      >
                        {v.label}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clique nas variáveis acima para inseri-las no texto.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="variaveis">Variáveis de Exemplo (JSON)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Use este campo apenas para documentar exemplos de valores para as variáveis. Isso não afeta a substituição real.
                </p>
                <Textarea
                  id="variaveis"
                  value={formData.variaveis_exemplo}
                  onChange={(e) => setFormData({ ...formData, variaveis_exemplo: e.target.value })}
                  rows={4}
                  placeholder='{"nome_cliente": "Exemplo", "numero_ticket": "123"}'
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingMacro ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {macros.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Nenhuma macro cadastrada</p>
        ) : (
          macros.map((macro) => (
            <Card key={macro.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{macro.nome}</h3>
                    {macro.categoria && <Badge variant="outline">{macro.categoria}</Badge>}
                    <Badge variant={macro.visibilidade === 'global' ? 'default' : 'secondary'}>
                      {macro.visibilidade}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                    {macro.conteudo}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(macro)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(macro.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
};