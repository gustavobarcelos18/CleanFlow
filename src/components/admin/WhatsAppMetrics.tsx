import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Send,
  TrendingUp,
  Activity,
} from "lucide-react";
import { toast } from "sonner";

interface WhatsAppMetric {
  id: string;
  tenant_id: string;
  periodo: string;
  mensagens_enviadas: number;
  mensagens_entregues: number;
  mensagens_lidas: number;
  mensagens_falhadas: number;
  erros_rede: number;
  erros_template: number;
  erros_numero_invalido: number;
  erros_bloqueio: number;
  erros_outros: number;
  latencia_p50: number;
  latencia_p95: number;
  latencia_p99: number;
  tps_medio: number;
  tps_pico: number;
  quality_rating: "green" | "yellow" | "red" | "unknown";
  optout_rate: number;
  block_rate: number;
}

export function WhatsAppMetrics() {
  const [metrics, setMetrics] = useState<WhatsAppMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMetrics, setCurrentMetrics] = useState<WhatsAppMetric | null>(
    null,
  );

  const loadMetrics = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_metrics" as any)
        .select("*")
        .order("periodo", { ascending: false })
        .limit(24); // Últimas 24 horas

      if (error) throw error;

      setMetrics((data as any) || []);
      if (data && data.length > 0) {
        setCurrentMetrics(data[0] as any);
      }
    } catch (error: any) {
      console.error("Error loading metrics:", error);
      toast.error("Erro ao carregar métricas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [loadMetrics]);

  const getQualityBadge = (rating: string) => {
    const variants = {
      green: "default",
      yellow: "secondary",
      red: "destructive",
      unknown: "outline",
    };

    return (
      <Badge variant={variants[rating as keyof typeof variants] as any}>
        {rating.toUpperCase()}
      </Badge>
    );
  };

  const calculateErrorRate = (metric: WhatsAppMetric) => {
    if (!metric.mensagens_enviadas) return 0;
    return (
      (metric.mensagens_falhadas / metric.mensagens_enviadas) *
      100
    ).toFixed(2);
  };

  const calculateDeliveryRate = (metric: WhatsAppMetric) => {
    if (!metric.mensagens_enviadas) return 0;
    return (
      (metric.mensagens_entregues / metric.mensagens_enviadas) *
      100
    ).toFixed(2);
  };

  if (loading) {
    return <div>Carregando métricas...</div>;
  }

  if (!currentMetrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métricas WhatsApp</CardTitle>
          <CardDescription>Nenhuma métrica disponível</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mensagens Enviadas
            </CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentMetrics.mensagens_enviadas}
            </div>
            <p className="text-xs text-muted-foreground">
              TPS médio: {currentMetrics.tps_medio.toFixed(2)}/s
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Entrega
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateDeliveryRate(currentMetrics)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMetrics.mensagens_entregues} entregues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {calculateErrorRate(currentMetrics)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMetrics.mensagens_falhadas} falhas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quality Rating
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getQualityBadge(currentMetrics.quality_rating)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Opt-out: {(currentMetrics.optout_rate * 100).toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Latência */}
      <Card>
        <CardHeader>
          <CardTitle>Latência (Webhooks/Entrega)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">P50</span>
              </div>
              <div className="text-2xl font-bold">
                {currentMetrics.latencia_p50}ms
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">P95</span>
              </div>
              <div className="text-2xl font-bold">
                {currentMetrics.latencia_p95}ms
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">P99</span>
              </div>
              <div className="text-2xl font-bold">
                {currentMetrics.latencia_p99}ms
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Erros por categoria */}
      <Card>
        <CardHeader>
          <CardTitle>Erros por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Erro de Rede</span>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 bg-red-500 rounded"
                  style={{
                    width: `${(currentMetrics.erros_rede / currentMetrics.mensagens_falhadas || 0) * 100}px`,
                  }}
                ></div>
                <span className="text-sm font-medium">
                  {currentMetrics.erros_rede}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Template Rejeitado</span>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 bg-red-500 rounded"
                  style={{
                    width: `${(currentMetrics.erros_template / currentMetrics.mensagens_falhadas || 0) * 100}px`,
                  }}
                ></div>
                <span className="text-sm font-medium">
                  {currentMetrics.erros_template}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Número Inválido</span>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 bg-red-500 rounded"
                  style={{
                    width: `${(currentMetrics.erros_numero_invalido / currentMetrics.mensagens_falhadas || 0) * 100}px`,
                  }}
                ></div>
                <span className="text-sm font-medium">
                  {currentMetrics.erros_numero_invalido}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Bloqueio</span>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 bg-red-500 rounded"
                  style={{
                    width: `${(currentMetrics.erros_bloqueio / currentMetrics.mensagens_falhadas || 0) * 100}px`,
                  }}
                ></div>
                <span className="text-sm font-medium">
                  {currentMetrics.erros_bloqueio}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Outros</span>
              <div className="flex items-center gap-2">
                <div
                  className="h-2 bg-red-500 rounded"
                  style={{
                    width: `${(currentMetrics.erros_outros / currentMetrics.mensagens_falhadas || 0) * 100}px`,
                  }}
                ></div>
                <span className="text-sm font-medium">
                  {currentMetrics.erros_outros}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
