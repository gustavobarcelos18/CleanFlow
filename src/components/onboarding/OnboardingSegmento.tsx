import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Calendar,
  Package,
  CreditCard,
  MessageSquare,
  Stethoscope,
  Sparkles,
  Dog,
  Scissors,
  GraduationCap,
  Wrench,
  Users,
  MapPin,
  Truck,
  Layers,
  Eye,
  Menu,
  ToggleLeft,
  AlertCircle,
  Loader2,
  Scale
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingSegmentoProps {
  onComplete?: () => void;
  onBack?: () => void;
}

interface SegmentPreview {
  segmento: string;
  features: Array<{
    recurso: string;
    descricao: string;
    categoria: string;
    habilitado: boolean;
  }>;
  menu: Array<{
    chave: string;
    label: string;
    icone: string;
    rota: string;
  }>;
  total_features: number;
}

const SEGMENTOS = [
  { codigo: 'saude', nome: 'Saúde', icone: Stethoscope, descricao: 'Clínicas, consultórios médicos' },
  { codigo: 'estetica', nome: 'Estética & Beleza', icone: Sparkles, descricao: 'Estúdios, SPAs, salões' },
  { codigo: 'veterinaria', nome: 'Veterinária', icone: Dog, descricao: 'Clínicas veterinárias, pet shops' },
  { codigo: 'odontologia', nome: 'Odontologia', icone: Scissors, descricao: 'Consultórios odontológicos' },
  { codigo: 'educacao', nome: 'Educação & Cursos', icone: GraduationCap, descricao: 'Escolas, cursos, treinamentos' },
  { codigo: 'oficina', nome: 'Oficina & Serviços', icone: Wrench, descricao: 'Mecânicas, assistências técnicas' },
];

const MODOS_AGENDA = [
  {
    valor: 'profissional',
    nome: 'Por Profissional',
    icone: Users,
    descricao: 'Cada profissional tem sua própria agenda'
  },
  {
    valor: 'recurso',
    nome: 'Por Recurso',
    icone: Package,
    descricao: 'Salas, equipamentos ou boxes disponíveis'
  },
  {
    valor: 'local',
    nome: 'Por Local/Unidade',
    icone: MapPin,
    descricao: 'Múltiplas unidades ou locais de atendimento'
  },
  {
    valor: 'externo',
    nome: 'Atendimento Externo',
    icone: Truck,
    descricao: 'Atendimento em campo, domiciliar'
  },
  {
    valor: 'misto',
    nome: 'Misto',
    icone: Layers,
    descricao: 'Combinação de profissionais e recursos'
  },
];

const MEIOS_PAGAMENTO = [
  { id: 'dinheiro', nome: 'Dinheiro' },
  { id: 'pix', nome: 'PIX' },
  { id: 'cartao_debito', nome: 'Cartão de Débito' },
  { id: 'cartao_credito', nome: 'Cartão de Crédito' },
  { id: 'convenio', nome: 'Convênio/Plano de Saúde' },
  { id: 'boleto', nome: 'Boleto' },
  { id: 'transferencia', nome: 'Transferência Bancária' },
];

const LEMBRETES_OPTIONS = [
  { id: 'confirmacao', nome: 'Confirmação de Agendamento', descricao: 'Solicitar confirmação 24h antes' },
  { id: 'lembrete', nome: 'Lembrete', descricao: 'Lembrar sobre o compromisso' },
  { id: 'chegada', nome: 'Check-in de Chegada', descricao: 'Confirmar chegada no local' },
  { id: 'pos_atendimento', nome: 'Pós-Atendimento', descricao: 'Agradecer e solicitar feedback' },
];

