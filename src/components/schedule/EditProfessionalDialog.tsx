import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FlexibleDatePicker } from "@/components/ui/flexible-date-picker";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, X } from "lucide-react";
import { format, parse } from "date-fns";

interface Especialidade {
  id: string;
  nome: string;
  conselho?: string;
}

interface TipoProfissional {
  id: string;
  nome: string;
}

interface EditProfessionalDialogProps {
  professionalId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditProfessionalDialog({ 
  professionalId, 
  open, 
  onOpenChange, 
  onSuccess 
}: EditProfessionalDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [tiposProfissional, setTiposProfissional] = useState<any[]>([]);
  const [selectedEspecialidades, setSelectedEspecialidades] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    numero_registro: "",
    uf_registro: "",
    tipo_profissional_id: "",
    data_nascimento: undefined as Date | undefined
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchEspecialidades();
      fetchTiposProfissional();
      if (professionalId) {
        fetchProfessional();
      }
    }
  }, [open, professionalId]);

  const fetchEspecialidades = async () => {
    try {
      const { data, error } = await supabase
        .from('especialidades')
        .select('id, nome, conselho')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setEspecialidades(data || []);
    } catch (error) {
      console.error('Erro ao buscar especialidades:', error);
    }
  };

  const fetchTiposProfissional = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('tipos_profissional')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setTiposProfissional(data || []);
    } catch (error) {
      console.error('Erro ao buscar tipos de profissional:', error);
    }
  };

  const fetchProfessional = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', professionalId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Converter data_nascimento de string para Date (parsing robusto)
        let dataNascimento: Date | undefined = undefined;
        if (data.data_nascimento) {
          const [y, m, d] = (data.data_nascimento as string).split('-').map(Number);
          const parsedDate = new Date(y, (m ?? 1) - 1, d ?? 1);
          if (
            !isNaN(parsedDate.getTime()) &&
            parsedDate.getFullYear() === y &&
            parsedDate.getMonth() === ((m ?? 1) - 1) &&
            parsedDate.getDate() === (d ?? 1)
          ) {
            dataNascimento = parsedDate;
          }
        }

        setFormData({
          nome: data.nome || "",
          email: data.email || "",
          telefone: data.telefone || "",
          cpf: data.cpf || "",
          numero_registro: data.numero_registro || "",
          uf_registro: data.uf_registro || "",
          tipo_profissional_id: data.tipo_profissional_id || "",
          data_nascimento: dataNascimento
        });

        // Buscar especialidades do profissional
        const { data: espData, error: espError } = await (supabase as any)
          .from('profissional_especialidades')
          .select('especialidade_id')
          .eq('profissional_id', professionalId);

        if (espError) throw espError;
        setSelectedEspecialidades(espData?.map((e: any) => e.especialidade_id) || []);
      }
    } catch (error) {
      console.error('Erro ao buscar profissional:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do profissional.",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      // Obter tenant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', professionalId)
        .maybeSingle();

      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

      // Validar e formatar data de nascimento
      let dataNascimentoFormatada = null;
      if (formData.data_nascimento instanceof Date && !isNaN(formData.data_nascimento.getTime())) {
        dataNascimentoFormatada = format(formData.data_nascimento, 'yyyy-MM-dd');
      }

      const { data: updated, error } = await (supabase as any)
        .from('profiles')
        .update({
          nome: formData.nome,
          telefone: formData.telefone || null,
          cpf: formData.cpf || null,
          numero_registro: formData.numero_registro || null,
          uf_registro: formData.uf_registro || null,
          tipo_profissional_id: formData.tipo_profissional_id ? formData.tipo_profissional_id : null,
          data_nascimento: dataNascimentoFormatada,
          updated_at: new Date().toISOString()
        })
        .eq('id', professionalId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!updated) throw new Error('Nenhuma linha atualizada. Verifique permissões de gravação.');

      // Atualizar especialidades
      // Primeiro, remover todas as especialidades existentes
      await (supabase as any)
        .from('profissional_especialidades')
        .delete()
        .eq('profissional_id', professionalId);

      // Inserir as novas especialidades
      if (selectedEspecialidades.length > 0) {
        const { error: espError } = await (supabase as any)
          .from('profissional_especialidades')
          .insert(
            selectedEspecialidades.map(esp_id => ({
              tenant_id: profile.tenant_id,
              profissional_id: professionalId,
              especialidade_id: esp_id
            }))
          );

        if (espError) throw espError;
      }

      toast({
        title: "Sucesso!",
        description: "Profissional atualizado com sucesso."
      });

      onOpenChange(false);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o profissional.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Editar Profissional</DialogTitle>
          <DialogDescription>
            Atualize as informações do profissional de saúde
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Nome do profissional"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                disabled
                className="bg-muted cursor-not-allowed"
                value={formData.email}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Profissional</Label>
            <Select 
              value={formData.tipo_profissional_id} 
              onValueChange={(value) => setFormData({ ...formData, tipo_profissional_id: value })}
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
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Especialidades</Label>
            <Select
              value=""
              onValueChange={(value) => {
                if (!selectedEspecialidades.includes(value)) {
                  setSelectedEspecialidades([...selectedEspecialidades, value]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Adicionar especialidade" />
              </SelectTrigger>
              <SelectContent>
                {especialidades
                  .filter(esp => !selectedEspecialidades.includes(esp.id))
                  .map((esp) => (
                    <SelectItem key={esp.id} value={esp.id}>
                      {esp.nome} {esp.conselho && `(${esp.conselho})`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedEspecialidades.map(espId => {
                const esp = especialidades.find(e => e.id === espId);
                return esp ? (
                  <Badge key={espId} variant="secondary" className="gap-1">
                    {esp.nome}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedEspecialidades(
                        selectedEspecialidades.filter(id => id !== espId)
                      )}
                    />
                  </Badge>
                ) : null;
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_registro">Número de Registro</Label>
              <Input
                id="numero_registro"
                value={formData.numero_registro}
                onChange={(e) => setFormData({ ...formData, numero_registro: e.target.value })}
                placeholder="Ex: 123456"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="uf">UF</Label>
              <Input
                id="uf"
                value={formData.uf_registro}
                onChange={(e) => setFormData({ ...formData, uf_registro: e.target.value })}
                placeholder="Ex: SP"
                maxLength={2}
              />
            </div>
          </div>

          <FlexibleDatePicker
            label="Data de Nascimento"
            value={formData.data_nascimento}
            onChange={(date) => setFormData({ ...formData, data_nascimento: date })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
