import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { z } from "zod";

const patientSchema = z.object({
  nome: z.string().trim().min(1, { message: "Nome é obrigatório" }).max(200, { message: "Nome muito longo" }),
  telefone: z.string().trim().min(10, { message: "Telefone inválido" }).max(20, { message: "Telefone muito longo" }),
  email: z.string().trim().email({ message: "E-mail inválido" }).max(255, { message: "E-mail muito longo" }).optional().or(z.literal("")),
  notas_internas: z.string().max(1000, { message: "Notas muito longas" }).optional()
});

interface NewPatientDialogProps {
  onSuccess?: (patientId: string) => void;
}

import { DynamicForm } from "@/components/common/DynamicForm";
import { useTerminology } from "@/stores/useSegmentStore";
import { useAuth } from "@/hooks/useAuth";

// ... existing imports

import { usePlanLimits } from "@/hooks/usePlanLimits";

// ...

export function NewPatientDialog({ onSuccess }: NewPatientDialogProps) {
  const t = useTerminology();
  const { profile } = useAuth();
  const { checkLimitAndToast } = usePlanLimits();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const nomeRef = useRef<HTMLInputElement>(null);
  const telefoneRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    email: "",
    preferencia_contato: "whatsapp" as "whatsapp" | "sms" | "email",
    consentimento_lgpd: false,
    notas_internas: "",
    data_nascimento: undefined as Date | undefined,
    plano_saude_id: "",
    numero_carteirinha: "",
    custom_data: {} as Record<string, any>
  });

  useEffect(() => {
    const isDirty = formData.nome !== "" ||
      formData.telefone !== "" ||
      formData.email !== "" ||
      formData.notas_internas !== "";
    setHasChanges(isDirty);
  }, [formData]);

  const handleOpen = () => {
    if (checkLimitAndToast('clients')) {
      setOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('pacientes')
        .insert([{
          nome: formData.nome,
          telefone: formData.telefone,
          email: formData.email || null,
          preferencia_contato: formData.preferencia_contato,
          consentimento_lgpd: formData.consentimento_lgpd,
          consentimento_data: formData.consentimento_lgpd ? new Date().toISOString() : null,
          notas_internas: formData.notas_internas || null,
          data_nascimento: formData.data_nascimento ? format(formData.data_nascimento, 'yyyy-MM-dd') : null,
          tenant_id: profile.tenant_id,
          custom_data: formData.custom_data
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `${t.client_label} cadastrado com sucesso.`
      });

      setOpen(false);
      setFormData({
        nome: "",
        telefone: "",
        email: "",
        preferencia_contato: "whatsapp",
        consentimento_lgpd: false,
        notas_internas: "",
        data_nascimento: undefined,
        plano_saude_id: "",
        numero_carteirinha: "",
        custom_data: {}
      });

      if (onSuccess && data) {
        onSuccess(data.id);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Erro ao cadastrar paciente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" onClick={handleOpen}>
        <Plus className="h-4 w-4 mr-2" />
        Novo {t.client_label}
      </Button>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Cadastrar Novo {t.client_label}</DialogTitle>
          <DialogDescription>Preencha os dados do {t.client_label.toLowerCase()} para o cadastro.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              ref={nomeRef}
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder={`Nome do ${t.client_label.toLowerCase()}`}
              required
            />
          </div>

          {/* ... existing fields (telefone, email) ... */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                ref={telefoneRef}
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferencia_contato">Preferência de Contato</Label>
            <Select
              value={formData.preferencia_contato}
              onValueChange={(value: "whatsapp" | "sms" | "email") => setFormData({ ...formData, preferencia_contato: value })}
            >
              <SelectTrigger id="preferencia_contato">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_nascimento">Data de Nascimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.data_nascimento && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.data_nascimento ? (
                    format(formData.data_nascimento, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.data_nascimento}
                  onSelect={(date) => setFormData({ ...formData, data_nascimento: date })}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <DynamicForm
            data={formData.custom_data}
            onChange={(key, value) => setFormData(prev => ({
              ...prev,
              custom_data: { ...prev.custom_data, [key]: value }
            }))}
          />

          <div className="flex items-center space-x-2">
            <Switch
              id="consentimento_lgpd"
              checked={formData.consentimento_lgpd}
              onCheckedChange={(checked) => setFormData({ ...formData, consentimento_lgpd: checked })}
            />
            <Label htmlFor="consentimento_lgpd" className="cursor-pointer">
              Consentimento LGPD obtido
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas_internas">Observações Internas</Label>
            <Textarea
              id="notas_internas"
              value={formData.notas_internas}
              onChange={(e) => setFormData({ ...formData, notas_internas: e.target.value })}
              placeholder={`Anotações sobre o ${t.client_label.toLowerCase()}...`}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            {hasChanges && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const defaultData = {
                    nome: "",
                    telefone: "",
                    email: "",
                    preferencia_contato: "whatsapp" as "whatsapp" | "sms" | "email",
                    consentimento_lgpd: false,
                    notas_internas: "",
                    data_nascimento: undefined as Date | undefined,
                    plano_saude_id: "",
                    numero_carteirinha: "",
                    custom_data: {}
                  };
                  setFormData(defaultData);
                  setHasChanges(false);
                }}
                disabled={isLoading}
              >
                Cancelar Alterações
              </Button>
            )}
            <Button type="submit" disabled={isLoading || !hasChanges}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                `Cadastrar ${t.client_label}`
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
