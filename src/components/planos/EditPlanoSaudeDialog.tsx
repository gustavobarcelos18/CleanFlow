import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PencilLine, Info } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface EditPlanoSaudeDialogProps {
  planoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditPlanoSaudeDialog({
  planoId,
  open,
  onOpenChange,
  onSuccess,
}: EditPlanoSaudeDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    observacoes: "",
    ativo: true,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchPlano = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("planos_saude")
        .select("*")
        .eq("id", planoId)
        .single();

      if (error) throw error;

      setFormData({
        nome: data.nome,
        observacoes: data.observacoes || "",
        ativo: data.ativo,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar plano",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [planoId, toast]);

  useEffect(() => {
    if (open && planoId) {
      fetchPlano();
    }
  }, [open, planoId, fetchPlano]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("planos_saude")
        .update({
          nome: formData.nome.trim(),
          observacoes: formData.observacoes.trim() || null,
          ativo: formData.ativo,
        })
        .eq("id", planoId);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["planos-saude"] });

      toast({
        title: "Sucesso!",
        description: "Plano atualizado com sucesso.",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-border/60 bg-card/95 backdrop-blur-md shadow-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <PencilLine className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">Editar Plano de Saúde</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-5">
           <div className="space-y-4 rounded-2xl bg-muted/30 p-4 border border-border/50">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-sm font-semibold ml-1">Nome do Plano *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                required
                className="rounded-xl border-border/50 bg-background h-11 focus-visible:ring-primary shadow-sm"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 ml-1">
                <Label htmlFor="observacoes" className="text-sm font-semibold">Descrição</Label>
                <Info className="h-3 w-3 text-muted-foreground" />
              </div>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                rows={3}
                className="rounded-xl border-border/50 bg-background min-h-[100px] focus-visible:ring-primary resize-none shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-background/50 group transition-colors hover:border-emerald-500/30">
               <div className="space-y-0.5">
                <Label htmlFor="ativo" className="text-sm font-bold cursor-pointer">Plano habilitado</Label>
                <p className="text-[10px] text-muted-foreground">Pacientes poderão ser vinculados a este plano</p>
              </div>
              <Switch
                id="ativo"
                checked={formData.ativo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, ativo: checked })
                }
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-12 rounded-xl border-border/60 font-semibold hover:bg-muted/80"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
