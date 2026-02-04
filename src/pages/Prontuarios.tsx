import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Search, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Prontuarios() {
  const [prontuarios, setProntuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadProntuarios();
  }, []);

  const loadProntuarios = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id, role')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      let query = supabase
        .from('prontuarios' as any)
        .select(`
          *,
          pacientes(nome, telefone),
          profiles(nome)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('data_atendimento', { ascending: false });

      // Profissionais veem apenas seus próprios prontuários
      if (profile.role === 'profissional') {
        query = query.eq('profissional_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProntuarios(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar prontuários:', error);
      toast.error('Erro ao carregar prontuários');
    } finally {
      setLoading(false);
    }
  };

  const filteredProntuarios = prontuarios.filter(p =>
    p.pacientes?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.profiles?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      rascunho: "secondary",
      finalizado: "default",
      assinado: "default"
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Prontuários Eletrônicos</h1>
            <p className="text-muted-foreground">
              Gerenciamento de prontuários médicos (SOAP)
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Prontuário
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buscar Prontuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por paciente ou profissional..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </CardContent>
          </Card>
        ) : filteredProntuarios.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum prontuário encontrado</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredProntuarios.map((prontuario) => (
              <Card key={prontuario.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {prontuario.pacientes?.nome}
                        </h3>
                        {getStatusBadge(prontuario.status)}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          <strong>Profissional:</strong> Dr(a). {prontuario.profiles?.nome}
                        </p>
                        <p>
                          <strong>Data do Atendimento:</strong>{' '}
                          {new Date(prontuario.data_atendimento).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {prontuario.cid10_principal && (
                          <p>
                            <strong>CID-10:</strong> {prontuario.cid10_principal}
                          </p>
                        )}
                      </div>
                      {prontuario.avaliacao && (
                        <p className="mt-3 text-sm line-clamp-2">
                          <strong>Avaliação:</strong> {prontuario.avaliacao}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      Visualizar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
