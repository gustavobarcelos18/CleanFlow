import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Professional {
  id: string;
  nome: string;
  email: string;
}

interface CommissionConfig {
  id?: string;
  professional_id: string;
  percentage: number;
  fixed_value: number;
}

export function CommissionSettings() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [configs, setConfigs] = useState<Record<string, CommissionConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch professionals linked to this tenant
      // Assuming we can get profiles with role 'professional' and same tenant
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .eq("role", "professional"); // Filter by tenant_id is handled by RLS usually, but let's be safe if needed

      if (profilesError) throw profilesError;

      // 2. Fetch existing commission configs
      const { data: commissionConfigs, error: configError } = await supabase
        .from("professional_commissions")
        .select("*");

      if (configError) throw configError;

      const configMap: Record<string, CommissionConfig> = {};
      commissionConfigs?.forEach((c: CommissionConfig) => {
        configMap[c.professional_id] = c;
      });

      setProfessionals(profiles || []);
      setConfigs(configMap);
    } catch (error) {
      console.error("Error fetching commission data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as configurações de comissão.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (professionalId: string) => {
    setSaving(true);
    try {
      const config = configs[professionalId];
      if (!config) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get tenant_id from profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const payload = {
        tenant_id: profile.tenant_id,
        professional_id: professionalId,
        percentage: config.percentage || 0,
        fixed_value: config.fixed_value || 0,
      };

      const { error } = await supabase
        .from("professional_commissions")
        .upsert(payload, { onConflict: "tenant_id, professional_id" });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Comissão atualizada com sucesso.",
      });
    } catch (error) {
      console.error("Error saving commission:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a comissão.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    professionalId: string,
    field: "percentage" | "fixed_value",
    value: string,
  ) => {
    const numValue = parseFloat(value) || 0;
    setConfigs((prev) => ({
      ...prev,
      [professionalId]: {
        ...prev[professionalId],
        professional_id: professionalId,
        [field]: numValue,
      },
    }));
  };

  if (loading)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Configuração de Comissões</h3>
      <p className="text-sm text-muted-foreground">
        Defina a porcentagem ou valor fixo que cada profissional recebe por
        atendimento.
      </p>

      <div className="grid gap-4">
        {professionals.map((prof) => (
          <Card
            key={prof.id}
            className="p-4 flex items-center justify-between gap-4"
          >
            <div className="flex-1">
              <p className="font-medium">{prof.nome || prof.email}</p>
              <p className="text-xs text-muted-foreground">{prof.email}</p>
            </div>

            <div className="flex items-end gap-2">
              <div>
                <Label className="text-xs">Porcentagem (%)</Label>
                <Input
                  type="number"
                  className="w-24"
                  value={configs[prof.id]?.percentage ?? ""}
                  onChange={(e) =>
                    handleChange(prof.id, "percentage", e.target.value)
                  }
                  placeholder="0%"
                />
              </div>
              <div>
                <Label className="text-xs">Valor Fixo (R$)</Label>
                <Input
                  type="number"
                  className="w-24"
                  value={configs[prof.id]?.fixed_value ?? ""}
                  onChange={(e) =>
                    handleChange(prof.id, "fixed_value", e.target.value)
                  }
                  placeholder="R$ 0,00"
                />
              </div>
              <Button
                size="sm"
                onClick={() => handleSave(prof.id)}
                disabled={saving}
              >
                Salvar
              </Button>
            </div>
          </Card>
        ))}
        {professionals.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum profissional encontrado nesta clínica.
          </p>
        )}
      </div>
    </div>
  );
}
