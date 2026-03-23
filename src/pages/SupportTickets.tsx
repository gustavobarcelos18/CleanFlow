import React, { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Plus,
  PlusCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Bug,
  Lightbulb,
  DollarSign,
  Search
} from "lucide-react";
import { useLayoutTitle } from "@/hooks/useLayoutTitle";
import { cn } from "@/lib/utils";

interface SupportTicket {
  id: string;
  title: string;
  description: string;
  categoria: string;
  prioridade: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function SupportTickets() {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const { setTitle, setSubtitle } = useLayoutTitle();

  useEffect(() => {
    if (setTitle) setTitle("Suporte Técnico");
    if (setSubtitle) setSubtitle("Abra chamados e acompanhe o atendimento");
  }, [setTitle, setSubtitle]);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets((data as any) || []);
    } catch (error) {
      console.error("Erro ao carregar chamados:", error);
      toast.error("Erro ao carregar chamados");
    } finally {
      setLoading(false);
    }
  }, [profile?.tenant_id]);

  useEffect(() => {
    if (profile?.tenant_id) {
      loadTickets();
    }
  }, [profile?.tenant_id, loadTickets]);

  const handleCreateTicket = async (data: Partial<SupportTicket>) => {
    try {
      const { error } = await supabase.from("support_tickets").insert({
        tenant_id: profile.tenant_id,
        user_id: profile.id,
        title: data.title as string,
        description: data.description as string,
        categoria: data.categoria as any,
        prioridade: data.prioridade as any,
      });

      if (error) throw error;

      toast.success("Chamado aberto com sucesso!");
      loadTickets();
    } catch (error) {
      toast.error("Erro ao abrir chamado");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> =
      {
        aberto: { variant: "default", icon: Clock, label: "Aberto" },
        em_andamento: {
          variant: "secondary",
          icon: MessageSquare,
          label: "Em Andamento",
        },
        aguardando_cliente: {
          variant: "outline",
          icon: AlertCircle,
          label: "Aguardando",
        },
        resolvido: {
          variant: "default",
          icon: CheckCircle2,
          label: "Resolvido",
        },
        fechado: { variant: "secondary", icon: XCircle, label: "Fechado" },
      };

    const config = variants[status] || variants.aberto;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const colors: Record<string, string> = {
      baixa: "bg-gray-100 text-gray-800",
      media: "bg-blue-100 text-blue-800",
      alta: "bg-orange-100 text-orange-800",
      urgente: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={colors[prioridade] || colors.media}>
        {prioridade.toUpperCase()}
      </Badge>
    );
  };

  const getCategoriaIcon = (categoria: string) => {
    const icons: Record<string, any> = {
      tecnico: Bug,
      financeiro: DollarSign,
      duvida: HelpCircle,
      sugestao: Lightbulb,
      bug: AlertCircle,
    };

    const Icon = icons[categoria] || HelpCircle;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-in fade-in duration-500 pb-12">
        {/* Slim Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/30 p-4 md:p-5 rounded-xl border border-border/50 backdrop-blur-md">
           <div className="flex-1 min-w-0 max-w-[560px] flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">Canal de Suporte</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest truncate">Acompanhe seu histórico</p>
              </div>
           </div>

           <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
             <NovoTicketDialog onCreate={handleCreateTicket} />
           </div>
        </div>

        {/* Fallback SR-Only (Acessibilidade) */}
        <p className="sr-only">Abra chamados e acompanhe o atendimento em tempo real</p>

        {/* Lista de Chamados (Grid Híbrida Premium) */}
        <div className={cn(
          "grid gap-6 w-full",
          tickets.length === 1 ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"
        )}>
          {loading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : tickets.length === 0 ? (
            <div className="bg-muted/30 rounded-xl border border-muted/50 py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhum chamado aberto</p>
              <p className="text-sm text-muted-foreground mt-2">
                Clique em "Novo Chamado" para abrir um ticket de suporte
              </p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-card/30 backdrop-blur-sm rounded-xl border border-border/50 p-4 md:p-5 transition-all hover:bg-card/40 hover:border-border group"
              >
                <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center border border-border/50 shrink-0 group-hover:scale-110 transition-transform">
                        {getCategoriaIcon(ticket.categoria)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-50">#{ticket.id.split('-')[0]}</span>
                          {getPrioridadeBadge(ticket.prioridade)}
                        </div>
                        <h3 className="font-bold text-lg text-foreground truncate">{ticket.title}</h3>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-5 line-clamp-2 min-h-[40px] leading-relaxed">
                      {ticket.description}
                    </p>
                    
                    <div className="flex items-center flex-wrap gap-4 pt-4 border-t border-border/20">
                      {getStatusBadge(ticket.status)}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(ticket.created_at).toLocaleDateString("pt-BR", {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" className="shrink-0 w-full md:w-auto h-9 rounded-lg border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors">
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function NovoTicketDialog({
  onCreate,
}: {
  onCreate: (data: Partial<SupportTicket>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoria, setCategoria] = useState("tecnico");
  const [prioridade, setPrioridade] = useState("media");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      title,
      description,
      categoria,
      prioridade,
    });
    setOpen(false);
    setTitle("");
    setDescription("");
    setCategoria("tecnico");
    setPrioridade("media");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto shadow-lg shadow-primary/20 transition-colors bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 px-6 rounded-xl group">
          <PlusCircle className="mr-2 h-4 w-4" /> Novo Chamado
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Abrir Chamado de Suporte</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              placeholder="Descreva resumidamente o problema"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Descrição Detalhada</Label>
            <Textarea
              placeholder="Descreva o problema em detalhes, incluindo passos para reproduzir se aplicável"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnico">
                    <div className="flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      Problema Técnico
                    </div>
                  </SelectItem>
                  <SelectItem value="financeiro">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Financeiro
                    </div>
                  </SelectItem>
                  <SelectItem value="duvida">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Dúvida
                    </div>
                  </SelectItem>
                  <SelectItem value="sugestao">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Sugestão
                    </div>
                  </SelectItem>
                  <SelectItem value="bug">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Bug/Erro
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Dica:</strong> Quanto mais detalhes você fornecer, mais
              rápido conseguiremos resolver seu problema.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">Abrir Chamado</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
