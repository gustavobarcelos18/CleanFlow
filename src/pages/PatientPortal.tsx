import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Clock, Video, LogOut, Plus } from "lucide-react";
import { toast } from "sonner";
import { AgendamentoOnline } from "@/components/patient/AgendamentoOnline";

export default function PatientPortal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paciente, setPaciente] = useState<any>(null);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [prontuarios, setProntuarios] = useState<any[]>([]);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/patient-login');
        return;
      }

      // Buscar dados do paciente
      const { data: pacienteUsuario } = await supabase
        .from('paciente_usuarios' as any)
        .select('*, pacientes(*)')
        .eq('auth_user_id', user.id)
        .single();

      if (!pacienteUsuario) {
        toast.error('Paciente não encontrado');
        navigate('/patient-login');
        return;
      }

      setPaciente((pacienteUsuario as any).pacientes);

      // Buscar agendamentos futuros
      const { data: agendamentosData } = await supabase
        .from('agenda')
        .select('*, procedimentos:servico_id(nome), profiles(nome)')
        .eq('paciente_id', (pacienteUsuario as any).paciente_id)
        .gte('inicio', new Date().toISOString())
        .order('inicio', { ascending: true })
        .limit(10);

      setAgendamentos(agendamentosData || []);

      // Buscar documentos
      const { data: documentosData } = await supabase
        .from('paciente_documentos' as any)
        .select('*')
        .eq('paciente_id', (pacienteUsuario as any).paciente_id)
        .eq('visivel_paciente', true)
        .order('created_at', { ascending: false })
        .limit(10);

      setDocumentos(documentosData || []);

      // Buscar prontuários finalizados
      const { data: prontuariosData } = await supabase
        .from('prontuarios' as any)
        .select('*, profiles(nome)')
        .eq('paciente_id', (pacienteUsuario as any).paciente_id)
        .in('status', ['finalizado', 'assinado'])
        .order('data_atendimento', { ascending: false })
        .limit(10);

      setProntuarios(prontuariosData || []);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/patient-login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Portal do Paciente</h1>
            <p className="text-sm text-muted-foreground">
              Bem-vindo(a), {paciente?.nome}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="novo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </TabsTrigger>
            <TabsTrigger value="agendamentos">
              <Calendar className="h-4 w-4 mr-2" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="documentos">
              <FileText className="h-4 w-4 mr-2" />
              Documentos
            </TabsTrigger>
            <TabsTrigger value="historico">
              <Clock className="h-4 w-4 mr-2" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="videoconsulta">
              <Video className="h-4 w-4 mr-2" />
              Videoconsulta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="novo" className="space-y-4">
            <AgendamentoOnline
              pacienteId={paciente?.id}
              tenantId={paciente?.tenant_id}
            />
          </TabsContent>

          <TabsContent value="agendamentos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Próximas Consultas</CardTitle>
              </CardHeader>
              <CardContent>
                {agendamentos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma consulta agendada
                  </p>
                ) : (
                  <div className="space-y-4">
                    {agendamentos.map((agendamento) => (
                      <div
                        key={agendamento.id}
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{agendamento.servicos?.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            Dr(a). {agendamento.profiles?.nome}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(agendamento.inicio).toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {agendamento.confirmado ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Confirmado
                            </span>
                          ) : (
                            <Button size="sm" variant="outline">
                              Confirmar
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meus Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                {documentos.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum documento disponível
                  </p>
                ) : (
                  <div className="space-y-4">
                    {documentos.map((documento) => (
                      <div
                        key={documento.id}
                        className="border rounded-lg p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{documento.titulo}</p>
                          <p className="text-sm text-muted-foreground">
                            {documento.tipo.charAt(0).toUpperCase() + documento.tipo.slice(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(documento.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          Visualizar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="historico" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Consultas</CardTitle>
              </CardHeader>
              <CardContent>
                {prontuarios.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum histórico disponível
                  </p>
                ) : (
                  <div className="space-y-4">
                    {prontuarios.map((prontuario) => (
                      <div
                        key={prontuario.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">
                            Dr(a). {prontuario.profiles?.nome}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(prontuario.data_atendimento).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        {prontuario.avaliacao && (
                          <p className="text-sm text-muted-foreground mb-2">
                            <strong>Avaliação:</strong> {prontuario.avaliacao}
                          </p>
                        )}
                        {prontuario.plano && (
                          <p className="text-sm text-muted-foreground">
                            <strong>Plano:</strong> {prontuario.plano}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videoconsulta" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Videoconsultas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma videoconsulta disponível no momento
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
