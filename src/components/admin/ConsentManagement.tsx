import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Shield, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConsentRecord {
  id: string;
  contact_id: string;
  consent_type: string;
  status: string;
  origin: string;
  term_version: string;
  given_at: string;
  expires_at: string | null;
  revoked_at: string | null;
}

export function ConsentManagement() {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [anonymizePatientId, setAnonymizePatientId] = useState<string | null>(null);

  useEffect(() => {
    loadConsents();
  }, []);

  const loadConsents = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile?.tenant_id) throw new Error('Tenant não encontrado');

      const { data, error } = await supabase
        .from('consent_records' as any)
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('given_at', { ascending: false });

      if (error) throw error;
      setConsents((data as any) || []);
    } catch (error) {
      console.error('Erro ao carregar consentimentos:', error);
      toast.error('Erro ao carregar consentimentos');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymize = async () => {
    if (!anonymizePatientId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile?.tenant_id) throw new Error('Tenant não encontrado');

      const { error } = await supabase.rpc('anonymize_patient_data', {
        p_tenant_id: profile.tenant_id,
        p_patient_id: anonymizePatientId
      });

      if (error) throw error;

      toast.success('Dados anonimizados com sucesso (LGPD)');
      setAnonymizePatientId(null);
      loadConsents();
    } catch (error) {
      console.error('Erro ao anonimizar:', error);
      toast.error('Erro ao anonimizar dados');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'opted_in':
        return <Badge className="bg-success"><CheckCircle className="w-3 h-3 mr-1" />Consentido</Badge>;
      case 'opted_out':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Revogado</Badge>;
      case 'pending':
        return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return <div>Carregando consentimentos...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Gestão de Consentimentos LGPD</CardTitle>
          </div>
          <CardDescription>
            Controle de opt-in/opt-out e trilhas de consentimento por contato
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Versão Termo</TableHead>
                <TableHead>Data Consentimento</TableHead>
                <TableHead>Expira Em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consents.map((consent) => (
                <TableRow key={consent.id}>
                  <TableCell className="font-medium">{consent.consent_type}</TableCell>
                  <TableCell>{getStatusBadge(consent.status)}</TableCell>
                  <TableCell>{consent.origin}</TableCell>
                  <TableCell>{consent.term_version}</TableCell>
                  <TableCell>{new Date(consent.given_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {consent.expires_at 
                      ? new Date(consent.expires_at).toLocaleDateString()
                      : 'Sem expiração'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setAnonymizePatientId(consent.contact_id)}
                    >
                      Anonimizar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={!!anonymizePatientId} onOpenChange={() => setAnonymizePatientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Anonimização (LGPD)</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. Todos os dados pessoais do paciente serão anonimizados
              e os consentimentos serão revogados. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAnonymize}>
              Confirmar Anonimização
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
