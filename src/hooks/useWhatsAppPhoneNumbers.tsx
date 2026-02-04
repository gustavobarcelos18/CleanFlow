import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PhoneNumber {
  id: string;
  phone_number: string;
  display_name: string;
  is_shared: boolean;
  status: string;
}

interface PhoneAllocation {
  id: string;
  phone_number_id: string;
  departamento: string;
  is_primary: boolean;
  status: string;
  phone_number?: PhoneNumber;
}

interface Department {
  id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  ativo: boolean;
}

interface PhonePackage {
  id: string;
  nome: string;
  descricao: string | null;
  quantidade_numeros: number;
  preco_mensal: number;
  moeda: string;
  inclui_creditos: number;
  planos_permitidos: string[];
  destaque: boolean;
  periodo_minimo_dias: number;
}

interface RoutingConfig {
  id: string;
  usa_numero_compartilhado: boolean;
  ai_routing_enabled: boolean;
  ai_model: string;
  menu_inicial_enabled: boolean;
}

interface PhoneSubscription {
  id: string;
  tenant_id: string;
  package_id: string;
  status: 'pending' | 'active' | 'cancelled' | 'cancellation_scheduled' | 'expired';
  data_inicio: string | null;
  data_proximo_faturamento: string | null;
  data_cancelamento_solicitado: string | null;
  data_cancelamento_efetivo: string | null;
  valor_mensal: number;
  numeros_contratados: number;
  numeros_ativos: number;
  departamentos: string[];
  package?: PhonePackage;
}

export function useWhatsAppPhoneNumbers() {
  const [allocations, setAllocations] = useState<PhoneAllocation[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [packages, setPackages] = useState<PhonePackage[]>([]);
  const [routingConfig, setRoutingConfig] = useState<RoutingConfig | null>(null);
  const [subscription, setSubscription] = useState<PhoneSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!profile?.tenant_id) return;
      setTenantId(profile.tenant_id);

      // Carregar assinatura ativa
      const { data: activeSub } = await supabase
        .from('phone_number_subscriptions')
        .select(`
          *,
          package:phone_number_packages(*)
        `)
        .eq('tenant_id', profile.tenant_id)
        .in('status', ['active', 'pending', 'cancellation_scheduled'])
        .maybeSingle();

      if (activeSub) {
        setSubscription({
          ...activeSub,
          package: activeSub.package
        } as unknown as PhoneSubscription);
      } else {
        setSubscription(null);
      }

      // Carregar alocações com números
      const { data: allocs } = await supabase
        .from('tenant_phone_allocations')
        .select(`
          *,
          phone_number:whatsapp_phone_numbers(*)
        `)
        .eq('tenant_id', profile.tenant_id)
        .neq('status', 'cancelled');

      setAllocations(allocs || []);

      // Carregar departamentos
      const { data: depts } = await supabase
        .from('tenant_whatsapp_departments')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('ativo', true)
        .order('ordem');

      setDepartments(depts || []);

      // Carregar configuração de roteamento
      const { data: routing } = await supabase
        .from('tenant_whatsapp_routing')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .maybeSingle();

      setRoutingConfig(routing);

      // Carregar pacotes disponíveis
      const { data: pkgs } = await supabase
        .from('phone_number_packages')
        .select('*')
        .eq('ativo', true)
        .order('preco_mensal');

      setPackages(pkgs || []);

    } catch (error) {
      console.error('Error loading phone data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const purchasePackage = async (packageId: string, departamentos: string[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('criar-assinatura-numero', {
        body: { package_id: packageId, departamentos }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error purchasing package:', error);
      toast.error(error.message || 'Erro ao processar compra');
    }
  };

  const cancelSubscription = async (motivo?: string) => {
    if (!subscription) {
      toast.error('Nenhuma assinatura ativa encontrada');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('cancelar-assinatura-numero', {
        body: { 
          subscription_id: subscription.id, 
          motivo,
          confirma_termos: true
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(data.mensagem || 'Cancelamento agendado com sucesso');
      await loadData();
      return data;
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast.error(error.message || 'Erro ao cancelar assinatura');
      return null;
    }
  };

  const createDepartment = async (nome: string, codigo: string, descricao?: string) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase.from('tenant_whatsapp_departments').insert({
        tenant_id: tenantId,
        nome,
        codigo,
        descricao,
        ordem: departments.length
      });

      if (error) throw error;
      toast.success('Departamento criado');
      await loadData();
    } catch (error: any) {
      console.error('Error creating department:', error);
      toast.error(error.message || 'Erro ao criar departamento');
    }
  };

  const updateRoutingConfig = async (config: Partial<RoutingConfig>) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from('tenant_whatsapp_routing')
        .upsert({
          tenant_id: tenantId,
          ...routingConfig,
          ...config
        }, { onConflict: 'tenant_id' });

      if (error) throw error;
      toast.success('Configuração atualizada');
      await loadData();
    } catch (error: any) {
      console.error('Error updating routing:', error);
      toast.error(error.message || 'Erro ao atualizar configuração');
    }
  };

  const usesSharedNumber = !subscription || subscription.status === 'cancelled' || subscription.status === 'expired';
  const hasExclusiveNumbers = subscription && ['active', 'cancellation_scheduled'].includes(subscription.status);
  const hasPendingSubscription = subscription?.status === 'pending';
  const isCancellationScheduled = subscription?.status === 'cancellation_scheduled';

  return {
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
    updateRoutingConfig,
    reload: loadData
  };
}
