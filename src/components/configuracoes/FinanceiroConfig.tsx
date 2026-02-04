import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CommissionSettings } from "@/components/financial/CommissionSettings";

interface FormaPagamento {
  id: string;
  nome: string;
  tipo: string;
  ativo: boolean;
  ordem: number;
}

export default function FinanceiroConfig() {
  const queryClient = useQueryClient();

  const { data: formas, isLoading } = useQuery({
    queryKey: ["formas-pagamento-config"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      const { data, error } = await supabase
        .from("formas_pagamento")
        .select("*")
        .eq("tenant_id", profile?.tenant_id)
        .order("ordem");

      if (error) throw error;
      return data as FormaPagamento[];
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("formas_pagamento")
        .update({ ativo })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formas-pagamento-config"] });
      toast.success("Forma de pagamento atualizada!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar forma de pagamento");
      console.error(error);
    }
  });

  const tipoLabels: Record<string, string> = {
    dinheiro: "Dinheiro",
    pix: "PIX",
    cartao_debito: "Cartão de Débito",
    cartao_credito: "Cartão de Crédito",
    plano_saude: "Plano de Saúde",
    outro: "Outro"
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Formas de Pagamento</CardTitle>
          <CardDescription>
            Ative ou desative as formas de pagamento aceitas pela clínica
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {formas?.map((forma) => (
                <div key={forma.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label className="text-base font-medium">{forma.nome}</Label>
                    <p className="text-sm text-muted-foreground">
                      {tipoLabels[forma.tipo]}
                    </p>
                  </div>
                  <Switch
                    checked={forma.ativo}
                    onCheckedChange={(checked) => toggleMutation.mutate({ id: forma.id, ativo: checked })}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CommissionSettings />
    </div>
  );
}
