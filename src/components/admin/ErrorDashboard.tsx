import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ErrorMetric {
  id: string;
  timestamp: string;
  status_code: number;
  endpoint: string;
  method: string;
  error_message: string | null;
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16'];

export const ErrorDashboard = () => {
  const [errors, setErrors] = useState<ErrorMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadErrors();
    
    // Refresh a cada 30 segundos
    const interval = setInterval(loadErrors, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadErrors = async () => {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { data, error } = await supabase
        .from('error_metrics')
        .select('*')
        .gte('timestamp', oneDayAgo.toISOString())
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) throw error;
      setErrors(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar métricas de erros",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const errorsByStatusCode = errors.reduce((acc, err) => {
    const key = `${err.status_code}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusCodeData = Object.entries(errorsByStatusCode).map(([code, count]) => ({
    name: code,
    value: count,
  }));

  const errorsByEndpoint = errors.reduce((acc, err) => {
    const key = `${err.method} ${err.endpoint}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const endpointData = Object.entries(errorsByEndpoint)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([endpoint, count]) => ({
      endpoint,
      count,
    }));

  const error4xxCount = errors.filter(e => e.status_code >= 400 && e.status_code < 500).length;
  const error5xxCount = errors.filter(e => e.status_code >= 500).length;

  if (loading) {
    return <div className="p-4">Carregando dashboard de erros...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard de Erros</h2>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Erros (24h)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errors.length}</div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros 4xx</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{error4xxCount}</div>
            <p className="text-xs text-muted-foreground">Erros do cliente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros 5xx</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{error5xxCount}</div>
            <p className="text-xs text-muted-foreground">Erros do servidor</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="codes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="codes">Por Código</TabsTrigger>
          <TabsTrigger value="endpoints">Por Endpoint</TabsTrigger>
        </TabsList>

        <TabsContent value="codes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Código de Status</CardTitle>
              <CardDescription>Erros HTTP nas últimas 24 horas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusCodeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusCodeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Endpoints com Erros</CardTitle>
              <CardDescription>Endpoints mais problemáticos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={endpointData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="endpoint" type="category" width={200} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ef4444" name="Erros" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
