import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus } from "lucide-react";

interface NewServiceDialogProps {
  onSuccess?: (serviceId: string) => void;
}

export function NewServiceDialog({ onSuccess }: NewServiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    duracao_minutos: "",
    preco: "",
    confirmacao_24h: false,
    ativo: true
  });
  const [hasChanges, setHasChanges] = useState(false);
  const nomeRef = useRef<HTMLInputElement>(null);
  const duracaoRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    setHasChanges(!!(formData.nome || formData.duracao_minutos || formData.preco));
  }, [formData]);

  // Lista de palavras-chave para validar se é atividade médica/exame
  const medicalKeywords = [
    'consulta', 'exame', 'cirurgia', 'procedimento', 'avaliação', 'tratamento',
    'raio-x', 'ultrassom', 'tomografia', 'ressonância', 'endoscopia', 'colonoscopia',
    'eletrocardiograma', 'hemograma', 'check-up', 'retorno', 'acompanhamento',
    'fisioterapia', 'terapia', 'sessão', 'aplicação', 'vacina', 'curativo',
    'biópsia', 'ecografia', 'audiometria', 'espirometria', 'holter', 'mapa'
  ];

  const validateMedicalService = (serviceName: string): boolean => {
    const nameLower = serviceName.toLowerCase().trim();
    return medicalKeywords.some(keyword => nameLower.includes(keyword));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missingFields: string[] = [];
    if (!formData.nome.trim()) missingFields.push("Nome");
    if (!formData.duracao_minutos) missingFields.push("Duração");

    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios não preenchidos",
        description: `Por favor, preencha: ${missingFields.join(", ")}`,
        variant: "destructive"
      });
      
      if (!formData.nome.trim()) nomeRef.current?.focus();
      else if (!formData.duracao_minutos) duracaoRef.current?.focus();
      
      return;
    }

    // Validar se é atividade médica
    if (!validateMedicalService(formData.nome)) {
      toast({
        title: "Serviço inválido",
        description: "Por favor, cadastre apenas atividades médicas, procedimentos ou exames. Ex: Consulta, Depilação a Laser, Exame de Sangue, Ultrassom, etc.",
        variant: "destructive"
      });
      nomeRef.current?.focus();
      return;
    }

    const duracao = parseInt(formData.duracao_minutos);
    if (isNaN(duracao) || duracao <= 0 || duracao > 480) {
      toast({
        title: "Duração inválida",
        description: "A duração deve ser entre 1 e 480 minutos (8 horas).",
        variant: "destructive"
      });
      return;
    }

    const preco = formData.preco ? parseFloat(formData.preco) : null;
    if (preco !== null && (isNaN(preco) || preco < 0)) {
      toast({
        title: "Preço inválido",
        description: "O preço deve ser um valor positivo.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);

      // Buscar tenant_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) throw new Error("Perfil do usuário não encontrado. Conclua seu cadastro em Configurações.");
      if (!profile.tenant_id) throw new Error("Tenant não encontrado. Associe seu perfil a uma clínica em Configurações.");

      const { data, error } = await supabase
        .from('servicos')
        .insert([{
          nome: formData.nome.trim(),
          duracao_minutos: duracao,
          preco: preco,
          confirmacao_24h: formData.confirmacao_24h,
          ativo: formData.ativo,
          tenant_id: profile.tenant_id
        }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error("Já existe um serviço com este nome");
        }
        throw error;
      }

      toast({
        title: "Sucesso!",
        description: "Serviço cadastrado com sucesso."
      });

      setOpen(false);
      setFormData({
        nome: "",
        duracao_minutos: "",
        preco: "",
        confirmacao_24h: false,
        ativo: true
      });

      if (onSuccess && data) {
        onSuccess(data.id);
      }
    } catch (error) {
      console.error('Erro ao cadastrar serviço:', error);
      const description = (error as any)?.message || "Não foi possível cadastrar o serviço.";
      toast({
        title: "Erro",
        description,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Serviço
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Cadastrar Novo Serviço</DialogTitle>
          <DialogDescription>
            Cadastre atividades médicas, procediementos e exames (ex: Consulta, Ultrassom, Exame de sangue)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Serviço/Exame *</Label>
            <Input
              id="nome"
              ref={nomeRef}
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Ex: Consulta médica, Ultrassom, Exame de sangue"
              required
            />
            <p className="text-xs text-muted-foreground">
              Apenas atividades médicas, estéticas e exames serão aceitos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duracao">Duração (minutos) *</Label>
              <Input
                id="duracao"
                ref={duracaoRef}
                type="number"
                min="1"
                max="480"
                value={formData.duracao_minutos}
                onChange={(e) => setFormData({ ...formData, duracao_minutos: e.target.value })}
                placeholder="30"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco">Preço (R$)</Label>
              <Input
                id="preco"
                type="number"
                step="0.01"
                min="0"
                value={formData.preco}
                onChange={(e) => setFormData({ ...formData, preco: e.target.value })}
                placeholder="150.00"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="confirmacao_24h">Confirmação 24h antes</Label>
                <p className="text-xs text-muted-foreground">
                  Enviar confirmação automática 24h antes
                </p>
              </div>
              <Switch
                id="confirmacao_24h"
                checked={formData.confirmacao_24h}
                onCheckedChange={(checked) => setFormData({ ...formData, confirmacao_24h: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="ativo">Serviço ativo</Label>
                <p className="text-xs text-muted-foreground">
                  Disponível para agendamento
                </p>
              </div>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !hasChanges}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
