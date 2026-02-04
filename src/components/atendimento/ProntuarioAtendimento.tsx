import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, 
  Save, 
  FileCheck, 
  Clock, 
  Activity,
  Stethoscope,
  ClipboardList,
  History
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AtendimentoTimer } from "./AtendimentoTimer";

interface ProntuarioAtendimentoProps {
  agendamento: any;
  onClose: () => void;
}

export function ProntuarioAtendimento({ agendamento, onClose }: ProntuarioAtendimentoProps) {
  const [loading, setLoading] = useState(false);
  const [historicoLoading, setHistoricoLoading] = useState(true);
  const [historico, setHistorico] = useState<any[]>([]);
  const [pacienteInfo, setPacienteInfo] = useState<any>(null);
  const [prontuarioAtual, setProntuarioAtual] = useState<any>(null);
  const [proximoAgendamento, setProximoAgendamento] = useState<Date | undefined>(undefined);
  const [formData, setFormData] = useState({
    // Anamnese (primeira consulta)
    queixa_principal: '',
    historia_doenca_atual: '',
    historia_pregressa: '',
    alergias: [] as string[],
    medicamentos_uso: [] as string[],
    historia_familiar: '',
    historia_social: '',
    
    // SOAP
    subjetivo: '',
    objetivo: '',
    avaliacao: '',
    plano: '',
    
    // Sinais Vitais
    pressao_arterial: '',
    frequencia_cardiaca: '',
    temperatura: '',
    peso: '',
    altura: '',
    saturacao_o2: '',
    
    // Diagnóstico
    cid10_principal: '',
    hipotese_diagnostica: '',
    
    // Observações
    observacoes: '',
    evolucao: '',
  });

  useEffect(() => {
    loadPacienteInfo();
    loadHistorico();
    checkProntuarioExistente();
    loadProximoAgendamento();
  }, [agendamento]);

  const loadPacienteInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('*')
        .eq('id', agendamento.paciente_id)
        .single();

      if (error) throw error;
      setPacienteInfo(data);
    } catch (error: any) {
      console.error('Erro ao carregar dados do paciente:', error);
    }
  };

  const loadProximoAgendamento = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('agenda')
        .select('inicio')
        .eq('profissional_id', user.id)
        .gt('inicio', agendamento.inicio)
        .neq('status', 'cancelado')
        .order('inicio', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (data) {
        setProximoAgendamento(new Date(data.inicio));
      }
    } catch (error: any) {
      console.error('Erro ao carregar próximo agendamento:', error);
    }
  };

  const loadHistorico = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('prontuarios' as any)
        .select('*')
        .eq('paciente_id', agendamento.paciente_id)
        .eq('profissional_id', user.id)
        .order('data_atendimento', { ascending: false });

      if (error) throw error;
      setHistorico(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setHistoricoLoading(false);
    }
  };

  const checkProntuarioExistente = async () => {
    try {
      const { data, error } = await supabase
        .from('prontuarios' as any)
        .select('*')
        .eq('agendamento_id', agendamento.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setProntuarioAtual(data);
        const prontuario = data as any;
        setFormData({
          queixa_principal: prontuario.queixa_principal || '',
          historia_doenca_atual: prontuario.historia_doenca_atual || '',
          historia_pregressa: prontuario.historia_pregressa || '',
          alergias: prontuario.alergias || [],
          medicamentos_uso: prontuario.medicamentos_uso || [],
          historia_familiar: prontuario.historia_familiar || '',
          historia_social: prontuario.historia_social || '',
          subjetivo: prontuario.subjetivo || '',
          objetivo: prontuario.objetivo || '',
          avaliacao: prontuario.avaliacao || '',
          plano: prontuario.plano || '',
          pressao_arterial: prontuario.pressao_arterial || '',
          frequencia_cardiaca: prontuario.frequencia_cardiaca?.toString() || '',
          temperatura: prontuario.temperatura?.toString() || '',
          peso: prontuario.peso?.toString() || '',
          altura: prontuario.altura?.toString() || '',
          saturacao_o2: prontuario.saturacao_o2?.toString() || '',
          cid10_principal: prontuario.cid10_principal || '',
          hipotese_diagnostica: prontuario.hipotese_diagnostica || '',
          observacoes: prontuario.observacoes || '',
          evolucao: prontuario.evolucao || '',
        });
      }
    } catch (error: any) {
      console.error('Erro ao verificar prontuário:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calcularIMC = () => {
    const peso = parseFloat(formData.peso);
    const altura = parseFloat(formData.altura);
    if (peso && altura && altura > 0) {
      return (peso / (altura * altura)).toFixed(2);
    }
    return null;
  };

  const handleSave = async (finalizar: boolean = false) => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile) return;

      const imc = calcularIMC();
      const prontuarioData = {
        tenant_id: profile.tenant_id,
        paciente_id: agendamento.paciente_id,
        profissional_id: user.id,
        agendamento_id: agendamento.id,
        data_atendimento: new Date().toISOString(),
        
        queixa_principal: formData.queixa_principal || null,
        historia_doenca_atual: formData.historia_doenca_atual || null,
        historia_pregressa: formData.historia_pregressa || null,
        alergias: formData.alergias.length > 0 ? formData.alergias : null,
        medicamentos_uso: formData.medicamentos_uso.length > 0 ? formData.medicamentos_uso : null,
        historia_familiar: formData.historia_familiar || null,
        historia_social: formData.historia_social || null,
        
        subjetivo: formData.subjetivo || null,
        objetivo: formData.objetivo || null,
        avaliacao: formData.avaliacao || null,
        plano: formData.plano || null,
        
        pressao_arterial: formData.pressao_arterial || null,
        frequencia_cardiaca: formData.frequencia_cardiaca ? parseInt(formData.frequencia_cardiaca) : null,
        temperatura: formData.temperatura ? parseFloat(formData.temperatura) : null,
        peso: formData.peso ? parseFloat(formData.peso) : null,
        altura: formData.altura ? parseFloat(formData.altura) : null,
        imc: imc ? parseFloat(imc) : null,
        saturacao_o2: formData.saturacao_o2 ? parseInt(formData.saturacao_o2) : null,
        
        cid10_principal: formData.cid10_principal || null,
        hipotese_diagnostica: formData.hipotese_diagnostica || null,
        
        observacoes: formData.observacoes || null,
        evolucao: formData.evolucao || null,
        
        status: finalizar ? 'finalizado' : 'rascunho',
        finalizado_em: finalizar ? new Date().toISOString() : null,
      };

      let result;
      if (prontuarioAtual) {
        result = await supabase
          .from('prontuarios' as any)
          .update(prontuarioData)
          .eq('id', prontuarioAtual.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('prontuarios' as any)
          .insert(prontuarioData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Atualizar status do agendamento
      if (finalizar) {
        await supabase
          .from('agenda')
          .update({ status: 'concluido' })
          .eq('id', agendamento.id);
      } else {
        await supabase
          .from('agenda')
          .update({ status: 'em_atendimento' })
          .eq('id', agendamento.id);
      }

      toast.success(finalizar ? 'Prontuário finalizado com sucesso' : 'Rascunho salvo');
      
      if (finalizar) {
        onClose();
      } else {
        setProntuarioAtual(result.data);
      }
    } catch (error: any) {
      console.error('Erro ao salvar prontuário:', error);
      toast.error('Erro ao salvar prontuário');
    } finally {
      setLoading(false);
    }
  };

  const isPrimeiraConsulta = historico.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{pacienteInfo?.nome}</h2>
            <p className="text-sm text-muted-foreground">
              {format(new Date(agendamento.inicio), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => handleSave(false)}
            disabled={loading}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Rascunho
          </Button>
          <Button 
            onClick={() => handleSave(true)}
            disabled={loading}
          >
            <FileCheck className="h-4 w-4 mr-2" />
            Finalizar Atendimento
          </Button>
        </div>
      </div>

      {/* Temporizador de Atendimento */}
      <AtendimentoTimer 
        inicioAtendimento={new Date(agendamento.inicio)}
        duracaoMinutos={agendamento.servicos?.duracao_minutos || 60}
        proximoAtendimento={proximoAgendamento}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Dados Vitais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Pressão Arterial</Label>
              <Input
                placeholder="120/80"
                value={formData.pressao_arterial}
                onChange={(e) => handleInputChange('pressao_arterial', e.target.value)}
              />
            </div>
            <div>
              <Label>FC (bpm)</Label>
              <Input
                type="number"
                placeholder="72"
                value={formData.frequencia_cardiaca}
                onChange={(e) => handleInputChange('frequencia_cardiaca', e.target.value)}
              />
            </div>
            <div>
              <Label>Temperatura (°C)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="36.5"
                value={formData.temperatura}
                onChange={(e) => handleInputChange('temperatura', e.target.value)}
              />
            </div>
            <div>
              <Label>SpO2 (%)</Label>
              <Input
                type="number"
                placeholder="98"
                value={formData.saturacao_o2}
                onChange={(e) => handleInputChange('saturacao_o2', e.target.value)}
              />
            </div>
            <div>
              <Label>Peso (kg)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="70"
                value={formData.peso}
                onChange={(e) => handleInputChange('peso', e.target.value)}
              />
            </div>
            <div>
              <Label>Altura (m)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="1.75"
                value={formData.altura}
                onChange={(e) => handleInputChange('altura', e.target.value)}
              />
            </div>
            <div>
              <Label>IMC</Label>
              <Input
                value={calcularIMC() || '—'}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue={isPrimeiraConsulta ? "anamnese" : "soap"}>
        <TabsList className="grid w-full grid-cols-3">
          {isPrimeiraConsulta && (
            <TabsTrigger value="anamnese">
              <ClipboardList className="h-4 w-4 mr-2" />
              Anamnese
            </TabsTrigger>
          )}
          <TabsTrigger value="soap">
            <Stethoscope className="h-4 w-4 mr-2" />
            SOAP
          </TabsTrigger>
          <TabsTrigger value="historico">
            <History className="h-4 w-4 mr-2" />
            Histórico ({historico.length})
          </TabsTrigger>
        </TabsList>

        {isPrimeiraConsulta && (
          <TabsContent value="anamnese" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Anamnese - Primeira Consulta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Queixa Principal</Label>
                  <Textarea
                    placeholder="Motivo da consulta..."
                    value={formData.queixa_principal}
                    onChange={(e) => handleInputChange('queixa_principal', e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>História da Doença Atual</Label>
                  <Textarea
                    placeholder="Descreva a evolução dos sintomas..."
                    value={formData.historia_doenca_atual}
                    onChange={(e) => handleInputChange('historia_doenca_atual', e.target.value)}
                    rows={4}
                  />
                </div>
                <div>
                  <Label>História Patológica Pregressa</Label>
                  <Textarea
                    placeholder="Doenças anteriores, cirurgias, internações..."
                    value={formData.historia_pregressa}
                    onChange={(e) => handleInputChange('historia_pregressa', e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Alergias</Label>
                    <Textarea
                      placeholder="Medicamentos, alimentos..."
                      value={formData.alergias.join(', ')}
                      onChange={(e) => handleInputChange('alergias', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Medicamentos em Uso</Label>
                    <Textarea
                      placeholder="Liste os medicamentos atuais..."
                      value={formData.medicamentos_uso.join(', ')}
                      onChange={(e) => handleInputChange('medicamentos_uso', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                      rows={2}
                    />
                  </div>
                </div>
                <div>
                  <Label>História Familiar</Label>
                  <Textarea
                    placeholder="Doenças na família..."
                    value={formData.historia_familiar}
                    onChange={(e) => handleInputChange('historia_familiar', e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>História Social</Label>
                  <Textarea
                    placeholder="Hábitos, profissão, estilo de vida..."
                    value={formData.historia_social}
                    onChange={(e) => handleInputChange('historia_social', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="soap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registro SOAP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>S - Subjetivo</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Queixas e sintomas relatados pelo paciente
                </p>
                <Textarea
                  placeholder="Paciente relata..."
                  value={formData.subjetivo}
                  onChange={(e) => handleInputChange('subjetivo', e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label>O - Objetivo</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Achados do exame físico e dados objetivos
                </p>
                <Textarea
                  placeholder="Ao exame físico..."
                  value={formData.objetivo}
                  onChange={(e) => handleInputChange('objetivo', e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label>A - Avaliação</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Impressão diagnóstica e raciocínio clínico
                </p>
                <Textarea
                  placeholder="Hipótese diagnóstica..."
                  value={formData.avaliacao}
                  onChange={(e) => handleInputChange('avaliacao', e.target.value)}
                  rows={4}
                />
              </div>

              <div>
                <Label>P - Plano</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Conduta terapêutica e orientações
                </p>
                <Textarea
                  placeholder="Prescrições, exames, orientações..."
                  value={formData.plano}
                  onChange={(e) => handleInputChange('plano', e.target.value)}
                  rows={5}
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CID-10 Principal</Label>
                  <Input
                    placeholder="Ex: J00"
                    value={formData.cid10_principal}
                    onChange={(e) => handleInputChange('cid10_principal', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Hipótese Diagnóstica</Label>
                  <Input
                    placeholder="Ex: Rinofaringite aguda"
                    value={formData.hipotese_diagnostica}
                    onChange={(e) => handleInputChange('hipotese_diagnostica', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label>Observações Adicionais</Label>
                <Textarea
                  placeholder="Informações complementares..."
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label>Evolução do Quadro</Label>
                <Textarea
                  placeholder="Evolução desde o último atendimento..."
                  value={formData.evolucao}
                  onChange={(e) => handleInputChange('evolucao', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Atendimentos</CardTitle>
            </CardHeader>
            <CardContent>
              {historicoLoading ? (
                <p className="text-center text-muted-foreground py-8">Carregando histórico...</p>
              ) : historico.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum atendimento anterior registrado
                </p>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {historico.map((registro) => (
                      <Card key={registro.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(new Date(registro.data_atendimento), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                            <Badge variant={registro.status === 'finalizado' ? 'default' : 'secondary'}>
                              {registro.status}
                            </Badge>
                          </div>

                          {registro.subjetivo && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-muted-foreground">Subjetivo:</p>
                              <p className="text-sm">{registro.subjetivo}</p>
                            </div>
                          )}

                          {registro.avaliacao && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-muted-foreground">Avaliação:</p>
                              <p className="text-sm">{registro.avaliacao}</p>
                            </div>
                          )}

                          {registro.plano && (
                            <div className="mb-2">
                              <p className="text-sm font-medium text-muted-foreground">Plano:</p>
                              <p className="text-sm">{registro.plano}</p>
                            </div>
                          )}

                          {registro.cid10_principal && (
                            <div className="mt-3 pt-3 border-t">
                              <Badge variant="outline">
                                CID-10: {registro.cid10_principal}
                                {registro.hipotese_diagnostica && ` - ${registro.hipotese_diagnostica}`}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
