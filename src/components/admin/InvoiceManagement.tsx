import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, FileText, AlertCircle, CheckCircle, Calendar } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Fatura {
  id: string;
  tenant_id: string;
  numero_fatura: string;
  mes_referencia: string;
  data_emissao: string;
  data_vencimento: string;
  valor_plano: number;
  valor_excedente: number;
  valor_total: number;
  status: string;
  link_pagamento: string | null;
  pago_em: string | null;
  tenants?: {
    nome: string;
    email: string;
  };
}

interface ItemFatura {
  id: string;
  categoria: string;
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  total: number;
}

export function InvoiceManagement() {
  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFatura, setSelectedFatura] = useState<Fatura | null>(null);
  const [itensFatura, setItensFatura] = useState<ItemFatura[]>([]);

  useEffect(() => {
    loadFaturas();
  }, []);

  const loadFaturas = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("faturas")
        .select("*, tenants(nome, email)")
        .order("data_vencimento", { ascending: false })
        .limit(50);

      if (error) throw error;

      setFaturas(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar faturas:", error);
      toast.error("Erro ao carregar faturas");
    } finally {
      setLoading(false);
    }
  };

  const loadItensFatura = async (faturaId: string) => {
    try {
      const { data, error } = await supabase
        .from("itens_fatura")
        .select("*")
        .eq("fatura_id", faturaId);

      if (error) throw error;

      setItensFatura(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar itens da fatura:", error);
      toast.error("Erro ao carregar itens da fatura");
    }
  };

  const handleViewDetails = async (fatura: Fatura) => {
    setSelectedFatura(fatura);
    await loadItensFatura(fatura.id);
  };

  const handleMarcarPaga = async (faturaId: string) => {
    try {
      const { error } = await supabase
        .from("faturas")
        .update({
          status: "pago",
          pago_em: new Date().toISOString()
        })
        .eq("id", faturaId);

      if (error) throw error;

      // Log na auditoria
      await supabase.from("support_actions_log").insert({
        support_user_id: (await supabase.auth.getUser()).data.user?.id,
        action_type: "fatura_paga",
        target_type: "fatura",
        target_id: faturaId,
        description: "Fatura marcada como paga manualmente"
      });

      toast.success("Fatura marcada como paga!");
      loadFaturas();
    } catch (error: any) {
      console.error("Erro ao marcar fatura como paga:", error);
      toast.error("Erro ao marcar fatura como paga");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pendente: { variant: "outline", icon: AlertCircle, color: "text-yellow-500" },
      pago: { variant: "default", icon: CheckCircle, color: "text-green-500" },
      atrasado: { variant: "destructive", icon: AlertCircle, color: "text-red-500" },
      cancelado: { variant: "secondary", icon: AlertCircle, color: "text-gray-500" }
    };

    const config = variants[status] || variants.pendente;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className={`h-3 w-3 mr-1 ${config.color}`} />
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerenciamento de Faturas
          </CardTitle>
          <CardDescription>Visualize e gerencie todas as faturas dos clientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {faturas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma fatura encontrada
              </div>
            ) : (
              faturas.map((fatura) => (
                <Card key={fatura.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold">{fatura.numero_fatura}</span>
                          {getStatusBadge(fatura.status)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>Cliente: {fatura.tenants?.nome || "N/A"}</div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Vencimento: {new Date(fatura.data_vencimento).toLocaleDateString()}
                          </div>
                          <div className="font-semibold text-foreground">
                            Total: R$ {fatura.valor_total.toFixed(2)}
                            <span className="text-xs text-muted-foreground ml-2">
                              (Plano: R$ {fatura.valor_plano.toFixed(2)} + Excedente: R$ {fatura.valor_excedente.toFixed(2)})
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(fatura)}
                        >
                          Detalhes
                        </Button>
                        {fatura.status === "pendente" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMarcarPaga(fatura.id)}
                          >
                            Marcar Paga
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de detalhes da fatura */}
      {selectedFatura && (
        <Dialog open={!!selectedFatura} onOpenChange={() => setSelectedFatura(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes da Fatura {selectedFatura.numero_fatura}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Cliente</div>
                  <div className="font-semibold">{selectedFatura.tenants?.nome}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div>{getStatusBadge(selectedFatura.status)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Data de Emissão</div>
                  <div>{new Date(selectedFatura.data_emissao).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Vencimento</div>
                  <div>{new Date(selectedFatura.data_vencimento).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Itens da Fatura</h3>
                <div className="space-y-2">
                  {itensFatura.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                      <div>
                        <div className="font-medium">{item.categoria}</div>
                        <div className="text-sm text-muted-foreground">{item.descricao}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.quantidade} x R$ {item.preco_unitario.toFixed(6)}
                        </div>
                      </div>
                      <div className="font-semibold">R$ {item.total.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total</span>
                  <span>R$ {selectedFatura.valor_total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
