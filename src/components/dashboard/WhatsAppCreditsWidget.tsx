import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, TrendingUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const WhatsAppCreditsWidget = () => {
  const [credits, setCredits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadCredits = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) return;

      const { data, error } = await supabase
        .from("tenant_whatsapp_credits")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setCredits(data);
    } catch (error: any) {
      console.error("Erro ao carregar créditos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Créditos WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const saldoCreditos = credits?.saldo_creditos || 0;
  const creditosConsumidos = credits?.creditos_consumidos || 0;
  const limiarAlerta = credits?.limiar_alerta || 100;

  const percentualUsado =
    creditosConsumidos > 0
      ? (
          (creditosConsumidos / (creditosConsumidos + saldoCreditos)) *
          100
        ).toFixed(1)
      : "0";

  const status =
    saldoCreditos <= 0
      ? "critical"
      : saldoCreditos <= limiarAlerta
        ? "warning"
        : "good";

  const statusConfig = {
    good: { color: "bg-green-500", text: "Saldo Bom", icon: TrendingUp },
    warning: { color: "bg-yellow-500", text: "Saldo Baixo", icon: AlertCircle },
    critical: { color: "bg-red-500", text: "Sem Créditos", icon: AlertCircle },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Créditos WhatsApp
          </div>
          <Badge variant={status === "good" ? "default" : "destructive"}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.text}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Saldo Disponível
            </span>
            <span className="text-2xl font-bold">
              {saldoCreditos.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Consumidos no Mês</span>
            <span className="font-medium">
              {creditosConsumidos.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Taxa de Uso</span>
            <span className="font-medium">{percentualUsado}%</span>
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${config.color}`}
            style={{ width: `${Math.min(100, parseFloat(percentualUsado))}%` }}
          />
        </div>

        <Button
          onClick={() => navigate("/configuracoes-whatsapp")}
          className="w-full"
          variant={status === "critical" ? "destructive" : "default"}
        >
          {status === "critical"
            ? "Comprar Créditos Agora"
            : "Gerenciar Créditos"}
        </Button>
      </CardContent>
    </Card>
  );
};
