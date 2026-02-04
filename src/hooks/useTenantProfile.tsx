import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

interface Segmento {
  codigo: string;
  nome: string;
  subsegmentos?: string[];
}

interface TenantProfile {
  id: string;
  tenant_id: string;
  segmentos: Segmento[];
  modo_agenda: 'profissional' | 'recurso' | 'local' | 'externo' | 'misto';
  pais: string;
  moeda: string;
  idioma: string;
  status_onboarding: 'novo' | 'parcial' | 'concluido';
  meios_pagamento: string[];
  politicas_cobranca: Record<string, unknown>;
  lembretes_config: Record<string, unknown>;
}

interface CapabilityMatrix {
  id: string;
  codigo_segmento: string;
  recurso: string;
  flag: boolean;
  flag_default: boolean;
  descricao: string;
  categoria: string;
}

interface TenantFeatureFlag {
  id: string;
  tenant_id: string;
  recurso: string;
  enabled: boolean;
  origem: 'segmento' | 'manual';
}

interface NavigationBlueprint {
  codigo_segmento: string;
  itens_menu: Array<{
    chave: string;
    label: string;
    rota: string;
    icone: string;
    visibilidade_por_flag: string[];
  }>;
}

export function useTenantProfile() {
  const { profile } = useAuth();
  const [tenantProfile, setTenantProfile] = useState<TenantProfile | null>(null);
  const [featureFlags, setFeatureFlags] = useState<TenantFeatureFlag[]>([]);
  const [capabilityMatrix, setCapabilityMatrix] = useState<CapabilityMatrix[]>([]);
  const [navigationBlueprints, setNavigationBlueprints] = useState<NavigationBlueprint[]>([]);
  const [loading, setLoading] = useState(true);

  const tenantId = profile?.tenant_id;

  const fetchTenantProfile = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('tenant_profile')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const segmentos = Array.isArray(data.segmentos) 
          ? (data.segmentos as unknown as Segmento[]) 
          : [];
        const meiosPagamento = Array.isArray(data.meios_pagamento) 
          ? (data.meios_pagamento as unknown as string[]) 
          : [];
        
        setTenantProfile({
          id: data.id,
          tenant_id: data.tenant_id,
          segmentos,
          modo_agenda: data.modo_agenda as TenantProfile['modo_agenda'],
          pais: data.pais || 'BR',
          moeda: data.moeda || 'BRL',
          idioma: data.idioma || 'pt-BR',
          status_onboarding: data.status_onboarding as TenantProfile['status_onboarding'],
          meios_pagamento: meiosPagamento,
          politicas_cobranca: (data.politicas_cobranca as Record<string, unknown>) || {},
          lembretes_config: (data.lembretes_config as Record<string, unknown>) || {},
        });
      }
    } catch (error) {
      console.error('Error fetching tenant profile:', error);
    }
  }, [tenantId]);

  const fetchFeatureFlags = useCallback(async () => {
    if (!tenantId) return;

    try {
      const { data, error } = await supabase
        .from('tenant_feature_flags')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;
      setFeatureFlags((data || []) as TenantFeatureFlag[]);
    } catch (error) {
      console.error('Error fetching feature flags:', error);
    }
  }, [tenantId]);

  const fetchCapabilityMatrix = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('capability_matrix')
        .select('*')
        .order('categoria', { ascending: true });

      if (error) throw error;
      setCapabilityMatrix((data || []) as CapabilityMatrix[]);
    } catch (error) {
      console.error('Error fetching capability matrix:', error);
    }
  }, []);

  const fetchNavigationBlueprints = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('navigation_blueprints')
        .select('*');

      if (error) throw error;
      setNavigationBlueprints((data || []).map(d => ({
        codigo_segmento: d.codigo_segmento,
        itens_menu: d.itens_menu as NavigationBlueprint['itens_menu']
      })));
    } catch (error) {
      console.error('Error fetching navigation blueprints:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchTenantProfile(),
        fetchFeatureFlags(),
        fetchCapabilityMatrix(),
        fetchNavigationBlueprints(),
      ]);
      setLoading(false);
    };

    if (tenantId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [tenantId, fetchTenantProfile, fetchFeatureFlags, fetchCapabilityMatrix, fetchNavigationBlueprints]);

  const createOrUpdateTenantProfile = async (data: Partial<TenantProfile>) => {
    if (!tenantId) return null;

    try {
      // Convert to database-compatible format
      const dbData: Record<string, Json | undefined> = {};
      if (data.segmentos !== undefined) dbData.segmentos = data.segmentos as unknown as Json;
      if (data.modo_agenda !== undefined) dbData.modo_agenda = data.modo_agenda;
      if (data.pais !== undefined) dbData.pais = data.pais;
      if (data.moeda !== undefined) dbData.moeda = data.moeda;
      if (data.idioma !== undefined) dbData.idioma = data.idioma;
      if (data.status_onboarding !== undefined) dbData.status_onboarding = data.status_onboarding;
      if (data.meios_pagamento !== undefined) dbData.meios_pagamento = data.meios_pagamento as unknown as Json;
      if (data.politicas_cobranca !== undefined) dbData.politicas_cobranca = data.politicas_cobranca as unknown as Json;
      if (data.lembretes_config !== undefined) dbData.lembretes_config = data.lembretes_config as unknown as Json;

      const { data: existing } = await supabase
        .from('tenant_profile')
        .select('id')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (existing) {
        const { data: updated, error } = await supabase
          .from('tenant_profile')
          .update({ ...dbData, updated_at: new Date().toISOString() })
          .eq('tenant_id', tenantId)
          .select()
          .single();

        if (error) throw error;
        await fetchTenantProfile();
        return updated;
      } else {
        const { data: created, error } = await supabase
          .from('tenant_profile')
          .insert({ ...dbData, tenant_id: tenantId })
          .select()
          .single();

        if (error) throw error;
        await fetchTenantProfile();
        return created;
      }
    } catch (error) {
      console.error('Error saving tenant profile:', error);
      toast.error('Erro ao salvar configurações');
      return null;
    }
  };

  const applySegmentFlags = async (segmento: string) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase.rpc('apply_segment_flags', {
        p_tenant_id: tenantId,
        p_segmento: segmento
      });

      if (error) throw error;
      await fetchFeatureFlags();
    } catch (error) {
      console.error('Error applying segment flags:', error);
      toast.error('Erro ao aplicar configurações do segmento');
    }
  };

  const toggleFeatureFlag = async (recurso: string, enabled: boolean) => {
    if (!tenantId) return;

    try {
      const { error } = await supabase
        .from('tenant_feature_flags')
        .upsert({
          tenant_id: tenantId,
          recurso,
          enabled,
          origem: 'manual',
          atualizado_em: new Date().toISOString(),
        }, { onConflict: 'tenant_id,recurso' });

      if (error) throw error;
      await fetchFeatureFlags();
    } catch (error) {
      console.error('Error toggling feature flag:', error);
      toast.error('Erro ao atualizar recurso');
    }
  };

  const isFeatureEnabled = (recurso: string): boolean => {
    const flag = featureFlags.find(f => f.recurso === recurso);
    return flag?.enabled ?? false;
  };

  const getMenuItems = () => {
    if (!tenantProfile?.segmentos?.length || !navigationBlueprints.length) {
      return [];
    }

    const primarySegment = tenantProfile.segmentos[0]?.codigo;
    const blueprint = navigationBlueprints.find(b => b.codigo_segmento === primarySegment);
    
    if (!blueprint) return [];

    return blueprint.itens_menu.filter(item => {
      if (item.visibilidade_por_flag.length === 0) return true;
      return item.visibilidade_por_flag.some(flag => isFeatureEnabled(flag));
    });
  };

  return {
    tenantProfile,
    featureFlags,
    capabilityMatrix,
    navigationBlueprints,
    loading,
    createOrUpdateTenantProfile,
    applySegmentFlags,
    toggleFeatureFlag,
    isFeatureEnabled,
    getMenuItems,
    refetch: () => {
      fetchTenantProfile();
      fetchFeatureFlags();
    }
  };
}
