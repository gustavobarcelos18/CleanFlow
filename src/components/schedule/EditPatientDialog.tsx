import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FlexibleDatePicker } from "@/components/ui/flexible-date-picker";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { format, parse } from "date-fns";
import { useTerminology } from "@/stores/useSegmentStore";
import { validateCPF, formatCPF } from "@/lib/cpf";

interface EditPatientDialogProps {
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditPatientDialog({
  patientId,
  open,
  onOpenChange,
  onSuccess,
}: EditPatientDialogProps) {
  const t = useTerminology();
  const [isLoading, setIsLoading] = useState(false);
  const [isConsulting, setIsConsulting] = useState(false);
  const [initialData, setInitialData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    preferencia_contato: "whatsapp" as "whatsapp" | "sms" | "email",
    consentimento_lgpd: false,
    notas_internas: "",
    data_nascimento: undefined as Date | undefined,
    plano_saude_id: "",
    numero_carteirinha: "",
  });
  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    preferencia_contato: "whatsapp" as "whatsapp" | "sms" | "email",
    consentimento_lgpd: false,
    notas_internas: "",
    data_nascimento: undefined as Date | undefined,
    plano_saude_id: "",
    numero_carteirinha: "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [planosSaude, setPlanosSaude] = useState<any[]>([]);
  const nomeRef = useRef<HTMLInputElement>(null);
  const telefoneRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(initialData);
    setHasChanges(changed);
  }, [formData, initialData]);

  const fetchPlanosSaude = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("planos_saude")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setPlanosSaude(data || []);
    } catch (error) {
      console.error("Erro ao buscar planos de saúde:", error);
    }
  }, []);

  const fetchPatient = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("pacientes")
        .select("*")
        .eq("id", patientId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Converter data_nascimento de string para Date (parsing robusto)
        let dataNascimento: Date | undefined = undefined;
        if (data.data_nascimento) {
          const [y, m, d] = (data.data_nascimento as string)
            .split("-")
            .map(Number);
          const parsedDate = new Date(y, (m ?? 1) - 1, d ?? 1);
          if (
            !isNaN(parsedDate.getTime()) &&
            parsedDate.getFullYear() === y &&
            parsedDate.getMonth() === (m ?? 1) - 1 &&
            parsedDate.getDate() === (d ?? 1)
          ) {
            dataNascimento = parsedDate;
          }
        }

        const patientData = {
          nome: data.nome || "",
          cpf: data.cpf ? formatCPF(data.cpf) : "",
          telefone: data.telefone || "",
          email: data.email || "",
          preferencia_contato: data.preferencia_contato || "whatsapp",
          consentimento_lgpd: data.consentimento_lgpd || false,
          notas_internas: data.notas_internas || "",
          data_nascimento: dataNascimento,
          plano_saude_id: data.plano_saude_id || "",
          numero_carteirinha: data.numero_carteirinha || "",
        };
        setInitialData(patientData);
        setFormData(patientData);
      }
    } catch (error) {
      console.error("Erro ao buscar paciente:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do paciente.",
        variant: "destructive",
      });
    }
  }, [patientId, toast]);

  useEffect(() => {
    if (open && patientId) {
      fetchPatient();
      fetchPlanosSaude();
    }
  }, [open, patientId, fetchPatient, fetchPlanosSaude]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missingFields: string[] = [];
    if (!formData.nome.trim()) missingFields.push("Nome");
    if (!formData.cpf.trim()) missingFields.push("CPF");

    if (formData.cpf && !validateCPF(formData.cpf)) {
      toast({
        title: "CPF inválido",
        description: "O CPF informado não é válido.",
        variant: "destructive",
      });
      return;
    }

    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios não preenchidos",
        description: `Por favor, preencha: ${missingFields.join(", ")}`,
        variant: "destructive",
      });

      if (!formData.nome.trim()) nomeRef.current?.focus();
      return;
    }

    try {
      setIsLoading(true);

      // Validar e formatar data de nascimento
      let dataNascimentoFormatada = null;
      if (
        formData.data_nascimento instanceof Date &&
        !isNaN(formData.data_nascimento.getTime())
      ) {
        dataNascimentoFormatada = format(
          formData.data_nascimento,
          "yyyy-MM-dd",
        );
      }

      const { data: updated, error } = await (supabase as any)
        .from("pacientes")
        .update({
          nome: formData.nome.trim().toUpperCase(),
          cpf: formData.cpf.replace(/\D/g, ""),
          telefone: formData.telefone.trim() || null,
          email: formData.email.trim() || null,
          preferencia_contato: formData.preferencia_contato,
          consentimento_lgpd: formData.consentimento_lgpd,
          notas_internas: formData.notas_internas.trim() || null,
          data_nascimento: dataNascimentoFormatada,
          plano_saude_id: formData.plano_saude_id || null,
          numero_carteirinha: formData.numero_carteirinha?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", patientId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!updated)
        throw new Error(
          "Nenhuma linha atualizada. Verifique permissões de gravação.",
        );

      toast({
        title: "Sucesso!",
        description: `${t.client_label} atualizado com sucesso.`,
      });

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Erro ao atualizar:", error);

      let errorMessage = "Não foi possível atualizar o paciente.";
      if (error.code === "23505") {
        errorMessage =
          "Já existe um paciente cadastrado com este mesmo Nome e CPF.";
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Editar {t.client_label}</DialogTitle>
          <DialogDescription>
            Atualize as informações do {t.client_label.toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              ref={nomeRef}
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value.toUpperCase() })
              }
              placeholder={`Nome do ${t.client_label.toLowerCase()}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cpf: formatCPF(e.target.value),
                  })
                }
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                ref={telefoneRef}
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="email@exemplo.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferencia">Preferência de Contato</Label>
            <Select
              value={formData.preferencia_contato}
              onValueChange={(value) =>
                setFormData({ ...formData, preferencia_contato: value as any })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="lgpd">Consentimento LGPD</Label>
            <Switch
              id="lgpd"
              checked={formData.consentimento_lgpd}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, consentimento_lgpd: checked })
              }
            />
          </div>

          <FlexibleDatePicker
            label="Data de Nascimento"
            value={formData.data_nascimento}
            onChange={(date) =>
              setFormData({ ...formData, data_nascimento: date })
            }
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plano">Plano de Saúde</Label>
              <Select
                value={formData.plano_saude_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, plano_saude_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {planosSaude.map((plano) => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carteirinha">Número da Carteirinha</Label>
              <Input
                id="carteirinha"
                value={formData.numero_carteirinha}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    numero_carteirinha: e.target.value,
                  })
                }
                placeholder="Número da carteirinha"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas Internas</Label>
            <Textarea
              id="notas"
              value={formData.notas_internas}
              onChange={(e) =>
                setFormData({ ...formData, notas_internas: e.target.value })
              }
              placeholder="Observações internas sobre o paciente..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            {hasChanges && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData(initialData);
                  setHasChanges(false);
                }}
              >
                Cancelar Alterações
              </Button>
            )}
            <Button type="submit" disabled={isLoading || !hasChanges}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
