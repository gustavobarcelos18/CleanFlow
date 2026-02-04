import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  const fetchEntries = async () => {
    try {
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
  };

  useEffect(() => {
    fetchEntries();
  }, [selectedDate]);

  const totals = entries.reduce(
    (acc, entry) => {
      if (entry.tipo_lancamento === 'entrada') {
        acc.entrada += entry.valor;

        // Detalhamento por forma de pagamento
        const forma = entry.forma_pagamento || 'Não especificado';
        if (!acc.porForma[forma]) {
          acc.porForma[forma] = 0;
        }
        acc.porForma[forma] += entry.valor;

        // Detalhamento de PIX por conta
        if (forma.toLowerCase().includes('pix') && entry.contas_pix) {
          const contaPix = entry.contas_pix.nome;
          if (!acc.porContaPix[contaPix]) {
            acc.porContaPix[contaPix] = 0;
          }
          acc.porContaPix[contaPix] += entry.valor;
        }
      } else {
        acc.saida += entry.valor;
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Caixa Diário</h1>
            <p className="text-muted-foreground">
              Controle financeiro diário da clínica
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="data">Data</Label>
          <Input
            id="data"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-48"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entradas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {totals.entrada.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saídas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                R$ {totals.saida.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <DollarSign className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                R$ {saldo.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalhamento por Forma de Pagamento */}
        {Object.keys(totals.porForma).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento por Forma de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(totals.porForma).map(([forma, valor]) => (
                  <div key={forma} className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{forma}</p>
                    <p className="text-2xl font-bold">R$ {valor.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Detalhamento PIX por Conta */}
        {Object.keys(totals.porContaPix).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recebimentos PIX por Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(totals.porContaPix).map(([conta, valor]) => (
                  <div key={conta} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                    <span className="font-medium">{conta}</span>
                    <span className="text-lg font-bold">R$ {valor.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma movimentação registrada nesta data
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{entry.descricao || 'Sem descrição'}</div>
                      <div className="text-sm text-muted-foreground space-y-0.5">
                        {entry.pacientes?.nome && <div>Paciente: {entry.pacientes.nome}</div>}
                        {entry.profiles?.nome && <div>Profissional: {entry.profiles.nome}</div>}
                        {entry.forma_pagamento && <div>Pagamento: {entry.forma_pagamento}</div>}
                        {entry.contas_pix && (
                          <div>Conta PIX: {entry.contas_pix.nome}</div>
                        )}
                        {entry.contas_receber?.planos_saude && (
                          <div>Plano: {entry.contas_receber.planos_saude.nome} (A receber)</div>
                        )}
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${
                      entry.tipo_lancamento === 'entrada' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {entry.tipo_lancamento === 'entrada' ? '+' : '-'} R$ {entry.valor.toFixed(2)}
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