export default function OnboardingSegmento({ onComplete, onBack }: OnboardingSegmentoProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<SegmentPreview | null>(null);

  // Step 1: Sobre seu negócio
  const [segmentoSelecionado, setSegmentoSelecionado] = useState<string>('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [activeSegments, setActiveSegments] = useState<any[]>([]);
  const [loadingSegments, setLoadingSegments] = useState(true);

  useEffect(() => {
    const fetchActiveSegments = async () => {
      try {
        const { data } = await supabase
          .from('segment_configs')
          .select('*')
          .eq('active', true)
          .order('name');
        setActiveSegments(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingSegments(false);
      }
    };
    fetchActiveSegments();
  }, []);

  const getSegmentIcon = (id: string) => {
    switch (id) {
      case 'saude': return Stethoscope;
      case 'juridico': return Scale;
      case 'oficina': return Wrench;
      case 'beleza': return Scissors;
      default: return Building2;
    }
  };

  // Step 2: Modo de agenda
  const [modoAgenda, setModoAgenda] = useState<string>('profissional');

  // Step 3: Meios de pagamento
  const [meiosPagamento, setMeiosPagamento] = useState<string[]>(['dinheiro', 'pix', 'cartao_credito']);
  const [exigirSinal, setExigirSinal] = useState(false);
  const [taxaCancelamento, setTaxaCancelamento] = useState(false);

  // Step 4: Lembretes
  const [lembretesAtivos, setLembretesAtivos] = useState<string[]>(['confirmacao', 'lembrete']);

  const totalSteps = 6; // Adicionado step de preview
  const progress = (step / totalSteps) * 100;

  // Buscar preview quando segmento mudar
  useEffect(() => {
    if (segmentoSelecionado) {
      fetchPreview(segmentoSelecionado);
    }
  }, [segmentoSelecionado]);

  const fetchPreview = async (segmento: string) => {
    setPreviewLoading(true);
    try {
      const { data, error } = await supabase.rpc('preview_segment_config', {
        p_segmento: segmento
      });
      if (error) throw error;
      setPreviewData(data as unknown as SegmentPreview);
    } catch (error) {
      console.error('Error fetching preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const toggleMeioPagamento = (id: string) => {
    setMeiosPagamento(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const toggleLembrete = (id: string) => {
    setLembretesAtivos(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === 1 && !segmentoSelecionado) {
      toast.error('Selecione um segmento para continuar');
      return;
    }
    setStep(s => Math.min(s + 1, totalSteps));
  };

  const handleBack = () => {
    if (step === 1) {
      onBack?.();
    } else {
      setStep(s => Math.max(s - 1, 1));
    }
  };

  const handleComplete = async () => {
    if (!profile?.tenant_id) {
      toast.error('Erro: Tenant não encontrado');
      return;
    }

    setLoading(true);
    try {
      // 1. Criar/atualizar tenant_profile
      const { error: profileError } = await supabase
        .from('tenant_profile')
        .upsert({
          tenant_id: profile.tenant_id,
          segmentos: [{ codigo: segmentoSelecionado, nome: activeSegments.find(s => s.id === segmentoSelecionado)?.name || '' }],
          modo_agenda: modoAgenda,
          pais: 'BR',
          moeda: 'BRL',
          idioma: 'pt-BR',
          status_onboarding: 'concluido',
          meios_pagamento: meiosPagamento,
          politicas_cobranca: { exigir_sinal: exigirSinal, taxa_cancelamento: taxaCancelamento },
          lembretes_config: { ativos: lembretesAtivos },
        }, { onConflict: 'tenant_id' });

      if (profileError) throw profileError;

      // 2. Aplicar flags do segmento
      const { error: flagsError } = await supabase.rpc('apply_segment_flags', {
        p_tenant_id: profile.tenant_id,
        p_segmento: segmentoSelecionado
      });

      if (flagsError) throw flagsError;

      // 3. Atualizar cidade/estado no tenant se necessário
      if (cidade || estado) {
        await supabase
          .from('tenants')
          .update({
            cidade: cidade || undefined,
            estado: estado || undefined
          })
          .eq('id', profile.tenant_id);
      }

      toast.success('Configurações aplicadas com sucesso!');

      if (onComplete) {
        onComplete();
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Qual é o segmento do seu negócio?</h3>
              {loadingSegments ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeSegments.map(seg => {
                    // Tentar mapear ícone do banco ou usar fallback
                    let Icon = Building2;
                    if (seg.icon) {
                      const iconName = seg.icon;
                      if (iconName === 'Stethoscope') Icon = Stethoscope;
                      else if (iconName === 'Sparkles') Icon = Sparkles;
                      else if (iconName === 'Dog') Icon = Dog;
                      else if (iconName === 'Scissors') Icon = Scissors;
                      else if (iconName === 'GraduationCap') Icon = GraduationCap;
                      else if (iconName === 'Wrench') Icon = Wrench;
                      else if (iconName === 'Scale') Icon = Scale;
                    } else {
                      Icon = getSegmentIcon(seg.id);
                    }

                    const isSelected = segmentoSelecionado === seg.id;
                    return (
                      <div
                        key={seg.id}
                        onClick={() => setSegmentoSelecionado(seg.id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{seg.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {seg.description || 'Segmento especializado'}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={e => setCidade(e.target.value)}
                  placeholder="Sua cidade"
                />
              </div>
              <div>
                <Label htmlFor="estado">Estado</Label>
                <Input
                  id="estado"
                  value={estado}
                  onChange={e => setEstado(e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Como você organiza sua agenda?</h3>
              <RadioGroup value={modoAgenda} onValueChange={setModoAgenda} className="space-y-3">
                {MODOS_AGENDA.map(modo => {
                  const Icon = modo.icone;
                  return (
                    <div
                      key={modo.valor}
                      className={`flex items-center space-x-3 p-4 rounded-lg border transition-all ${modoAgenda === modo.valor
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <RadioGroupItem value={modo.valor} id={modo.valor} />
                      <div className={`p-2 rounded-lg ${modoAgenda === modo.valor ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={modo.valor} className="font-medium cursor-pointer">
                          {modo.nome}
                        </Label>
                        <p className="text-sm text-muted-foreground">{modo.descricao}</p>
                      </div>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Quais formas de pagamento você aceita?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {MEIOS_PAGAMENTO.map(meio => {
                  // Esconder convênio para segmentos que não usam
                  if (meio.id === 'convenio' && !['saude', 'odontologia'].includes(segmentoSelecionado)) {
                    return null;
                  }
                  const isSelected = meiosPagamento.includes(meio.id);
                  return (
                    <div
                      key={meio.id}
                      onClick={() => toggleMeioPagamento(meio.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center gap-3 ${isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                        }`}
                    >
                      <Checkbox checked={isSelected} />
                      <span className="font-medium">{meio.nome}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-medium">Políticas de Cobrança</h4>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Exigir sinal no agendamento</p>
                  <p className="text-sm text-muted-foreground">Solicitar pagamento antecipado</p>
                </div>
                <Switch checked={exigirSinal} onCheckedChange={setExigirSinal} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium">Taxa de cancelamento</p>
                  <p className="text-sm text-muted-foreground">Cobrar taxa em cancelamentos tardios</p>
                </div>
                <Switch checked={taxaCancelamento} onCheckedChange={setTaxaCancelamento} />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Configure seus lembretes automáticos</h3>
              <div className="space-y-3">
                {LEMBRETES_OPTIONS.map(lembrete => {
                  const isActive = lembretesAtivos.includes(lembrete.id);
                  return (
                    <div
                      key={lembrete.id}
                      className={`p-4 rounded-lg border transition-all ${isActive ? 'border-primary bg-primary/5' : 'border-border'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{lembrete.nome}</p>
                          <p className="text-sm text-muted-foreground">{lembrete.descricao}</p>
                        </div>
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => toggleLembrete(lembrete.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 5:
        // Preview step - mostra o que será ativado
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Eye className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-medium">Pré-visualização</h3>
                <p className="text-sm text-muted-foreground">Veja o que será ativado para o segmento selecionado</p>
              </div>
            </div>

            {previewLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Carregando preview...</span>
              </div>
            ) : previewData ? (
              <Tabs defaultValue="features" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="features" className="flex items-center gap-2">
                    <ToggleLeft className="h-4 w-4" />
                    Recursos ({previewData.total_features})
                  </TabsTrigger>
                  <TabsTrigger value="menu" className="flex items-center gap-2">
                    <Menu className="h-4 w-4" />
                    Menu ({previewData.menu?.length || 0})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="features" className="mt-4">
                  <ScrollArea className="h-[280px] rounded-md border p-4">
                    <div className="space-y-3">
                      {previewData.features?.map((feature, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-lg border ${feature.habilitado ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                            }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">{feature.recurso.replace(/_/g, ' ')}</span>
                              <Badge variant="outline" className="text-xs">{feature.categoria}</Badge>
                            </div>
                            {feature.descricao && (
                              <p className="text-sm text-muted-foreground mt-1">{feature.descricao}</p>
                            )}
                          </div>
                          <Badge variant={feature.habilitado ? "default" : "secondary"}>
                            {feature.habilitado ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="menu" className="mt-4">
                  <ScrollArea className="h-[280px] rounded-md border p-4">
                    <div className="space-y-2">
                      {previewData.menu?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Menu className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium">{item.label}</span>
                            <p className="text-xs text-muted-foreground">{item.rota}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center gap-2 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm">Selecione um segmento para ver a pré-visualização</span>
              </div>
            )}
          </div>
        );

      case 6:
        const segmento = SEGMENTOS.find(s => s.codigo === segmentoSelecionado);
        const modo = MODOS_AGENDA.find(m => m.valor === modoAgenda);
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Resumo das suas configurações</h3>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Segmento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {segmento && <segmento.icone className="h-5 w-5 text-primary" />}
                      <span className="font-medium">{segmento?.nome}</span>
                      <Badge variant="outline">{previewData?.total_features || 0} recursos</Badge>
                    </div>
                    {(cidade || estado) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {cidade}{cidade && estado ? ', ' : ''}{estado}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Modo de Agenda</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {modo && <modo.icone className="h-5 w-5 text-primary" />}
                      <span className="font-medium">{modo?.nome}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Meios de Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {meiosPagamento.map(id => {
                        const meio = MEIOS_PAGAMENTO.find(m => m.id === id);
                        return meio && (
                          <Badge key={id} variant="secondary">{meio.nome}</Badge>
                        );
                      })}
                    </div>
                    {(exigirSinal || taxaCancelamento) && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {exigirSinal && <span className="block">• Sinal no agendamento ativo</span>}
                        {taxaCancelamento && <span className="block">• Taxa de cancelamento ativa</span>}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Lembretes Ativos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {lembretesAtivos.map(id => {
                        const lembrete = LEMBRETES_OPTIONS.find(l => l.id === id);
                        return lembrete && (
                          <Badge key={id} variant="outline">{lembrete.nome}</Badge>
                        );
                      })}
                      {lembretesAtivos.length === 0 && (
                        <span className="text-sm text-muted-foreground">Nenhum lembrete ativado</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepIcon = (stepNum: number) => {
    switch (stepNum) {
      case 1: return Building2;
      case 2: return Calendar;
      case 3: return CreditCard;
      case 4: return MessageSquare;
      case 5: return Eye;
      case 6: return Check;
      default: return Building2;
    }
  };

  const getStepTitle = (stepNum: number) => {
    switch (stepNum) {
      case 1: return 'Sobre seu negócio';
      case 2: return 'Modo de agenda';
      case 3: return 'Pagamentos';
      case 4: return 'Lembretes';
      case 5: return 'Pré-visualização';
      case 6: return 'Confirmar';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => {
                const stepNum = i + 1;
                const Icon = getStepIcon(stepNum);
                const isActive = step === stepNum;
                const isComplete = step > stepNum;
                return (
                  <div key={i} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${isComplete
                        ? 'bg-primary text-primary-foreground'
                        : isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                        }`}
                    >
                      {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    {i < totalSteps - 1 && (
                      <div className={`w-6 h-0.5 ${step > stepNum ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <Badge variant="outline">
              {step} de {totalSteps}
            </Badge>
          </div>
          <Progress value={progress} className="h-1" />
          <CardTitle className="mt-4">{getStepTitle(step)}</CardTitle>
          <CardDescription>
            {step === 1 && 'Conte-nos sobre o seu negócio para personalizarmos sua experiência'}
            {step === 2 && 'Defina como você organiza seus atendimentos'}
            {step === 3 && 'Configure suas formas de pagamento e políticas'}
            {step === 4 && 'Automatize a comunicação com seus clientes'}
            {step === 5 && 'Veja os recursos e menus que serão ativados para seu segmento'}
            {step === 6 && 'Revise todas as configurações antes de finalizar'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {renderStepContent()}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {step === 1 ? 'Voltar' : 'Anterior'}
            </Button>

            {step < totalSteps ? (
              <Button onClick={handleNext}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading}>
                {loading ? 'Aplicando...' : 'Aplicar Configurações'}
                <Check className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
