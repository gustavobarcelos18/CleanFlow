import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, DollarSign, TrendingUp, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Preco {
  id: string;
  categoria: string;
  preco_unitario: number;
  moeda: string;
  vigencia_inicio: string;
  vigencia_fim: string | null;
  ativo: boolean;
  notas: string | null;
}

interface FXRate {
  id: string;
  moeda_origem: string;
  moeda_destino: string;
  taxa: number;
  data_cotacao: string;
  fonte: string;
  override_manual: boolean;
  ativo: boolean;
}

export function PriceManagement() {
  const [precos, setPrecos] = useState<Preco[]>([]);
  const [fxRates, setFxRates] = useState<FXRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrice, setEditingPrice] = useState<Preco | null>(null);
  const [editingFX, setEditingFX] = useState<FXRate | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const [precosRes, fxRes] = await Promise.all([
        supabase.from("precos_atual").select("*").order("categoria"),
        supabase
          .from("fx_rates")
          .select("*")
          .eq("ativo", true)
          .order("data_cotacao", { ascending: false }),
      ]);

      if (precosRes.error) throw precosRes.error;
      if (fxRes.error) throw fxRes.error;

      setPrecos(precosRes.data || []);
      setFxRates(fxRes.data || []);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados de preços");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSavePrice = async (priceData: any) => {
    try {
      const { error } = editingPrice
        ? await supabase
            .from("precos_atual")
            .update(priceData)
            .eq("id", editingPrice.id)
        : await supabase.from("precos_atual").insert([priceData]);

      if (error) throw error;

      // Log na auditoria
      await supabase.from("support_actions_log").insert({
        support_user_id: (await supabase.auth.getUser()).data.user?.id,
        action_type: editingPrice ? "preco_atualizado" : "preco_criado",
        target_type: "preco",
        target_id: editingPrice?.id,
        description: `${editingPrice ? "Atualizado" : "Criado"} preço para categoria ${priceData.categoria}`,
        metadata: { priceData },
      });

      toast.success(
        `Preço ${editingPrice ? "atualizado" : "criado"} com sucesso!`,
      );
      setEditingPrice(null);
      loadData();
    } catch (error: any) {
      console.error("Erro ao salvar preço:", error);
      toast.error("Erro ao salvar preço");
    }
  };

  const handleSaveFX = async (fxData: any) => {
    try {
      const { error } = editingFX
        ? await supabase.from("fx_rates").update(fxData).eq("id", editingFX.id)
        : await supabase.from("fx_rates").insert([fxData]);

      if (error) throw error;

      // Log na auditoria
      await supabase.from("support_actions_log").insert({
        support_user_id: (await supabase.auth.getUser()).data.user?.id,
        action_type: "fx_atualizado",
        target_type: "fx_rate",
        target_id: editingFX?.id,
        description: `${editingFX ? "Atualizada" : "Criada"} taxa FX ${fxData.moeda_origem}/${fxData.moeda_destino}`,
        metadata: { fxData },
      });

      toast.success(
        `Taxa FX ${editingFX ? "atualizada" : "criada"} com sucesso!`,
      );
      setEditingFX(null);
      loadData();
    } catch (error: any) {
      console.error("Erro ao salvar FX:", error);
      toast.error("Erro ao salvar taxa FX");
    }
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
      {/* Preços por Categoria */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Preços por Categoria
              </CardTitle>
              <CardDescription>
                Gerencie os preços unitários por categoria de serviço
              </CardDescription>
            </div>
            <PriceDialog onSave={handleSavePrice} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {precos.map((preco) => (
              <Card key={preco.id} className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant={preco.ativo ? "default" : "secondary"}>
                      {preco.categoria}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPrice(preco)}
                    >
                      Editar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {preco.moeda} {preco.preco_unitario.toFixed(6)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Vigência:{" "}
                      {new Date(preco.vigencia_inicio).toLocaleDateString()}
                      {preco.vigencia_fim &&
                        ` até ${new Date(preco.vigencia_fim).toLocaleDateString()}`}
                    </div>
                    {preco.notas && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {preco.notas}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Taxas de Câmbio (FX) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Taxas de Câmbio (FX)
              </CardTitle>
              <CardDescription>
                Configure as taxas de conversão de moedas
              </CardDescription>
            </div>
            <FXDialog onSave={handleSaveFX} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {fxRates.map((fx) => (
              <div
                key={fx.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-semibold">
                    {fx.moeda_origem} → {fx.moeda_destino}
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {fx.taxa.toFixed(6)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(fx.data_cotacao).toLocaleString()} • {fx.fonte}
                    {fx.override_manual && (
                      <Badge className="ml-2" variant="outline">
                        Manual
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingFX(fx)}
                >
                  Editar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs de edição */}
      {editingPrice && (
        <PriceDialog
          price={editingPrice}
          onSave={handleSavePrice}
          onClose={() => setEditingPrice(null)}
        />
      )}
      {editingFX && (
        <FXDialog
          fx={editingFX}
          onSave={handleSaveFX}
          onClose={() => setEditingFX(null)}
        />
      )}
    </div>
  );
}

// Componente de diálogo para preços
function PriceDialog({ price, onSave, onClose }: any) {
  const [formData, setFormData] = useState(
    price || {
      categoria: "marketing",
      preco_unitario: 0,
      moeda: "BRL",
      vigencia_inicio: new Date().toISOString().split("T")[0],
      vigencia_fim: null,
      ativo: true,
      notas: "",
    },
  );
  const [open, setOpen] = useState(!!price);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    if (onClose) onClose();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o && onClose) onClose();
      }}
    >
      <DialogTrigger asChild>
        <Button>Novo Preço</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{price ? "Editar" : "Novo"} Preço</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Categoria</Label>
            <Select
              value={formData.categoria}
              onValueChange={(v) => setFormData({ ...formData, categoria: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="utility">Utility</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="conversation">Conversation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Preço Unitário</Label>
            <Input
              type="number"
              step="0.000001"
              value={formData.preco_unitario}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  preco_unitario: parseFloat(e.target.value),
                })
              }
            />
          </div>
          <div>
            <Label>Moeda</Label>
            <Select
              value={formData.moeda}
              onValueChange={(v) => setFormData({ ...formData, moeda: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">BRL</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notas || ""}
              onChange={(e) =>
                setFormData({ ...formData, notas: e.target.value })
              }
            />
          </div>
          <Button type="submit" className="w-full">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Componente de diálogo para FX
function FXDialog({ fx, onSave, onClose }: any) {
  const [formData, setFormData] = useState(
    fx || {
      moeda_origem: "USD",
      moeda_destino: "BRL",
      taxa: 0,
      fonte: "manual",
      override_manual: true,
      ativo: true,
    },
  );
  const [open, setOpen] = useState(!!fx);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    if (onClose) onClose();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o && onClose) onClose();
      }}
    >
      <DialogTrigger asChild>
        <Button>Nova Taxa FX</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fx ? "Editar" : "Nova"} Taxa FX</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Moeda Origem</Label>
              <Input
                value={formData.moeda_origem}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    moeda_origem: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>
            <div>
              <Label>Moeda Destino</Label>
              <Input
                value={formData.moeda_destino}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    moeda_destino: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>
          </div>
          <div>
            <Label>Taxa</Label>
            <Input
              type="number"
              step="0.000001"
              value={formData.taxa}
              onChange={(e) =>
                setFormData({ ...formData, taxa: parseFloat(e.target.value) })
              }
            />
          </div>
          <div>
            <Label>Fonte</Label>
            <Input
              value={formData.fonte}
              onChange={(e) =>
                setFormData({ ...formData, fonte: e.target.value })
              }
            />
          </div>
          <Button type="submit" className="w-full">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
