import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard, Banknote, HelpCircle, Activity } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrencyBRL } from "@/lib/currency";

interface CaixaEntry {
  id: string;
  data: string;
  tipo_lancamento: string;
  valor: number;
  descricao: string | null;
  forma_pagamento: string | null;
  paciente_id: string | null;
  profissional_id: string | null;
  conta_pix_id: string | null;
  conta_receber_id: string | null;
  pacientes: { nome: string } | null;
  profiles: { nome: string } | null;
  contas_pix: { nome: string; chave_pix: string } | null;
  contas_receber: {
    valor: number;
    plano_saude_id: string | null;
    planos_saude: { nome: string } | null;
  } | null;
}

export default function CaixaDiario() {
  const [entries, setEntries] = useState<CaixaEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { toast } = useToast();

  const fetchEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

      const { data, error } = await supabase
        .from("caixa_diario")
        .select(`
          *,
          pacientes!caixa_diario_paciente_id_fkey(nome),
          profiles!caixa_diario_profissional_id_fkey(nome),
          contas_pix(nome, chave_pix),
          contas_receber(valor, plano_saude_id, planos_saude(nome))
        `)
        .eq("tenant_id", profile.tenant_id)
        .eq("data", selectedDate)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar caixa",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, toast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const totals = entries.reduce(
    (acc, entry) => {
      const valor = Number(entry.valor) || 0;
      
      if (entry.tipo_lancamento === 'entrada') {
        acc.entrada += valor;

        // Detalhamento por forma de pagamento
        const forma = entry.forma_pagamento || 'Não especificado';
        if (!acc.porForma[forma]) {
          acc.porForma[forma] = 0;
        }
        acc.porForma[forma] += valor;

        // Detalhamento de PIX por conta
        if (forma.toLowerCase().includes('pix') && entry.contas_pix) {
          const contaPix = entry.contas_pix.nome;
          if (!acc.porContaPix[contaPix]) {
            acc.porContaPix[contaPix] = 0;
          }
          acc.porContaPix[contaPix] += valor;
        }
      } else {
        acc.saida += valor;
      }
      return acc;
    },
    { 
      entrada: 0, 
      saida: 0,
      porForma: {} as Record<string, number>,
      porContaPix: {} as Record<string, number>
    }
  );

  const saldo = totals.entrada - totals.saida;

  const getFormaPagamentoIcon = (forma: string | null) => {
    if (!forma) return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    const f = forma.toLowerCase();
    if (f.includes('pix')) return <Activity className="h-4 w-4 text-teal-500" />;
    if (f.includes('cartão') || f.includes('credito') || f.includes('debito')) return <CreditCard className="h-4 w-4 text-blue-500" />;
    if (f.includes('dinheiro')) return <Banknote className="h-4 w-4 text-green-600" />;
    return <Wallet className="h-4 w-4 text-orange-500" />;
  };

  if (isLoading && entries.length === 0) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Carregando movimentações do dia...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-muted/30 pb-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-300 dark:to-gray-600 pr-2 pb-1">
              Caixa Diário
            </h1>
            <p className="text-muted-foreground font-medium">
              Visão financeira e conciliação do dia
            </p>
          </div>
          <div className="flex flex-col space-y-1.5 w-full md:w-64">
            <Label htmlFor="data" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selecionar Data</Label>
            <Input
              id="data"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-11 shadow-sm font-medium"
            />
          </div>
        </div>

        {/* Massive Typographic Hero */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-3 border-none bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:to-black text-white shadow-xl overflow-hidden relative">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className={`absolute top-0 right-0 w-64 h-64 ${saldo >= 0 ? 'bg-emerald-500' : 'bg-rose-500'} rounded-full blur-[100px] opacity-20 -mr-20 -mt-20 transform-gpu`}></div>
            
            <CardContent className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2 text-center md:text-left w-full md:w-auto">
                <p className="text-sm font-medium text-slate-300 uppercase letter-spacing-widest flex items-center justify-center md:justify-start gap-2">
                  <DollarSign className="h-4 w-4" />
                  Saldo do Dia
                </p>
                <div className={`text-5xl md:text-7xl font-black tracking-tighter ${saldo >= 0 ? 'text-white' : 'text-rose-400'}`}>
                  R$ {formatCurrencyBRL(saldo).replace("R$", "").trim()}
                </div>
              </div>
              
              <div className="flex gap-6 w-full md:w-auto justify-center md:justify-end">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 w-40 text-center">
                  <p className="text-xs text-emerald-300 font-semibold mb-1 flex items-center justify-center gap-1.5"><TrendingUp className="h-3 w-3" /> ENTRADAS</p>
                  <p className="text-xl font-bold">{formatCurrencyBRL(totals.entrada)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 w-40 text-center">
                  <p className="text-xs text-rose-300 font-semibold mb-1 flex items-center justify-center gap-1.5"><TrendingDown className="h-3 w-3" /> SAÍDAS</p>
                  <p className="text-xl font-bold">{formatCurrencyBRL(totals.saida)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Detalhamento por Forma de Pagamento */}
          {Object.keys(totals.porForma).length > 0 && (
            <Card className="bg-muted/30 border-muted/50 rounded-xl shadow-sm transition-colors hover:bg-muted/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Por Forma de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(totals.porForma).map(([forma, valor]) => (
                    <div key={forma} className="bg-muted/30 p-4 rounded-xl border border-muted/50 transition-colors hover:bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        {getFormaPagamentoIcon(forma)}
                        <p className="text-xs font-semibold text-muted-foreground uppercase">{forma}</p>
                      </div>
                      <p className="text-xl font-bold text-foreground">{formatCurrencyBRL(valor)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detalhamento PIX por Conta */}
          {Object.keys(totals.porContaPix).length > 0 && (
            <Card className="bg-muted/30 border-muted/50 rounded-xl shadow-sm transition-colors hover:bg-muted/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  Recebimentos PIX por Conta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(totals.porContaPix).map(([conta, valor]) => (
                    <div key={conta} className="flex justify-between items-center p-4 bg-muted/30 border border-muted/50 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="bg-teal-100 dark:bg-teal-900/40 p-2 rounded-lg">
                          <Activity className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <span className="font-semibold">{conta}</span>
                      </div>
                      <span className="text-lg font-bold">{formatCurrencyBRL(valor)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="bg-muted/30 border-muted/50 rounded-xl shadow-sm transition-colors overflow-hidden">
          <CardHeader className="bg-muted/20 border-b border-muted/50 pb-4">
            <CardTitle className="text-lg">Extrato de Movimentações</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
               <div className="flex items-center justify-center py-12">
                 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
               </div>
            ) : entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Banknote className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Nenhuma movimentação</h3>
                <p className="text-muted-foreground text-sm max-w-sm mt-1">
                  Não houve registros financeiros para a data selecionada ({format(parseISO(selectedDate), "dd 'de' MMMM", { locale: ptBR })}).
                </p>
              </div>
            ) : (
              <div className="divide-y divide-muted/50">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-6 hover:bg-muted/10 transition-colors gap-4"
                  >
                    <div className="flex gap-4">
                      <div className="hidden sm:flex mt-1">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${entry.tipo_lancamento === 'entrada' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30'}`}>
                          {entry.tipo_lancamento === 'entrada' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-base">
                          {entry.descricao || 'Movimentação sem descrição'}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                          {entry.pacientes?.nome && (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></span>
                              Paciente: <strong className="font-medium text-foreground">{entry.pacientes.nome}</strong>
                            </span>
                          )}
                          {entry.profiles?.nome && (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></span>
                              Profissional: <strong className="font-medium text-foreground">{entry.profiles.nome}</strong>
                            </span>
                          )}
                          {entry.forma_pagamento && (
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></span>
                              <span className="flex items-center gap-1 opacity-80">{getFormaPagamentoIcon(entry.forma_pagamento)}</span>
                              <strong className="font-medium text-foreground capitalize">{entry.forma_pagamento}</strong>
                            </span>
                          )}
                          {entry.contas_pix && (
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></span>
                              PIX: <strong className="font-medium text-foreground">{entry.contas_pix.nome}</strong>
                            </span>
                          )}
                          {entry.contas_receber?.planos_saude && (
                            <span className="flex items-center gap-1 text-primary">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/40"></span>
                              Plano: <strong className="font-medium">{entry.contas_receber.planos_saude.nome}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 mt-3 sm:mt-0">
                       <span className={`text-xl font-bold tracking-tight ${
                        entry.tipo_lancamento === 'entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {entry.tipo_lancamento === 'entrada' ? '+' : '-'} {formatCurrencyBRL(entry.valor)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
