import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Clock, CheckCircle, TrendingUp } from "lucide-react";

interface ConversationMetrics {
  total_conversas: number;
  taxa_resposta: number;
  tempo_medio_resposta: number;
  taxa_resolucao: number;
  conversas_ativas: number;
  conversas_pendentes: number;
}

export function WhatsAppMetricsDashboard() {
  const [metrics, setMetrics] = useState<ConversationMetrics>({
    total_conversas: 0,
    taxa_resposta: 0,
    tempo_medio_resposta: 0,
    taxa_resolucao: 0,
    conversas_ativas: 0,
    conversas_pendentes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) return;

      // Total de conversas
      const { count: totalConversas } = await supabase
        .from("whatsapp_conversations")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", profile.tenant_id);

      // Conversas ativas
      const { count: conversasAtivas } = await supabase
        .from("whatsapp_conversations")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", profile.tenant_id)
        .eq("status", "em_atendimento");

      // Conversas pendentes
      const { count: conversasPendentes } = await supabase
        .from("whatsapp_conversations")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", profile.tenant_id)
        .eq("status", "aguardando");

      // Conversas resolvidas
      const { count: conversasResolvidas } = await supabase
        .from("whatsapp_conversations")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", profile.tenant_id)
        .eq("status", "resolvido");

      // Calcular métricas
      const taxaResolucao = totalConversas > 0 
        ? ((conversasResolvidas || 0) / totalConversas) * 100 
        : 0;

      const taxaResposta = totalConversas > 0
        ? (((conversasAtivas || 0) + (conversasResolvidas || 0)) / totalConversas) * 100
        : 0;

      setMetrics({
        total_conversas: totalConversas || 0,
        taxa_resposta: Math.round(taxaResposta),
        tempo_medio_resposta: 15, // Placeholder - calcular real
        taxa_resolucao: Math.round(taxaResolucao),
        conversas_ativas: conversasAtivas || 0,
        conversas_pendentes: conversasPendentes || 0,
      });
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando métricas...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Conversas</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.total_conversas}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.conversas_pendentes} aguardando resposta
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Resposta</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.taxa_resposta}%</div>
          <p className="text-xs text-muted-foreground">
            {metrics.conversas_ativas} conversas ativas
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.tempo_medio_resposta}min</div>
          <p className="text-xs text-muted-foreground">
            Tempo de primeira resposta
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.taxa_resolucao}%</div>
          <p className="text-xs text-muted-foreground">
            Conversas finalizadas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
