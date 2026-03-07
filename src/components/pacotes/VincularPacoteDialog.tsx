import React, { useState, useEffect, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Package } from "lucide-react";

interface VincularPacoteDialogProps {
  pacienteId: string;
  pacienteNome: string;
  onSuccess?: () => void;
}

export function VincularPacoteDialog({
  pacienteId,
  pacienteNome,
  onSuccess,
}: VincularPacoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pacotes, setPacotes] = useState<any[]>([]);
  const [pacoteSelecionado, setPacoteSelecionado] = useState<any>(null);
  const [renovacaoAutomatica, setRenovacaoAutomatica] = useState(false);

  const { toast } = useToast();

  const fetchPacotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pacotes")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setPacotes(data || []);
    } catch (error) {
      console.error("Erro ao buscar pacotes:", error);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchPacotes();
    }
  }, [open, fetchPacotes]);

  const handlePacoteChange = (pacoteId: string) => {
    const pacote = pacotes.find((p) => p.id === pacoteId);
    setPacoteSelecionado(pacote);
    if (pacote) {
      setRenovacaoAutomatica(pacote.renovacao_automatica);
    }
  };

  const handleSubmit = async () => {
    if (!pacoteSelecionado) {
      toast({
        title: "Selecione um pacote",
        description: "Por favor, selecione um pacote para vincular.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

      // Calcular data de validade
      const dataValidade = new Date();
      dataValidade.setDate(
        dataValidade.getDate() + pacoteSelecionado.validade_dias,
      );

      const { error } = await supabase.from("pacientes_pacotes").insert([
        {
          tenant_id: profile.tenant_id,
          paciente_id: pacienteId,
          pacote_id: pacoteSelecionado.id,
          sessoes_restantes: pacoteSelecionado.numero_sessoes,
          sessoes_total: pacoteSelecionado.numero_sessoes,
          data_compra: new Date().toISOString(),
          data_validade: dataValidade.toISOString(),
          renovacao_automatica: renovacaoAutomatica,
          valor_pago: pacoteSelecionado.preco,
          status: "ativo",
        },
      ]);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `Pacote "${pacoteSelecionado.nome}" vinculado a ${pacienteNome}.`,
      });

      setOpen(false);
      setPacoteSelecionado(null);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Erro ao vincular pacote:", error);
      toast({
        title: "Erro",
        description: "Não foi possível vincular o pacote ao paciente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Package className="h-4 w-4 mr-2" />
          Vincular Pacote
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Vincular Pacote de Tratamento</DialogTitle>
          <DialogDescription>
            Vincule um pacote de sessões para {pacienteNome}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pacote">Selecione o Pacote</Label>
            <Select
              value={pacoteSelecionado?.id || ""}
              onValueChange={handlePacoteChange}
            >
              <SelectTrigger id="pacote">
                <SelectValue placeholder="Escolha um pacote" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {pacotes.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Nenhum pacote disponível
                  </div>
                ) : (
                  pacotes.map((pacote) => (
                    <SelectItem key={pacote.id} value={pacote.id}>
                      {pacote.nome} - {pacote.numero_sessoes} sessões - R${" "}
                      {pacote.preco.toFixed(2)}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {pacoteSelecionado && (
            <>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-medium">Detalhes do Pacote</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Sessões:</p>
                    <p className="font-medium">
                      {pacoteSelecionado.numero_sessoes}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor:</p>
                    <p className="font-medium">
                      R$ {pacoteSelecionado.preco.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Validade:</p>
                    <p className="font-medium">
                      {pacoteSelecionado.validade_dias} dias
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor/Sessão:</p>
                    <p className="font-medium">
                      R${" "}
                      {(
                        pacoteSelecionado.preco /
                        pacoteSelecionado.numero_sessoes
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="renovacao">Renovação Automática</Label>
                  <p className="text-xs text-muted-foreground">
                    Renovar automaticamente ao expirar
                  </p>
                </div>
                <Switch
                  id="renovacao"
                  checked={renovacaoAutomatica}
                  onCheckedChange={setRenovacaoAutomatica}
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !pacoteSelecionado}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Vincular Pacote
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
