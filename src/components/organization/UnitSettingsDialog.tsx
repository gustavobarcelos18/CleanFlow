import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface UnitSettingsDialogProps {
  unitId: string | null;
  organizationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UnitSettingsDialog({
  unitId,
  organizationId,
  open,
  onOpenChange,
}: UnitSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orgSettings, setOrgSettings] = useState<any>(null);

  const { register, handleSubmit, setValue, watch, reset } = useForm({
    defaultValues: {
      override_horarios: false,
      horarios_customizados: { start: "09:00", end: "18:00", weekend: false },
      override_politica: false,
      politica_customizada: { antecedencia_horas: 24, multa_percentual: 0 },
    },
  });

  const overrideHorarios = watch("override_horarios");
  const overridePolitica = watch("override_politica");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load Org Settings for reference
      const { data: orgData } = await supabase
        .from("org_settings")
        .select("*")
        .eq("organization_id", organizationId)
        .maybeSingle();
      setOrgSettings(orgData || {});

      // Load Unit Settings
      const { data: unitData, error } = await supabase
        .from("unit_settings")
        .select("*")
        .eq("unit_id", unitId)
        .maybeSingle();

      if (error) throw error;

      if (unitData) {
        setValue("override_horarios", unitData.override_horarios || false);
        if (unitData.horarios_customizados)
          setValue(
            "horarios_customizados",
            unitData.horarios_customizados as any,
          );

        setValue("override_politica", unitData.override_politica || false);
        if (unitData.politica_customizada)
          setValue(
            "politica_customizada",
            unitData.politica_customizada as any,
          );
      } else {
        // Create if not exists
        await supabase
          .from("unit_settings")
          .insert({ unit_id: unitId, organization_id: organizationId });
        reset();
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      toast.error("Erro ao carregar configurações.");
    } finally {
      setLoading(false);
    }
  }, [unitId, organizationId, setValue, reset]);

  useEffect(() => {
    if (open && unitId && organizationId) {
      loadData();
    }
  }, [open, unitId, organizationId, loadData]);

  const onSubmit = async (data: any) => {
    if (!unitId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("unit_settings")
        .update({
          override_horarios: data.override_horarios,
          horarios_customizados: data.horarios_customizados,
          override_politica: data.override_politica,
          politica_customizada: data.politica_customizada,
          updated_at: new Date().toISOString(),
        })
        .eq("unit_id", unitId);

      if (error) throw error;
      toast.success("Configurações da unidade salvas!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving unit settings:", error);
      toast.error("Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações da Unidade</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Horários */}
            <div className="space-y-4 border p-4 rounded-md">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Horários de Funcionamento
                </Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={overrideHorarios}
                    onCheckedChange={(c) => setValue("override_horarios", c)}
                  />
                  <span className="text-sm text-muted-foreground">
                    Personalizar
                  </span>
                </div>
              </div>

              {!overrideHorarios && orgSettings && (
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  Herdando da organização: {orgSettings.horarios_padrao?.start}{" "}
                  - {orgSettings.horarios_padrao?.end}
                </div>
              )}

              {overrideHorarios && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>Abertura</Label>
                    <Input
                      type="time"
                      {...register("horarios_customizados.start")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fechamento</Label>
                    <Input
                      type="time"
                      {...register("horarios_customizados.end")}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Política */}
            <div className="space-y-4 border p-4 rounded-md">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Política de Cancelamento
                </Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={overridePolitica}
                    onCheckedChange={(c) => setValue("override_politica", c)}
                  />
                  <span className="text-sm text-muted-foreground">
                    Personalizar
                  </span>
                </div>
              </div>

              {!overridePolitica && orgSettings && (
                <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  Herdando da organização:{" "}
                  {orgSettings.politica_cancelamento?.antecedencia_horas}h
                  antecedência
                </div>
              )}

              {overridePolitica && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label>Antecedência (h)</Label>
                    <Input
                      type="number"
                      {...register("politica_customizada.antecedencia_horas")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Multa (%)</Label>
                    <Input
                      type="number"
                      {...register("politica_customizada.multa_percentual")}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
