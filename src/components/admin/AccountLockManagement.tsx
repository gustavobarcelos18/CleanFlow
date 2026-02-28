import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface AccountLock {
  id: string;
  email: string;
  locked_at: string;
  locked_until: string;
  reason: string;
  failed_attempts: number;
  alert_sent: boolean;
}

export const AccountLockManagement = () => {
  const [locks, setLocks] = useState<AccountLock[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadLocks();
  }, []);

  const loadLocks = async () => {
    try {
      const { data, error } = await supabase
        .from("account_locks")
        .select("*")
        .order("locked_at", { ascending: false });

      if (error) throw error;
      setLocks(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar bloqueios",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (email: string) => {
    try {
      const { error } = await supabase
        .from("account_locks")
        .delete()
        .eq("email", email);

      if (error) throw error;

      toast({
        title: "Conta desbloqueada",
        description: `A conta ${email} foi desbloqueada com sucesso`,
      });

      loadLocks();
    } catch (error: any) {
      toast({
        title: "Erro ao desbloquear conta",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isLocked = (lockedUntil: string) => {
    return new Date(lockedUntil) > new Date();
  };

  if (loading) {
    return <div className="p-4">Carregando bloqueios...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          <CardTitle>Gerenciamento de Bloqueios</CardTitle>
        </div>
        <CardDescription>
          Contas bloqueadas por tentativas de login falhadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {locks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Nenhuma conta bloqueada
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Tentativas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bloqueado até</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locks.map((lock) => (
                <TableRow key={lock.id}>
                  <TableCell className="font-medium">{lock.email}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">
                      {lock.failed_attempts} falhas
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isLocked(lock.locked_until) ? (
                      <Badge variant="destructive">
                        <Lock className="h-3 w-3 mr-1" />
                        Bloqueado
                      </Badge>
                    ) : (
                      <Badge variant="outline">Expirado</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(lock.locked_until).toLocaleString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {lock.reason}
                  </TableCell>
                  <TableCell>
                    {isLocked(lock.locked_until) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Unlock className="h-4 w-4 mr-1" />
                            Desbloquear
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Desbloquear conta
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja desbloquear a conta{" "}
                              {lock.email}? O usuário poderá tentar fazer login
                              novamente.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleUnlock(lock.email)}
                            >
                              Desbloquear
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
