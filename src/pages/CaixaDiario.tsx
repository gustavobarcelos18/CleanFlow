import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard, Banknote, 
  HelpCircle, Activity, Search, Filter, ArrowUpCircle, ArrowDownCircle, Plus, 
  ShoppingBag, ClipboardList, User, Users, Calendar as CalendarIcon 
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useLayoutTitle } from "@/hooks/useLayoutTitle";
import { format, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrencyBRL, parseCurrencyToNumber } from "@/lib/currency";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { PatientCombobox } from "@/components/schedule/PatientCombobox";
import { ProfessionalCombobox } from "@/components/schedule/ProfessionalCombobox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"todos" | "entrada" | "saida">("todos");
  
  // Novo Lançamento State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    tipo_lancamento: "entrada" as "entrada" | "saida",
    valor: "",
    descricao: "",
    data: new Date(),
    forma_pagamento: "",
    paciente_id: "",
    profissional_id: "",
  });

  // Data for Form
  const [formasPagamento, setFormasPagamento] = useState<any[]>([]);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const { toast } = useToast();
  const { setTitle, setSubtitle } = useLayoutTitle();

  useEffect(() => {
    setTitle("Caixa Diário");
    setSubtitle("Visão financeira e conciliação do dia");
  }, [setTitle, setSubtitle]);

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

  const fetchFormData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) return;

      const [formasRes, pacientesRes, profissionaisRes] = await Promise.all([
        supabase
          .from("formas_pagamento")
          .select("id, nome")
          .eq("tenant_id", profile.tenant_id)
          .eq("ativo", true)
          .order("ordem"),
        supabase
          .from("pacientes")
          .select("id, nome, telefone")
          .eq("tenant_id", profile.tenant_id)
          .order("nome"),
        supabase
          .from("profiles")
          .select("id, nome, role")
          .eq("tenant_id", profile.tenant_id)
          .in("role", ["profissional", "admin", "professional", "manager"])
          .order("nome"),
      ]);

      setFormasPagamento(formasRes.data || []);
      setPacientes(pacientesRes.data || []);
      setProfissionais(profissionaisRes.data || []);
    } catch (error) {
      console.error("Erro ao buscar dados do formulário:", error);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchFormData();
  }, [fetchEntries, fetchFormData]);

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tipo_lancamento || !formData.valor || !formData.descricao) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o tipo, valor e descrição.",
        variant: "destructive",
      });
      return;
    }

    const valorNum = parseCurrencyToNumber(formData.valor);
    if (valorNum <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id, organization_id")
        .eq("id", user.id)
        .single();

      if (!profile?.tenant_id) throw new Error("Tenant não encontrado");

      const { error } = await supabase.from("caixa_diario").insert({
        tenant_id: profile.tenant_id,
        organization_id: profile.organization_id,
        unit_id: null,
        data: format(formData.data, 'yyyy-MM-dd'),
        tipo_lancamento: formData.tipo_lancamento,
        valor: valorNum,
        descricao: formData.descricao,
        forma_pagamento: formData.forma_pagamento || null,
        paciente_id: formData.paciente_id || null,
        profissional_id: formData.profissional_id || null,
        created_by: user.id
      });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Lançamento registrado com sucesso.",
      });

      setIsAddOpen(false);
      setFormData({
        tipo_lancamento: "entrada",
        valor: "",
        descricao: "",
        data: new Date(selectedDate + 'T12:00:00'),
        forma_pagamento: "",
        paciente_id: "",
        profissional_id: "",
      });
      fetchEntries();
    } catch (error: any) {
      console.error("Erro ao salvar lançamento:", error);
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = !searchTerm || 
      (entry.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       entry.pacientes?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       entry.profiles?.nome?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === "todos" || entry.tipo_lancamento === filterType;
    
    return matchesSearch && matchesType;
  });

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
      <div className="flex flex-col min-h-[calc(100vh-140px)] space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-6">
        {/* Compact Header Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card/30 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg hidden sm:block">
              <ShoppingBag className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-black tracking-tight flex items-center gap-2 text-foreground/90 uppercase">
                Caixa Diário
                <span className="text-muted-foreground font-normal">/</span>
                <span className="text-primary">{format(parseISO(selectedDate), "dd MMM yyyy", { locale: ptBR })}</span>
              </h1>
            </div>
            <div className="ml-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 w-40 text-xs font-bold uppercase shadow-none border-primary/20 bg-background/50 focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar no extrato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm bg-background/50 border-border/50 focus:border-primary/50 transition-all"
              />
            </div>
            
            <Tabs 
              value={filterType} 
              onValueChange={(v) => setFilterType(v as any)}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-3 h-9 bg-background/50 border border-border/50 p-1">
                <TabsTrigger 
                  value="todos" 
                  className="text-[10px] font-bold uppercase transition-all duration-200 hover:bg-cyan-500/10 hover:border-cyan-400/30 data-[state=active]:bg-cyan-500/10 data-[state=active]:border-cyan-400/40 data-[state=active]:text-cyan-300 data-[state=active]:ring-1 data-[state=active]:ring-cyan-400/20"
                >
                  Todos
                </TabsTrigger>
                <TabsTrigger 
                  value="entrada" 
                  className="text-[10px] font-bold uppercase transition-all duration-200 hover:bg-cyan-500/10 hover:border-cyan-400/30 data-[state=active]:bg-cyan-500/10 data-[state=active]:border-cyan-400/40 data-[state=active]:text-cyan-300 data-[state=active]:ring-1 data-[state=active]:ring-cyan-400/20"
                >
                  Entradas
                </TabsTrigger>
                <TabsTrigger 
                  value="saida" 
                  className="text-[10px] font-bold uppercase transition-all duration-200 hover:bg-cyan-500/10 hover:border-cyan-400/30 data-[state=active]:bg-cyan-500/10 data-[state=active]:border-cyan-400/40 data-[state=active]:text-cyan-300 data-[state=active]:ring-1 data-[state=active]:ring-cyan-400/20"
                >
                  Saídas
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button 
              onClick={() => {
                setFormData(prev => ({ 
                  ...prev, 
                  data: new Date(selectedDate + 'T12:00:00'),
                  tipo_lancamento: filterType === "saida" ? "saida" : "entrada"
                }));
                setIsAddOpen(true);
              }}
              className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground gap-2 text-xs font-bold uppercase tracking-widest hidden sm:flex"
            >
              <Plus className="h-4 w-4" />
              Novo Lançamento
            </Button>
          </div>
        </div>

        {/* High Density KPI Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className={cn(
            "border-none shadow-lg overflow-hidden relative transition-all duration-300 hover:translate-y-[-2px]",
            saldo >= 0 
              ? "bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-900/80 dark:to-teal-950/80" 
              : "bg-gradient-to-br from-rose-600 to-red-700 dark:from-rose-900/80 dark:to-red-950/80"
          )}>
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            <CardContent className="p-5 flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">Saldo Disponível</p>
                <h3 className="text-2xl font-black text-white tracking-tighter">
                  {formatCurrencyBRL(saldo)}
                </h3>
              </div>
              <div className="bg-white/20 p-2.5 rounded-xl border border-white/20 backdrop-blur-sm">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 shadow-md hover:shadow-lg hover:border-emerald-500/30 transition-all duration-300 hover:translate-y-[-2px]">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total Entradas</p>
                <h3 className="text-2xl font-black text-emerald-500 tracking-tighter">
                  {formatCurrencyBRL(totals.entrada)}
                </h3>
              </div>
              <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/10">
                <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 shadow-md hover:shadow-lg hover:border-rose-500/30 transition-all duration-300 hover:translate-y-[-2px]">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Total Saídas</p>
                <h3 className="text-2xl font-black text-rose-500 tracking-tighter">
                  {formatCurrencyBRL(totals.saida)}
                </h3>
              </div>
              <div className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/10">
                <ArrowDownCircle className="h-5 w-5 text-rose-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50 shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px]">
            <CardContent className="p-5 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Movimentações</p>
                <h3 className="text-2xl font-black text-foreground tracking-tighter">
                  {entries.length} <span className="text-[10px] text-muted-foreground ml-1">itens</span>
                </h3>
              </div>
              <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Detalhamento por Forma de Pagamento */}
          {Object.keys(totals.porForma).length > 0 && (
            <Card className="bg-muted/30 border-muted/50 rounded-xl shadow-sm transition-colors hover:bg-muted/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-foreground/80">
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
                <CardTitle className="text-lg flex items-center gap-2 text-foreground/80">
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

        {/* Extrato Detail occupying remaining space */}
        <Card className="flex-1 min-h-[400px] bg-card/30 border-border/50 rounded-xl shadow-lg transition-all overflow-hidden flex flex-col">
          <div className="sticky top-0 z-20 bg-muted/20 backdrop-blur-md border-b border-border/50 px-5 py-4 flex items-center justify-between">
            <CardTitle className="text-base font-black uppercase tracking-widest flex items-center gap-2 text-foreground/90">
              <ClipboardList className="h-4 w-4 text-primary" />
              Extrato de Movimentações
            </CardTitle>
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest border-primary/30 text-primary">
              {filteredEntries.length} itens encontrados
            </Badge>
          </div>
          <CardContent className="p-0 flex-1 flex flex-col">
            {isLoading ? (
               <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-4">
                 <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
                 <p className="text-xs font-bold text-muted-foreground uppercase animate-pulse">Consultando base de dados...</p>
               </div>
            ) : filteredEntries.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center space-y-6">
                <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center relative">
                  <Banknote className="h-10 w-10 text-muted-foreground/30" />
                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border border-border">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-black tracking-tight text-foreground uppercase">Tudo limpo por aqui</h3>
                  <p className="text-muted-foreground text-sm font-black uppercase tracking-wider max-w-xs mx-auto">
                    {filterType === "todos" 
                      ? `Não encontramos movimentações para ${searchTerm ? `"${searchTerm}"` : 'esta data'}.`
                      : filterType === "entrada"
                        ? "Nenhuma entrada encontrada para este dia."
                        : "Nenhuma saída encontrada para este dia."
                    }
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      data: new Date(selectedDate + 'T12:00:00'), 
                      tipo_lancamento: filterType === "saida" ? "saida" : "entrada" 
                    }));
                    setIsAddOpen(true);
                  }}
                  variant="outline" 
                  className="h-10 px-8 rounded-xl border-dashed border-2 border-primary/30 hover:bg-primary/5 hover:border-primary transition-all gap-2 text-xs font-bold uppercase tracking-widest"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Lançamento
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:px-6 md:py-4 hover:bg-primary/5 transition-all duration-300 gap-4 group"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="hidden sm:flex shrink-0">
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 ${entry.tipo_lancamento === 'entrada' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm shadow-emerald-500/10' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-sm shadow-rose-500/10'}`}>
                          {entry.tipo_lancamento === 'entrada' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-foreground text-sm uppercase tracking-tight group-hover:text-primary transition-colors truncate max-w-[250px] md:max-w-md">
                          {entry.descricao || 'Movimentação sem descrição'}
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-muted-foreground font-bold uppercase tracking-wider overflow-hidden">
                          {entry.pacientes?.nome && (
                            <span className="flex items-center gap-1 shrink-0">
                              <User className="h-3 w-3 opacity-50" />
                              <span className="text-foreground/80">{entry.pacientes.nome}</span>
                            </span>
                          )}
                          {entry.profiles?.nome && (
                            <span className="flex items-center gap-1 shrink-0">
                              <Users className="h-3 w-3 opacity-50" />
                              <span className="text-foreground/80">{entry.profiles.nome}</span>
                            </span>
                          )}
                          {entry.forma_pagamento && (
                            <span className="flex items-center gap-1.5 shrink-0">
                              {getFormaPagamentoIcon(entry.forma_pagamento)}
                              <span className="text-foreground/80">{entry.forma_pagamento}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-border/30 sm:border-t-0 pt-3 sm:pt-0 mt-0">
                       <span className={`text-xl font-black tracking-tighter ${
                        entry.tipo_lancamento === 'entrada' ? 'text-emerald-500' : 'text-rose-500'
                      }`}>
                        {entry.tipo_lancamento === 'entrada' ? '+' : '-'} {formatCurrencyBRL(entry.valor).replace("R$", "").trim()}
                        <span className="text-[10px] ml-1 font-bold">BRL</span>
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 hidden sm:block">
                        {entry.tipo_lancamento === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card/95 backdrop-blur-md border-border/50 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Plus className={cn("h-5 w-5", formData.tipo_lancamento === 'entrada' ? "text-emerald-500" : "text-rose-500")} />
              Novo Lançamento
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              Registre uma nova movimentação financeira no caixa.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEntry} className="space-y-6 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo</Label>
                <Select 
                  value={formData.tipo_lancamento} 
                  onValueChange={(v: any) => setFormData(prev => ({ ...prev, tipo_lancamento: v }))}
                >
                  <SelectTrigger className="bg-background/50 border-border/50 h-11">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada" className="text-emerald-500 font-bold">Entrada</SelectItem>
                    <SelectItem value="saida" className="text-rose-500 font-bold">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="valor"
                    placeholder="0,00"
                    value={formData.valor}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      const formattedValue = (Number(value) / 100).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });
                      setFormData(prev => ({ ...prev, valor: formattedValue }));
                    }}
                    className="pl-9 bg-background/50 border-border/50 h-11 font-black text-lg tracking-tight"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição</Label>
              <Input
                id="descricao"
                placeholder="Ex: Pagamento consulta, Material de limpeza..."
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                className="bg-background/50 border-border/50 h-11"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-3 lg:gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Data</Label>
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "relative w-full justify-start text-left font-normal bg-background/50 border-border/50 h-11 min-w-0 overflow-hidden whitespace-nowrap sm:whitespace-normal md:whitespace-nowrap"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left min-w-0 overflow-hidden">
                        {formData.data ? (
                          <>
                            <span className="hidden sm:inline">
                              {format(formData.data, "PPP", { locale: ptBR })}
                            </span>
                            <span className="sm:hidden">
                              {format(formData.data, "dd/MM/yyyy")}
                            </span>
                          </>
                        ) : (
                          "Selecione uma data"
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.data}
                      onSelect={(date) => {
                        if (date) {
                          setFormData(prev => ({ ...prev, data: date }));
                          setDatePopoverOpen(false);
                        }
                      }}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pagamento</Label>
                <Select 
                  value={formData.forma_pagamento} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, forma_pagamento: v }))}
                >
                  <SelectTrigger className="bg-background/50 border-border/50 h-11">
                    <SelectValue placeholder="Opcional" />
                  </SelectTrigger>
                  <SelectContent>
                    {formasPagamento.map(forma => (
                      <SelectItem key={forma.id} value={forma.nome}>{forma.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Paciente (Opcional)</Label>
                <PatientCombobox 
                  value={formData.paciente_id}
                  onValueChange={(id) => setFormData(prev => ({ ...prev, paciente_id: id }))}
                  patients={pacientes}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Profissional (Opcional)</Label>
                <ProfessionalCombobox
                  value={formData.profissional_id}
                  onValueChange={(id) => setFormData(prev => ({ ...prev, profissional_id: id }))}
                  professionals={profissionais}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-border/30 gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsAddOpen(false)}
                className="font-bold uppercase tracking-widest text-[10px]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className={cn(
                  "font-black uppercase tracking-widest text-[10px] px-8 h-11",
                  formData.tipo_lancamento === 'entrada' ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
                )}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Confirmar Lançamento"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
