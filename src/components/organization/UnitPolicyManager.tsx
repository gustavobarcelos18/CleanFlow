import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Shield, 
  Settings, 
  Users, 
  CreditCard, 
  MessageSquare,
  Eye,
  Edit,
  Trash2,
  Plus,
  Building2,
  Save,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from '@/hooks/useOrganizationContext';

interface UnitPolicy {
  id: string;
  unit_id: string;
  autonomy_level: 'full' | 'limited' | 'readonly';
  can_edit_settings: boolean;
  can_edit_services: boolean;
  can_edit_prices: boolean;
  can_edit_schedules: boolean;
  can_edit_messaging: boolean;
  can_edit_payment_methods: boolean;
  can_create_patients: boolean;
  can_edit_patients: boolean;
  can_delete_patients: boolean;
  can_create_appointments: boolean;
  can_edit_appointments: boolean;
  can_delete_appointments: boolean;
  can_create_professionals: boolean;
  can_edit_professionals: boolean;
  can_delete_professionals: boolean;
  can_view_financials: boolean;
  can_create_transactions: boolean;
  can_edit_transactions: boolean;
  can_close_cash_register: boolean;
  can_view_reports: boolean;
  can_export_data: boolean;
  can_send_messages: boolean;
  can_edit_templates: boolean;
  can_view_all_conversations: boolean;
  inherit_services: boolean;
  inherit_prices: boolean;
  inherit_schedules: boolean;
  inherit_messaging: boolean;
  inherit_payment_methods: boolean;
  notes: string | null;
}

interface UnitWithPolicy {
  id: string;
  nome_unidade: string;
  is_matriz: boolean;
  policy?: UnitPolicy;
}

