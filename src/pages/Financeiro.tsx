import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, CreditCard, TrendingUp, Landmark, QrCode, Receipt } from "lucide-react";
import ContasPix from "@/components/financeiro/ContasPix";
import PlanoSaudeValores from "@/components/financeiro/PlanoSaudeValores";
import ContasReceber from "@/components/financeiro/ContasReceber";
import { MainLayout } from "@/components/layout/MainLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useLayoutTitle } from "@/hooks/useLayoutTitle";
import { useEffect } from "react";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconClass,
  bgClass,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
  iconClass: string;
  bgClass: string;
  isLoading?: boolean;
}) {
  return (
    <div className="relative overflow-hidden bg-muted/30 rounded-xl border border-muted/50 p-5 flex gap-4 items-start shadow-sm hover:bg-muted/50 transition-colors">
      <div className={`shrink-0 rounded-xl p-2.5 ${bgClass}`}>
        <Icon className={`h-5 w-5 ${iconClass}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
        {isLoading ? (
          <Skeleton className="h-7 w-24 mb-1" />
        ) : (
          <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
        )}
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

export default function Financeiro() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["financeiro-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      const tid = profile?.tenant_id;

      const [contasResult, pixResult] = await Promise.all([
        supabase
          .from("contas_receber")
          .select("valor, status")
          .eq("tenant_id", tid)
          .in("status", ["pendente", "atrasado"]),
        supabase
          .from("contas_pix")
          .select("id, ativo")
          .eq("tenant_id", tid)
          .eq("ativo", true),
      ]);

      const totalReceber = (contasResult.data ?? []).reduce(
        (acc, c) => acc + (Number(c.valor) || 0),
        0
      );

      return {
        totalReceber,
        pixCount: pixResult.data?.length ?? 0,
      };
    },
  });

  const { setTitle, setSubtitle } = useLayoutTitle();

  useEffect(() => {
    setTitle("Financeiro");
    setSubtitle("Gerencie pagamentos, planos e contas a receber");
  }, [setTitle, setSubtitle]);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <MainLayout>
      <div className="space-y-7 max-w-[1400px] mx-auto animate-in fade-in duration-500 pb-10">

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            icon={TrendingUp}
            label="A Receber"
            value={statsLoading ? "..." : formatCurrency(stats?.totalReceber ?? 0)}
            sub="Pendente + Atrasado"
            iconClass="text-emerald-500"
            bgClass="bg-emerald-500/10"
            isLoading={statsLoading}
          />
          <StatCard
            icon={CreditCard}
            label="Planos Ativos"
            value={0}
            sub="Com valores cadastrados"
            iconClass="text-sky-500"
            bgClass="bg-sky-500/10"
          />
          <StatCard
            icon={QrCode}
            label="Contas PIX"
            value={statsLoading ? "..." : stats?.pixCount ?? 0}
            sub="Contas ativas cadastradas"
            iconClass="text-violet-500"
            bgClass="bg-violet-500/10"
            isLoading={statsLoading}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="receber" className="space-y-5">
          <TabsList className="h-11 rounded-xl p-1 bg-muted/30 border border-muted/50 gap-1">
            <TabsTrigger
              value="receber"
              className="rounded-lg gap-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground text-sm font-medium"
            >
              <Receipt className="h-4 w-4" />
              Contas a Receber
            </TabsTrigger>
            <TabsTrigger
              value="pix"
              className="rounded-lg gap-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground text-sm font-medium"
            >
              <QrCode className="h-4 w-4" />
              Contas PIX
            </TabsTrigger>
            <TabsTrigger
              value="planos"
              className="rounded-lg gap-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground text-sm font-medium"
            >
              <DollarSign className="h-4 w-4" />
              Valores de Planos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="receber">
            <ContasReceber />
          </TabsContent>

          <TabsContent value="pix">
            <ContasPix />
          </TabsContent>

          <TabsContent value="planos">
            <PlanoSaudeValores />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
