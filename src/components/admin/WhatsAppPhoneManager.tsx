import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useWhatsAppPhoneNumbers } from '@/hooks/useWhatsAppPhoneNumbers';
import {
  Phone,
  Plus,
  Sparkles,
  Building2,
  Settings2,
  ShoppingCart,
  CheckCircle,
  Clock,
  Users,
  Bot,
  AlertTriangle,
  CalendarX,
  Calendar,
  XCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function WhatsAppPhoneManager() {
  const {
    allocations,
    departments,
    packages,
    routingConfig,
    subscription,
    loading,
    usesSharedNumber,
    hasExclusiveNumbers,
    hasPendingSubscription,
    isCancellationScheduled,
    purchasePackage,
    cancelSubscription,
    createDepartment,
    updateRoutingConfig
  } = useWhatsAppPhoneNumbers();

  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [purchaseDepts, setPurchaseDepts] = useState<string[]>(['geral']);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-48 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  const handlePurchase = () => {
    if (!selectedPackage) return;
    purchasePackage(selectedPackage, purchaseDepts);
  };

  const handleCreateDept = () => {
    if (!newDeptName || !newDeptCode) {
      toast.error('Preencha nome e código do departamento');
      return;
    }
    createDepartment(newDeptName, newDeptCode.toLowerCase().replace(/\s/g, '_'));
    setNewDeptName('');
    setNewDeptCode('');
  };

  const handleCancelSubscription = async () => {
    if (!cancelConfirm) {
      toast.error('Você deve confirmar que entende os termos de cancelamento');
      return;
    }

    setCancelLoading(true);
    const result = await cancelSubscription(cancelMotivo);
    setCancelLoading(false);

    if (result) {
      setShowCancelDialog(false);
      setCancelMotivo('');
      setCancelConfirm(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Status da Assinatura */}
      {subscription && (
        <Card className={isCancellationScheduled ? 'border-destructive/50' : hasExclusiveNumbers ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Sua Assinatura
              </div>
              <Badge variant={
                subscription.status === 'active' ? 'default' :
                  subscription.status === 'cancellation_scheduled' ? 'destructive' :
                    subscription.status === 'pending' ? 'secondary' : 'outline'
              }>
                {subscription.status === 'active' && 'Ativa'}
                {subscription.status === 'cancellation_scheduled' && 'Cancelamento Agendado'}
                {subscription.status === 'pending' && 'Aguardando Pagamento'}
                {subscription.status === 'cancelled' && 'Cancelada'}
              </Badge>
            </CardTitle>
            <CardDescription>
              {(subscription.package as any)?.nome || 'Pacote de Números WhatsApp'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Números Contratados</p>
                <p className="text-2xl font-bold">{subscription.numeros_contratados}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Valor Mensal</p>
                <p className="text-2xl font-bold">
                  R$ {subscription.valor_mensal.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Início
                </p>
                <p className="font-medium">{formatDate(subscription.data_inicio)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Próximo Faturamento
                </p>
                <p className="font-medium">{formatDate(subscription.data_proximo_faturamento)}</p>
              </div>
            </div>

            {isCancellationScheduled && (
              <Alert variant="destructive">
                <CalendarX className="h-4 w-4" />
                <AlertTitle>Cancelamento Agendado</AlertTitle>
                <AlertDescription>
                  Seu número será desativado em {formatDate(subscription.data_cancelamento_efetivo)}.
                  Você continuará tendo acesso completo até esta data.
                </AlertDescription>
              </Alert>
            )}

            {hasPendingSubscription && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertTitle>Aguardando Pagamento</AlertTitle>
                <AlertDescription>
                  Sua assinatura será ativada após a confirmação do pagamento.
                </AlertDescription>
              </Alert>
            )}

            {subscription.status === 'active' && (
              <div className="pt-4 border-t">
                <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="text-destructive hover:text-destructive">
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar Assinatura
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Cancelar Assinatura
                      </DialogTitle>
                      <DialogDescription>
                        Atenção: Leia os termos abaixo antes de confirmar.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Política de Cancelamento</AlertTitle>
                        <AlertDescription className="space-y-2">
                          <p>• O cancelamento só será efetivado após <strong>30 dias</strong> da data de contratação ou no final do ciclo de faturamento atual, o que for maior.</p>
                          <p>• <strong>Não há reembolso</strong> proporcional pelo período não utilizado.</p>
                          <p>• Seu número permanecerá ativo até a data de efetivação do cancelamento.</p>
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label>Motivo do cancelamento (opcional)</Label>
                        <Textarea
                          placeholder="Conte-nos por que você está cancelando..."
                          value={cancelMotivo}
                          onChange={(e) => setCancelMotivo(e.target.value)}
                        />
                      </div>

                      <div className="flex items-start space-x-2">
                        <Checkbox
                          id="cancel-confirm"
                          checked={cancelConfirm}
                          onCheckedChange={(checked) => setCancelConfirm(checked as boolean)}
                        />
                        <Label htmlFor="cancel-confirm" className="text-sm leading-tight">
                          Eu entendo que o cancelamento só será efetivado no final do ciclo de faturamento,
                          sem direito a reembolso, e que meu número permanecerá ativo até lá.
                        </Label>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                        Voltar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleCancelSubscription}
                        disabled={!cancelConfirm || cancelLoading}
                      >
                        {cancelLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Confirmar Cancelamento
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status atual - Número compartilhado */}
      {usesSharedNumber && !hasPendingSubscription && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Números WhatsApp
            </CardTitle>
            <CardDescription>
              Você está usando o número compartilhado do CleanFlow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Número Compartilhado</span>
                <Badge variant="secondary">Plano Gratuito</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Todas as mensagens são roteadas por IA para identificar seus clientes.
                Para ter um número exclusivo, contrate um dos pacotes abaixo.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Bot className="h-4 w-4 text-primary" />
                <span>IA identifica automaticamente a clínica pelo contexto da conversa</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Números alocados */}
      {allocations.length > 0 && hasExclusiveNumbers && (
        <Card>
          <CardHeader>
            <CardTitle>Números Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allocations.map((alloc) => (
                <div key={alloc.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{(alloc.phone_number as any)?.phone_number || 'Provisionando...'}</p>
                      <p className="text-sm text-muted-foreground capitalize">{alloc.departamento}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alloc.is_primary && <Badge>Principal</Badge>}
                    <Badge variant={
                      alloc.status === 'active' ? 'default' :
                        alloc.status === 'provisioning' ? 'secondary' : 'outline'
                    }>
                      {alloc.status === 'active' && 'Ativo'}
                      {alloc.status === 'provisioning' && 'Provisionando'}
                      {alloc.status === 'pending' && 'Pendente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="packages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Pacotes
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Departamentos
          </TabsTrigger>
          <TabsTrigger value="routing" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Roteamento IA
          </TabsTrigger>
        </TabsList>

        {/* Pacotes */}
        <TabsContent value="packages">
          {hasExclusiveNumbers && !isCancellationScheduled ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Você já possui uma assinatura ativa</AlertTitle>
              <AlertDescription>
                Para contratar um pacote diferente, cancele sua assinatura atual primeiro.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {packages.map((pkg) => (
                <Card key={pkg.id} className={pkg.destaque ? 'border-primary' : ''}>
                  <CardHeader>
                    {pkg.destaque && (
                      <Badge className="w-fit mb-2">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Mais Popular
                      </Badge>
                    )}
                    <CardTitle>{pkg.nome}</CardTitle>
                    <CardDescription>{pkg.descricao}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-3xl font-bold">
                      R$ {pkg.preco_mensal.toFixed(2)}
                      <span className="text-sm font-normal text-muted-foreground">/mês</span>
                    </div>

                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        {pkg.quantidade_numeros} número(s) exclusivo(s)
                      </li>
                      {pkg.inclui_creditos > 0 && (
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          {pkg.inclui_creditos} créditos inclusos
                        </li>
                      )}
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        Roteamento por IA
                      </li>
                      <li className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Permanência mínima: {pkg.periodo_minimo_dias || 30} dias
                      </li>
                    </ul>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full"
                          variant={pkg.destaque ? 'default' : 'outline'}
                          onClick={() => setSelectedPackage(pkg.id)}
                          disabled={hasPendingSubscription}
                        >
                          {hasPendingSubscription ? 'Aguardando Pagamento' : 'Contratar'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Contratar {pkg.nome}</DialogTitle>
                          <DialogDescription>
                            Configure os departamentos para seus {pkg.quantidade_numeros} número(s)
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Atenção</AlertTitle>
                            <AlertDescription>
                              O cancelamento só pode ser feito após {pkg.periodo_minimo_dias || 30} dias da contratação
                              e será efetivado no final do ciclo de faturamento, sem reembolso.
                            </AlertDescription>
                          </Alert>

                          <div className="space-y-2">
                            <Label>Departamentos (um por linha)</Label>
                            <Textarea
                              className="min-h-[100px]"
                              placeholder="geral&#10;financeiro&#10;atendimento"
                              value={purchaseDepts.join('\n')}
                              onChange={(e) => setPurchaseDepts(e.target.value.split('\n').filter(Boolean))}
                            />
                            <p className="text-xs text-muted-foreground">
                              Máximo de {pkg.quantidade_numeros} departamentos
                            </p>
                          </div>
                          <Button onClick={handlePurchase} className="w-full">
                            Ir para Pagamento
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Departamentos */}
        <TabsContent value="departments">
          <Card>
            <CardHeader>
              <CardTitle>Departamentos</CardTitle>
              <CardDescription>
                Configure departamentos para direcionar mensagens automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {departments.length > 0 ? (
                <div className="space-y-2">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium">{dept.nome}</p>
                        <p className="text-sm text-muted-foreground">Código: {dept.codigo}</p>
                      </div>
                      <Badge variant={dept.ativo ? 'default' : 'secondary'}>
                        {dept.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum departamento configurado
                </p>
              )}

              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium">Adicionar Departamento</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input
                      placeholder="Ex: Financeiro"
                      value={newDeptName}
                      onChange={(e) => setNewDeptName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Código</Label>
                    <Input
                      placeholder="Ex: financeiro"
                      value={newDeptCode}
                      onChange={(e) => setNewDeptCode(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleCreateDept}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roteamento */}
        <TabsContent value="routing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Configuração de Roteamento IA
              </CardTitle>
              <CardDescription>
                Configure como a IA direciona as mensagens recebidas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Roteamento por IA</Label>
                  <p className="text-sm text-muted-foreground">
                    IA analisa contexto para direcionar mensagens
                  </p>
                </div>
                <Switch
                  checked={routingConfig?.ai_routing_enabled ?? true}
                  onCheckedChange={(checked) => updateRoutingConfig({ ai_routing_enabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Menu Inicial</Label>
                  <p className="text-sm text-muted-foreground">
                    Mostrar menu de opções ao iniciar conversa
                  </p>
                </div>
                <Switch
                  checked={routingConfig?.menu_inicial_enabled ?? false}
                  onCheckedChange={(checked) => updateRoutingConfig({ menu_inicial_enabled: checked })}
                />
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Como funciona o roteamento:</h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Cliente envia mensagem</li>
                  <li>IA analisa histórico e contexto</li>
                  <li>Identifica departamento correto automaticamente</li>
                  <li>Direciona para atendente responsável</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
