import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DashboardFilters {
  tenant_id?: string;
  priority?: string;
  status?: string;
}

export interface DashboardPreferences {
  theme: 'claro' | 'escuro' | 'sistema';
  filters: DashboardFilters;
}

export const useDashboardPreferences = () => {
  const [theme, setTheme] = useState<'claro' | 'escuro' | 'sistema'>('claro');
  const [filters, setFilters] = useState<DashboardFilters>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    applyTheme();
  }, [theme]);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('support_dashboard_preferences')
        .select('*')
        .eq('support_user_id', user.id)
        .maybeSingle();

      if (data?.preferences) {
        const prefs = data.preferences as any as DashboardPreferences;
        setTheme(prefs.theme || 'claro');
        setFilters(prefs.filters || {});
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = () => {
    const root = document.documentElement;
    
    if (theme === 'sistema') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'escuro');
    }
  };

  const updateTheme = async (newTheme: 'claro' | 'escuro' | 'sistema') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setTheme(newTheme);

      const preferences: DashboardPreferences = { theme: newTheme, filters };

      await supabase
        .from('support_dashboard_preferences')
        .upsert({
          support_user_id: user.id,
          preferences: preferences as any
        } as any);

      // Log action
      await supabase.from('support_actions_log').insert({
        support_user_id: user.id,
        action_type: 'dashboard_preferences_changed',
        target_type: 'preferences',
        description: `Tema alterado para ${newTheme}`,
        metadata: { theme: newTheme } as any
      } as any);

      toast.success('Tema atualizado');
    } catch (error) {
      console.error('Error updating theme:', error);
      toast.error('Erro ao atualizar tema');
    }
  };

  const updateFilters = async (newFilters: DashboardFilters) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setFilters(newFilters);

      const preferences: DashboardPreferences = { theme, filters: newFilters };

      await supabase
        .from('support_dashboard_preferences')
        .upsert({
          support_user_id: user.id,
          preferences: preferences as any
        } as any);

      // Log action
      await supabase.from('support_actions_log').insert({
        support_user_id: user.id,
        action_type: 'dashboard_preferences_changed',
        target_type: 'preferences',
        description: 'Filtros do dashboard atualizados',
        metadata: { filters: newFilters } as any
      } as any);
    } catch (error) {
      console.error('Error updating filters:', error);
      toast.error('Erro ao atualizar filtros');
    }
  };

  return {
    theme,
    filters,
    loading,
    updateTheme,
    updateFilters
  };
};
