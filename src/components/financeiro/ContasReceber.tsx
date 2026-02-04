import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
    }
  });

  const statusLabels: Record<string, string> = {
    pendente: "Pendente",
    recebido: "Recebido",
    atrasado: "Atrasado",
    cancelado: "Cancelado"
  };

  const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    pendente: "outline",
    recebido: "default",
    atrasado: "destructive",
    cancelado: "secondary"
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contas a Receber</CardTitle>
        <CardDescription>
          Controle de valores a receber de planos de saúde e cartões
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Carregando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Plano/Origem</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Recebimento</TableHead>
                <TableHead>Nº Guia</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contas?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Nenhuma conta a receber cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                contas?.map((conta) => (
                  <TableRow key={conta.id}>
                    <TableCell className="font-medium">{conta.pacientes.nome}</TableCell>
                    <TableCell>{conta.planos_saude?.nome || "Cartão"}</TableCell>
                    <TableCell>R$ {conta.valor.toFixed(2)}</TableCell>
                    <TableCell>
                      {format(new Date(conta.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      {conta.data_recebimento
                        ? format(new Date(conta.data_recebimento), "dd/MM/yyyy", { locale: ptBR })
                        : "-"}
                    </TableCell>
                    <TableCell>{conta.numero_guia || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[conta.status]}>
                        {statusLabels[conta.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
