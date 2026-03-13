import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Receipt, FileX } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContaReceber {
  id: string;
  valor: number;
  data_vencimento: string;
  data_recebimento: string | null;
  valor_recebido: number | null;
  status: string;
  numero_guia: string | null;
  pacientes: { nome: string };
  planos_saude: { nome: string } | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pendente: {
    label: "Pendente",
    className: "border-amber-400/50 bg-amber-400/10 text-amber-600 dark:text-amber-400",
  },
  recebido: {
    label: "Recebido",
    className: "border-emerald-400/50 bg-emerald-400/10 text-emerald-600 dark:text-emerald-400",
  },
  atrasado: {
    label: "Atrasado",
    className: "border-red-400/50 bg-red-400/10 text-red-600 dark:text-red-400",
  },
  cancelado: {
    label: "Cancelado",
    className: "border-border/60 bg-muted/60 text-muted-foreground",
  },
};

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 7 }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function ContasReceber() {
  const { data: contas, isLoading } = useQuery({
    queryKey: ["contas-receber"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();

      const { data, error } = await supabase
        .from("contas_receber")
        .select(`
          *,
          pacientes:paciente_id(nome),
          planos_saude:plano_saude_id(nome)
        `)
        .eq("tenant_id", profile?.tenant_id)
        .order("data_vencimento", { ascending: true })
        .limit(50);

      if (error) throw error;
      return data as ContaReceber[];
    },
  });

  const formatBRL = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Card className="bg-muted/30 border-muted/50 rounded-xl shadow-sm transition-colors hover:bg-muted/50">
      <CardHeader className="pb-4 border-b border-muted/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Receipt className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <CardTitle className="text-base font-semibold">Contas a Receber</CardTitle>
            <CardDescription className="text-sm mt-0.5">
              Controle de valores a receber de planos de saúde e cartões
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="pl-6 font-semibold text-xs uppercase tracking-wider">Paciente</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Plano / Origem</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Valor</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Vencimento</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Recebimento</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider">Nº Guia</TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <SkeletonRows />
              ) : contas?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <div className="p-4 rounded-xl bg-muted/50 border border-muted/50">
                        <FileX className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Nenhuma conta a receber</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          As contas aparecerão aqui quando forem criadas.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                contas?.map((conta) => {
                  const config = statusConfig[conta.status] ?? statusConfig.cancelado;
                  return (
                    <TableRow key={conta.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="pl-6 font-semibold text-sm">{conta.pacientes.nome}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {conta.planos_saude?.nome ?? "Cartão / Particular"}
                      </TableCell>
                      <TableCell className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatBRL(conta.valor)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(conta.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {conta.data_recebimento
                          ? format(new Date(conta.data_recebimento), "dd/MM/yyyy", { locale: ptBR })
                          : <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {conta.numero_guia ?? <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell className="pr-6">
                        <Badge
                          variant="outline"
                          className={cn("text-[11px] font-semibold rounded-full px-2.5 py-0.5", config.className)}
                        >
                          {config.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
