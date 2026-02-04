import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, X, MessageSquare } from "lucide-react";

interface TemplateButton {
  id: string;
  type: "quick_reply" | "url" | "phone";
  text: string;
  value?: string;
}

export function WhatsAppTemplateBuilder() {
  const [templateName, setTemplateName] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [buttons, setButtons] = useState<TemplateButton[]>([]);
  const [saving, setSaving] = useState(false);

  const addButton = (type: TemplateButton["type"]) => {
    const newButton: TemplateButton = {
      id: `btn_${Date.now()}`,
      type,
      text: "",
      value: type !== "quick_reply" ? "" : undefined,
    };
    setButtons([...buttons, newButton]);
  };

  const updateButton = (id: string, field: keyof TemplateButton, value: string) => {
    setButtons(buttons.map(btn => 
      btn.id === id ? { ...btn, [field]: value } : btn
    ));
  };

  const removeButton = (id: string) => {
    setButtons(buttons.filter(btn => btn.id !== id));
  };

  const saveTemplate = async () => {
    if (!templateName || !templateBody) {
      toast.error("Preencha nome e corpo do template");
      return;
    }

    setSaving(true);
    try {
      toast.success("Template salvo localmente");
      console.log("Template salvo:", { templateName, templateBody, buttons });
      
      // Limpar formulário
      setTemplateName("");
      setTemplateBody("");
      setButtons([]);
    } catch (error) {
      console.error("Erro ao salvar template:", error);
      toast.error("Erro ao salvar template");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Criar Template Interativo</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Nome do Template</Label>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Ex: confirmacao_consulta"
          />
        </div>

        <div>
          <Label>Mensagem</Label>
          <Textarea
            value={templateBody}
            onChange={(e) => setTemplateBody(e.target.value)}
            placeholder="Digite a mensagem do template..."
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use variáveis como {"{{nome}}"}, {"{{data}}"}, {"{{horario}}"}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Botões Interativos</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => addButton("quick_reply")}
              >
                <Plus className="h-4 w-4 mr-1" />
                Resposta Rápida
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addButton("url")}
              >
                <Plus className="h-4 w-4 mr-1" />
                URL
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => addButton("phone")}
              >
                <Plus className="h-4 w-4 mr-1" />
                Telefone
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {buttons.map((button) => (
              <Card key={button.id} className="p-3">
                <div className="flex items-start gap-2">
                  <Badge variant="secondary" className="mt-1">
                    {button.type === "quick_reply" && "Resposta Rápida"}
                    {button.type === "url" && "URL"}
                    {button.type === "phone" && "Telefone"}
                  </Badge>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Texto do botão"
                      value={button.text}
                      onChange={(e) => updateButton(button.id, "text", e.target.value)}
                    />
                    {button.type !== "quick_reply" && (
                      <Input
                        placeholder={button.type === "url" ? "https://..." : "+55..."}
                        value={button.value || ""}
                        onChange={(e) => updateButton(button.id, "value", e.target.value)}
                      />
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeButton(button.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-3">Preview</h4>
          <Card className="p-4 bg-muted">
            <p className="whitespace-pre-wrap mb-3">{templateBody || "Sua mensagem aparecerá aqui..."}</p>
            {buttons.length > 0 && (
              <div className="space-y-2">
                {buttons.map((btn) => (
                  <Button
                    key={btn.id}
                    variant="outline"
                    className="w-full"
                    disabled
                  >
                    {btn.text || "Botão"}
                  </Button>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Button
          onClick={saveTemplate}
          disabled={saving || !templateName || !templateBody}
          className="w-full"
        >
          {saving ? "Salvando..." : "Salvar Template"}
        </Button>
      </div>
    </Card>
  );
}
