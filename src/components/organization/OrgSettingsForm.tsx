import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

interface OrgSettingsFormProps {
  organizationId: string;
}

export function OrgSettingsForm({ organizationId }: OrgSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      horarios_padrao: {
        start: "09:00",
        end: "18:00",
        weekend: false,
      },
      politica_cancelamento: {
        antecedencia_horas: 24,
        multa_percentual: 0,
      },
    },
  });

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("org_settings")
        .select("*")
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        if (data.horarios_padrao)
          setValue("horarios_padrao", data.horarios_padrao as any);
        if (data.politica_cancelamento)
          setValue("politica_cancelamento", data.politica_cancelamento as any);
      } else {
        // Create default settings if not exists
        const { error: insertError } = await supabase
          .from("org_settings")
          .insert({ organization_id: organizationId });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("Error loading org settings:", error);
      toast.error("Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }, [organizationId, setValue]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const onSubmit = async (data: any) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("org_settings")
        .update({
          horarios_padrao: data.horarios_padrao,
          politica_cancelamento: data.politica_cancelamento,
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", organizationId);

      if (error) throw error;
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving org settings:", error);
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Horários de Funcionamento Padrão</CardTitle>
          <CardDescription>
            Estes horários serão aplicados a todas as novas unidades por padrão.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Abertura</Label>
              <Input type="time" {...register("horarios_padrao.start")} />
            </div>
            <div className="space-y-2">
              <Label>Fechamento</Label>
              <Input type="time" {...register("horarios_padrao.end")} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="weekend"
              checked={watch("horarios_padrao.weekend")}
              onCheckedChange={(checked) =>
                setValue("horarios_padrao.weekend", checked)
              }
            />
            <Label htmlFor="weekend">Funciona aos finais de semana?</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Política de Cancelamento</CardTitle>
          <CardDescription>
            Regras para cancelamento de agendamentos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Antecedência Mínima (horas)</Label>
              <Input
                type="number"
                {...register("politica_cancelamento.antecedencia_horas")}
              />
            </div>
            <div className="space-y-2">
              <Label>Multa por Cancelamento Tardio (%)</Label>
              <Input
                type="number"
                {...register("politica_cancelamento.multa_percentual")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Salvar Configurações Globais
        </Button>
      </div>
    </form>
  );
}