export function UnitPolicyManager() {
  const { organization, units, isOrgAdmin } = useOrganizationContext();
  const [unitsWithPolicies, setUnitsWithPolicies] = useState<UnitWithPolicy[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [currentPolicy, setCurrentPolicy] = useState<Partial<UnitPolicy> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (organization?.id) {
      fetchPolicies();
    }
  }, [organization?.id]);

  const fetchPolicies = async () => {
    if (!organization?.id) return;
    
    try {
      const { data: policies, error } = await supabase
        .from('unit_policies')
        .select('*')
        .eq('organization_id', organization.id);

      if (error) throw error;

      const unitsData: UnitWithPolicy[] = units.map(unit => ({
        id: unit.id,
        nome_unidade: unit.nome_unidade,
        is_matriz: unit.is_matriz,
        policy: policies?.find(p => p.unit_id === unit.id) as UnitPolicy | undefined
      }));

      setUnitsWithPolicies(unitsData);
      
      if (unitsData.length > 0 && !selectedUnit) {
        setSelectedUnit(unitsData[0].id);
        setCurrentPolicy(unitsData[0].policy || getDefaultPolicy());
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      toast.error('Erro ao carregar políticas');
    } finally {
      setLoading(false);
    }
  };

  const getDefaultPolicy = (): Partial<UnitPolicy> => ({
    autonomy_level: 'limited',
    can_edit_settings: false,
    can_edit_services: false,
    can_edit_prices: false,
    can_edit_schedules: false,
    can_edit_messaging: false,
    can_edit_payment_methods: false,
    can_create_patients: true,
    can_edit_patients: true,
    can_delete_patients: false,
    can_create_appointments: true,
    can_edit_appointments: true,
    can_delete_appointments: false,
    can_create_professionals: false,
    can_edit_professionals: false,
    can_delete_professionals: false,
    can_view_financials: true,
    can_create_transactions: true,
    can_edit_transactions: false,
    can_close_cash_register: true,
    can_view_reports: true,
    can_export_data: false,
    can_send_messages: true,
    can_edit_templates: false,
    can_view_all_conversations: true,
    inherit_services: true,
    inherit_prices: true,
    inherit_schedules: true,
    inherit_messaging: true,
    inherit_payment_methods: true,
    notes: null
  });

  const handleSelectUnit = (unitId: string) => {
    setSelectedUnit(unitId);
    const unit = unitsWithPolicies.find(u => u.id === unitId);
    setCurrentPolicy(unit?.policy || getDefaultPolicy());
  };

  const handleAutonomyChange = (level: 'full' | 'limited' | 'readonly') => {
    if (!currentPolicy) return;

    let updatedPolicy = { ...currentPolicy, autonomy_level: level };

    if (level === 'full') {
      // Habilita tudo
      updatedPolicy = {
        ...updatedPolicy,
        can_edit_settings: true,
        can_edit_services: true,
        can_edit_prices: true,
        can_edit_schedules: true,
        can_edit_messaging: true,
        can_edit_payment_methods: true,
        can_create_patients: true,
        can_edit_patients: true,
        can_delete_patients: true,
        can_create_appointments: true,
        can_edit_appointments: true,
        can_delete_appointments: true,
        can_create_professionals: true,
        can_edit_professionals: true,
        can_delete_professionals: true,
        can_view_financials: true,
        can_create_transactions: true,
        can_edit_transactions: true,
        can_close_cash_register: true,
        can_view_reports: true,
        can_export_data: true,
        can_send_messages: true,
        can_edit_templates: true,
        can_view_all_conversations: true,
      };
    } else if (level === 'readonly') {
      // Desabilita tudo exceto visualização
      updatedPolicy = {
        ...updatedPolicy,
        can_edit_settings: false,
        can_edit_services: false,
        can_edit_prices: false,
        can_edit_schedules: false,
        can_edit_messaging: false,
        can_edit_payment_methods: false,
        can_create_patients: false,
        can_edit_patients: false,
        can_delete_patients: false,
        can_create_appointments: false,
        can_edit_appointments: false,
        can_delete_appointments: false,
        can_create_professionals: false,
        can_edit_professionals: false,
        can_delete_professionals: false,
        can_view_financials: true,
        can_create_transactions: false,
        can_edit_transactions: false,
        can_close_cash_register: false,
        can_view_reports: true,
        can_export_data: false,
        can_send_messages: false,
        can_edit_templates: false,
        can_view_all_conversations: true,
      };
    }

    setCurrentPolicy(updatedPolicy);
  };

  const handleSave = async () => {
    if (!selectedUnit || !currentPolicy || !organization?.id) return;

    setSaving(true);
    try {
      const policyData = {
        organization_id: organization.id,
        unit_id: selectedUnit,
        ...currentPolicy
      };

      const { error } = await supabase
        .from('unit_policies')
        .upsert(policyData, { onConflict: 'organization_id,unit_id' });

      if (error) throw error;

      toast.success('Políticas salvas com sucesso');
      fetchPolicies();
    } catch (error) {
      console.error('Error saving policy:', error);
      toast.error('Erro ao salvar políticas');
    } finally {
      setSaving(false);
    }
  };

  const selectedUnitData = unitsWithPolicies.find(u => u.id === selectedUnit);

  if (!isOrgAdmin) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertTriangle className="h-5 w-5" />
          <span>Você não tem permissão para gerenciar políticas de unidades.</span>
        </div>
      </Card>
    );
  }

  if (loading) {
    return <div className="p-4">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Políticas de Unidades</h2>
          <p className="text-muted-foreground">
            Defina o nível de autonomia e permissões de cada unidade
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lista de unidades */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Unidades</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {unitsWithPolicies.map(unit => (
                <button
                  key={unit.id}
                  onClick={() => handleSelectUnit(unit.id)}
                  className={`w-full p-3 text-left flex items-center gap-3 hover:bg-muted/50 transition-colors ${
                    selectedUnit === unit.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                  }`}
                >
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{unit.nome_unidade}</p>
                    {unit.is_matriz && (
                      <Badge variant="secondary" className="text-xs">Matriz</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Editor de políticas */}
        <Card className="lg:col-span-3">
          {selectedUnitData && currentPolicy ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedUnitData.nome_unidade}</CardTitle>
                    <CardDescription>
                      Configure as permissões e autonomia desta unidade
                    </CardDescription>
                  </div>
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="autonomy">
                  <TabsList className="mb-4">
                    <TabsTrigger value="autonomy">Autonomia</TabsTrigger>
                    <TabsTrigger value="config">Configurações</TabsTrigger>
                    <TabsTrigger value="data">Dados</TabsTrigger>
                    <TabsTrigger value="financial">Financeiro</TabsTrigger>
                    <TabsTrigger value="messaging">Mensageria</TabsTrigger>
                    <TabsTrigger value="inheritance">Herança</TabsTrigger>
                  </TabsList>

                  <TabsContent value="autonomy" className="space-y-4">
                    <div>
                      <Label>Nível de Autonomia</Label>
                      <Select
                        value={currentPolicy.autonomy_level}
                        onValueChange={(v) => handleAutonomyChange(v as any)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-green-500" />
                              Autonomia Total
                            </div>
                          </SelectItem>
                          <SelectItem value="limited">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-yellow-500" />
                              Autonomia Limitada
                            </div>
                          </SelectItem>
                          <SelectItem value="readonly">
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-red-500" />
                              Somente Leitura
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground mt-2">
                        {currentPolicy.autonomy_level === 'full' && 'A unidade pode fazer qualquer alteração.'}
                        {currentPolicy.autonomy_level === 'limited' && 'A unidade pode operar mas com restrições de configuração.'}
                        {currentPolicy.autonomy_level === 'readonly' && 'A unidade só pode visualizar dados, sem alterações.'}
                      </p>
                    </div>

                    <div>
                      <Label>Notas do Gestor</Label>
                      <Textarea
                        className="mt-2"
                        placeholder="Observações sobre esta unidade..."
                        value={currentPolicy.notes || ''}
                        onChange={e => setCurrentPolicy({ ...currentPolicy, notes: e.target.value })}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="config" className="space-y-4">
                    <div className="grid gap-4">
                      <PermissionSwitch
                        label="Editar Configurações"
                        description="Alterar configurações gerais da unidade"
                        checked={currentPolicy.can_edit_settings || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_edit_settings: v })}
                        icon={<Settings className="h-4 w-4" />}
                      />
                      <PermissionSwitch
                        label="Editar Serviços"
                        description="Criar e editar catálogo de serviços"
                        checked={currentPolicy.can_edit_services || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_edit_services: v })}
                        icon={<Edit className="h-4 w-4" />}
                      />
                      <PermissionSwitch
                        label="Editar Preços"
                        description="Alterar valores de serviços"
                        checked={currentPolicy.can_edit_prices || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_edit_prices: v })}
                        icon={<CreditCard className="h-4 w-4" />}
                      />
                      <PermissionSwitch
                        label="Editar Horários"
                        description="Configurar horários de funcionamento"
                        checked={currentPolicy.can_edit_schedules || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_edit_schedules: v })}
                        icon={<Settings className="h-4 w-4" />}
                      />
                      <PermissionSwitch
                        label="Editar Formas de Pagamento"
                        description="Configurar meios de pagamento aceitos"
                        checked={currentPolicy.can_edit_payment_methods || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_edit_payment_methods: v })}
                        icon={<CreditCard className="h-4 w-4" />}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="data" className="space-y-4">
                    <div className="grid gap-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Users className="h-4 w-4" /> Pacientes/Clientes
                      </h4>
                      <div className="grid grid-cols-3 gap-4 pl-6">
                        <PermissionSwitch
                          label="Criar"
                          checked={currentPolicy.can_create_patients || false}
                          onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_create_patients: v })}
                          icon={<Plus className="h-4 w-4" />}
                        />
                        <PermissionSwitch
                          label="Editar"
                          checked={currentPolicy.can_edit_patients || false}
                          onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_edit_patients: v })}
                          icon={<Edit className="h-4 w-4" />}
                        />
                        <PermissionSwitch
                          label="Excluir"
                          checked={currentPolicy.can_delete_patients || false}
                          onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_delete_patients: v })}
                          icon={<Trash2 className="h-4 w-4" />}
                        />
                      </div>

                      <h4 className="font-medium flex items-center gap-2 mt-4">
                        Agendamentos
                      </h4>
                      <div className="grid grid-cols-3 gap-4 pl-6">
                        <PermissionSwitch
                          label="Criar"
                          checked={currentPolicy.can_create_appointments || false}
                          onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_create_appointments: v })}
                          icon={<Plus className="h-4 w-4" />}
                        />
                        <PermissionSwitch
                          label="Editar"
                          checked={currentPolicy.can_edit_appointments || false}
                          onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_edit_appointments: v })}
                          icon={<Edit className="h-4 w-4" />}
                        />
                        <PermissionSwitch
                          label="Excluir"
                          checked={currentPolicy.can_delete_appointments || false}
                          onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_delete_appointments: v })}
                          icon={<Trash2 className="h-4 w-4" />}
                        />
                      </div>

                      <h4 className="font-medium flex items-center gap-2 mt-4">
                        Profissionais
                      </h4>
                      <div className="grid grid-cols-3 gap-4 pl-6">
                        <PermissionSwitch
                          label="Criar"
                          checked={currentPolicy.can_create_professionals || false}
                          onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_create_professionals: v })}
                          icon={<Plus className="h-4 w-4" />}
                        />
                        <PermissionSwitch
                          label="Editar"
                          checked={currentPolicy.can_edit_professionals || false}
                          onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_edit_professionals: v })}
                          icon={<Edit className="h-4 w-4" />}
                        />
                        <PermissionSwitch
                          label="Excluir"
                          checked={currentPolicy.can_delete_professionals || false}
                          onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_delete_professionals: v })}
                          icon={<Trash2 className="h-4 w-4" />}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="financial" className="space-y-4">
                    <div className="grid gap-4">
                      <PermissionSwitch
                        label="Visualizar Financeiro"
                        description="Ver dados financeiros da unidade"
                        checked={currentPolicy.can_view_financials || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_view_financials: v })}
                        icon={<Eye className="h-4 w-4" />}
                      />
                      <PermissionSwitch
                        label="Criar Lançamentos"
                        description="Registrar entradas e saídas"
                        checked={currentPolicy.can_create_transactions || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_create_transactions: v })}
                        icon={<Plus className="h-4 w-4" />}
                      />
                      <PermissionSwitch
                        label="Editar Lançamentos"
                        description="Alterar lançamentos existentes"
                        checked={currentPolicy.can_edit_transactions || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_edit_transactions: v })}
                        icon={<Edit className="h-4 w-4" />}
                      />
                      <PermissionSwitch
                        label="Fechar Caixa"
                        description="Realizar fechamento de caixa diário"
                        checked={currentPolicy.can_close_cash_register || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_close_cash_register: v })}
                        icon={<CreditCard className="h-4 w-4" />}
                      />
                      <PermissionSwitch
                        label="Ver Relatórios"
                        description="Acessar relatórios financeiros"
                        checked={currentPolicy.can_view_reports || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_view_reports: v })}
                        icon={<Eye className="h-4 w-4" />}
                      />
                      <PermissionSwitch
                        label="Exportar Dados"
                        description="Exportar dados para planilhas"
                        checked={currentPolicy.can_export_data || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_export_data: v })}
                        icon={<Edit className="h-4 w-4" />}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="messaging" className="space-y-4">
                    <div className="grid gap-4">
                      <PermissionSwitch
                        label="Enviar Mensagens"
                        description="Enviar mensagens para clientes"
                        checked={currentPolicy.can_send_messages || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_send_messages: v })}
                        icon={<MessageSquare className="h-4 w-4" />}
                      />
                      <PermissionSwitch
                        label="Editar Templates"
                        description="Criar e editar modelos de mensagem"
                        checked={currentPolicy.can_edit_templates || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_edit_templates: v })}
                        icon={<Edit className="h-4 w-4" />}
                      />
                      <PermissionSwitch
                        label="Ver Todas as Conversas"
                        description="Visualizar conversas de todos os atendentes"
                        checked={currentPolicy.can_view_all_conversations || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_view_all_conversations: v })}
                        icon={<Eye className="h-4 w-4" />}
                      />
                      <PermissionSwitch
                        label="Editar Mensageria"
                        description="Configurar canais de comunicação"
                        checked={currentPolicy.can_edit_messaging || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, can_edit_messaging: v })}
                        icon={<Settings className="h-4 w-4" />}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="inheritance" className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Defina quais configurações a unidade herdará da organização. 
                      Quando habilitado, a unidade usará as configurações da matriz.
                    </p>
                    <div className="grid gap-4">
                      <PermissionSwitch
                        label="Herdar Serviços"
                        description="Usar catálogo de serviços da organização"
                        checked={currentPolicy.inherit_services || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, inherit_services: v })}
                      />
                      <PermissionSwitch
                        label="Herdar Preços"
                        description="Usar tabela de preços da organização"
                        checked={currentPolicy.inherit_prices || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, inherit_prices: v })}
                      />
                      <PermissionSwitch
                        label="Herdar Horários"
                        description="Usar horários de funcionamento da organização"
                        checked={currentPolicy.inherit_schedules || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, inherit_schedules: v })}
                      />
                      <PermissionSwitch
                        label="Herdar Mensageria"
                        description="Usar configurações de mensageria da organização"
                        checked={currentPolicy.inherit_messaging || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, inherit_messaging: v })}
                      />
                      <PermissionSwitch
                        label="Herdar Formas de Pagamento"
                        description="Usar formas de pagamento da organização"
                        checked={currentPolicy.inherit_payment_methods || false}
                        onCheckedChange={v => setCurrentPolicy({ ...currentPolicy, inherit_payment_methods: v })}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <CardContent className="p-8 text-center text-muted-foreground">
              Selecione uma unidade para configurar suas políticas
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

interface PermissionSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon?: React.ReactNode;
}

function PermissionSwitch({ label, description, checked, onCheckedChange, icon }: PermissionSwitchProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <div>
          <p className="font-medium text-sm">{label}</p>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
