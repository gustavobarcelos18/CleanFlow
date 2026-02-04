import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MenuItem {
  chave: string;
  label: string;
  icone: string;
  rota: string;
  visibilidade_por_flag?: string[];
}

interface TenantFeaturesState {
  menu: MenuItem[];
  features: Record<string, boolean>;
  loading: boolean;
  error: string | null;
}

export function useTenantFeatures() {
  const { profile } = useAuth();
  const [state, setState] = useState<TenantFeaturesState>({
    menu: [],
    features: {},
    loading: true,
    error: null,
  });

  const fetchMenu = useCallback(async () => {
    if (!profile?.tenant_id) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const { data: menuData, error: menuError } = await supabase.rpc('get_tenant_menu', {
        p_tenant_id: profile.tenant_id
      });

      if (menuError) throw menuError;

      // Fetch all feature flags for the tenant
      const { data: flagsData, error: flagsError } = await supabase
        .from('tenant_feature_flags')
        .select('recurso, enabled')
        .eq('tenant_id', profile.tenant_id);

      if (flagsError) throw flagsError;

      const featuresMap: Record<string, boolean> = {};
      flagsData?.forEach(flag => {
        featuresMap[flag.recurso] = flag.enabled;
      });

      setState({
        menu: (menuData as unknown as MenuItem[]) || [],
        features: featuresMap,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching tenant features:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro ao carregar recursos',
      }));
    }
  }, [profile?.tenant_id]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const hasFeature = useCallback((recurso: string): boolean => {
    return state.features[recurso] ?? false;
  }, [state.features]);

  const refreshFeatures = useCallback(() => {
    setState(prev => ({ ...prev, loading: true }));
    fetchMenu();
  }, [fetchMenu]);

  return {
    menu: state.menu,
    features: state.features,
    hasFeature,
    loading: state.loading,
    error: state.error,
    refreshFeatures,
  };
}

// Hook simples para verificar uma feature específica
export function useTenantFeature(recurso: string): boolean {
  const { hasFeature } = useTenantFeatures();
  return hasFeature(recurso);
}
