import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FlexibleDatePicker } from "@/components/ui/flexible-date-picker";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, X } from "lucide-react";
import { format } from "date-fns";

export interface ProfessionalType {
  id: string;
  tenant_id?: string;
  nome: string;
  ativo?: boolean;
}

export interface Especialidade {
  id: string;
  tenant_id: string;
  nome: string;
  ativo?: boolean | null;
  conselho?: string | null;
}

interface NewProfessionalDialogProps {
  onSuccess?: (professionalId: string) => void;
  inline?: boolean;
}

export function NewProfessionalDialog({
  onSuccess,
  inline = false,
}: NewProfessionalDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSeedingEspecialidades, setIsSeedingEspecialidades] = useState(false);
  const [tiposProfissional, setTiposProfissional] = useState<ProfessionalType[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<
    string[]
  >([]);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    tipo_profissional_id: "",
    outro_especifique: "",
    data_nascimento: undefined as Date | undefined,
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchTiposProfissional();
      fetchEspecialidades();
    }
  }, [open]);

  const fetchTiposProfissional = async () => {
    try {
      const { data, error } = await supabase
        .from("tipos_profissional")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setTiposProfissional(data as ProfessionalType[] || []);
    } catch (error) {
      console.error("Erro ao buscar tipos de profissional:", error);
    }
  };

  const handleSeedTiposPadrao = async () => {
    try {
      setIsSeeding(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.tenant_id) throw new Error("Tenant não encontrado.");

      const tenant_id = profile.tenant_id;
      
      const defaultTypes = [
        "Médico",
        "Dentista",
        "Fisioterapeuta",
        "Esteticista",
        "Psicólogo",
        "Fonoaudiólogo",
        "Nutricionista",
        "Terapeuta Ocupacional",
        "Biomédico",
        "Enfermeiro",
      ];

      // Seed idempotente: verifica na lista atual quais tipos faltam
      const existingNames = tiposProfissional.map((t) => t.nome);
      const missingTypes = defaultTypes.filter((nome) => !existingNames.includes(nome));

      if (missingTypes.length > 0) {
        // Inserimos explicitamente o tenant_id como uma garantia 
        // (mesmo que haja trigger no banco, isso cobre todas as bases/RLS)
        const payload = missingTypes.map((nome) => ({
          tenant_id,
          nome,
          ativo: true,
        }));

        const { error } = await supabase
          .from("tipos_profissional")
          .insert(payload);

        if (error) throw error;
      }
      
      await fetchTiposProfissional();
      
      toast({
        title: "Sucesso",
        description: "Tipos de profissional criados com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro no seed:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar os tipos padrão.",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const fetchEspecialidades = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.tenant_id) return;

      // Tabela possui tenant_id. Aplicado filtro explícito além da RLS.
      const { data, error } = await supabase
        .from("especialidades")
        .select("id, nome, conselho, tenant_id, ativo")
        .eq("tenant_id", profile.tenant_id)
        .eq("ativo", true)
        .order("nome");

      if (import.meta.env.DEV) {
         console.log(`[DEV] especialidades fetched (tenant: ${profile.tenant_id.substring(0, 8)}...): ${data?.length || 0} itens`);
         if (error) console.error("[DEV] Erro fetchEspecialidades resumido:", error.message);
      }

      if (error) throw error;
      setEspecialidades(data as Especialidade[] || []);
    } catch (error) {
      console.error("Erro ao buscar especialidades:", error);
    }
  };

  const handleSeedEspecialidades = async () => {
    try {
      setIsSeedingEspecialidades(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.tenant_id) throw new Error("Tenant não encontrado.");

      const tenant_id = profile.tenant_id;
      
      const defaultEspecialidades = [
        "Clínica Médica",
        "Dermatologia",
        "Ortopedia",
        "Pediatria",
        "Ginecologia",
        "Cardiologia",
        "Fisioterapia",
        "Psicologia",
        "Nutrição",
        "Estética/Procedimentos"
      ];

      // Seed idempotente: verifica na lista atual
      const existingNames = especialidades.map((e) => e.nome);
      const missingEspecialidades = defaultEspecialidades.filter((nome) => !existingNames.includes(nome));

      if (missingEspecialidades.length > 0) {
        const payload = missingEspecialidades.map((nome) => ({
          tenant_id,
          nome,
          ativo: true,
        }));

        const { error } = await supabase
          .from("especialidades")
          .insert(payload);

        if (error) throw error;
      }
      
      await fetchEspecialidades();
      
      toast({
        title: "Sucesso",
        description: "Especialidades padrão criadas com sucesso.",
      });
    } catch (error: any) {
      console.error("Erro no seed de especialidades:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar as especialidades padrão.",
        variant: "destructive",
      });
    } finally {
      setIsSeedingEspecialidades(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e e-mail são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (
      formData.tipo_profissional_id === "outro" &&
      !formData.outro_especifique
    ) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, especifique o tipo de profissional.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Buscar tenant_id do usuário logado
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile)
        throw new Error(
          "Perfil do usuário não encontrado. Conclua seu cadastro em Configurações.",
        );
      if (!profile.tenant_id)
        throw new Error(
          "Tenant não encontrado. Associe seu perfil a uma clínica em Configurações.",
        );

      // Criar usuário no auth (senha temporária será enviada por email)
      const tempPassword = Math.random().toString(36).slice(-12) + "A1!";

      const { data: authData, error: authError } =
        await supabase.functions.invoke("create-user", {
          body: {
            email: formData.email,
            password: tempPassword,
            userData: {
              nome: formData.nome,
              telefone: formData.telefone,
            },
          },
        });

      if (authError)
        throw new Error(
          authError.message || "Erro ao chamar função de criação de usuário",
        );
      if (authData.error) throw new Error(authData.error);
      if (!authData.user) throw new Error("Erro ao criar usuário");

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

      // Atualizar perfil com role profissional
      const { error: updateError } = await (supabase as any)
        .from("profiles")
        .update({
          nome: formData.nome,
          telefone: formData.telefone || null,
          role: "profissional",
          tenant_id: profile.tenant_id,
          tipo_profissional_id: formData.tipo_profissional_id || null,
          data_nascimento: dataNascimentoFormatada,
        })
        .eq("id", authData.user.id);

      if (updateError) throw updateError;

      // Inserir especialidades
      if (selectedEspecialidades.length > 0) {
        const { error: espError } = await (supabase as any)
          .from("profissional_especialidades")
          .insert(
            selectedEspecialidades.map((esp_id) => ({
              tenant_id: profile.tenant_id,
              profissional_id: authData.user.id,
              especialidade_id: esp_id,
            })),
          );

        if (espError) throw espError;
      }

      toast({
        title: "Sucesso!",
        description:
          "Profissional cadastrado com sucesso. Um e-mail de confirmação foi enviado.",
      });

      setOpen(false);
      setFormData({
        nome: "",
        email: "",
        telefone: "",
        tipo_profissional_id: "",
        outro_especifique: "",
        data_nascimento: undefined,
      });
      setSelectedEspecialidades([]);

      if (onSuccess && authData.user) {
        onSuccess(authData.user.id);
      }
    } catch (error: any) {
      console.error("Erro ao cadastrar profissional:", error);

      let errorMessage = "Não foi possível cadastrar o profissional.";
      if (error.message?.includes("already registered")) {
        errorMessage = "Este e-mail já está cadastrado no sistema.";
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

  const trigger = inline ? (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-auto p-0 text-xs text-primary font-medium hover:bg-transparent hover:text-primary/80 gap-1"
    >
      <Plus className="h-3 w-3" />
      Novo Profissional
    </Button>
  ) : (
    <Button type="button">
      <Plus className="h-4 w-4 mr-2" />
      Novo Profissional
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Cadastrar Novo Profissional
          </DialogTitle>
          <DialogDescription>
            Informe os dados do profissional. Um e-mail de confirmação será
            enviado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prof_nome">Nome Completo *</Label>
            <Input
              id="prof_nome"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              placeholder="Nome do profissional"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prof_email">E-mail *</Label>
            <Input
              id="prof_email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="email@exemplo.com"
              required
            />
            <p className="text-xs text-muted-foreground">
              Um e-mail de confirmação será enviado para este endereço
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prof_telefone">Telefone</Label>
            <Input
              id="prof_telefone"
              value={formData.telefone}
              onChange={(e) =>
                setFormData({ ...formData, telefone: e.target.value })
              }
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Profissional</Label>
            {tiposProfissional.length === 0 ? (
              <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-md border text-sm">
                <p className="text-muted-foreground">
                  Nenhum tipo cadastrado ainda para sua clínica.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSeedTiposPadrao}
                  disabled={isSeeding}
                  className="w-fit"
                >
                  {isSeeding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar tipos padrão
                </Button>
              </div>
            ) : (
              <Select
                value={formData.tipo_profissional_id}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    tipo_profissional_id: value,
                    outro_especifique:
                      value === "outro" ? formData.outro_especifique : "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposProfissional.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                  <SelectItem value="outro">Outro (especificar)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {formData.tipo_profissional_id === "outro" && (
            <div className="space-y-2">
              <Label htmlFor="outro_especifique">Especifique *</Label>
              <Input
                id="outro_especifique"
                value={formData.outro_especifique}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    outro_especifique: e.target.value,
                  })
                }
                placeholder="Especifique o tipo de profissional"
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Especialidades</Label>
            {especialidades.length <= 1 && (
              <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-md border text-sm mb-2">
                <p className="text-muted-foreground">
                  {especialidades.length === 0 
                    ? "Nenhuma especialidade cadastrada ainda para sua clínica."
                    : "Existem poucas especialidades cadastradas. Deseja adicionar lista padrão?"}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSeedEspecialidades}
                  disabled={isSeedingEspecialidades}
                  className="w-fit"
                >
                  {isSeedingEspecialidades && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar especialidades padrão
                </Button>
              </div>
            )}
            
            <Select
              value=""
              onValueChange={(value) => {
                if (!selectedEspecialidades.includes(value)) {
                  setSelectedEspecialidades([...selectedEspecialidades, value]);
                }
              }}
              disabled={especialidades.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Adicionar especialidade" />
              </SelectTrigger>
              <SelectContent>
                {especialidades
                  .filter((esp) => !selectedEspecialidades.includes(esp.id))
                  .map((esp) => (
                    <SelectItem key={esp.id} value={esp.id}>
                      {esp.nome} {esp.conselho && `(${esp.conselho})`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedEspecialidades.map((espId) => {
                const esp = especialidades.find((e) => e.id === espId);
                return esp ? (
                  <Badge key={espId} variant="secondary" className="gap-1">
                    {esp.nome}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() =>
                        setSelectedEspecialidades(
                          selectedEspecialidades.filter((id) => id !== espId),
                        )
                      }
                    />
                  </Badge>
                ) : null;
              })}
            </div>
          </div>

          <FlexibleDatePicker
            label="Data de Nascimento"
            value={formData.data_nascimento}
            onChange={(date) =>
              setFormData({ ...formData, data_nascimento: date })
            }
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
