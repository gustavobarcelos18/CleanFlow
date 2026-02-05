import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

// Map of role aliases to actual database roles
const ROLE_ALIASES: Record<string, string[]> = {
  'admin_tenant': ['admin'], // profiles.role
  'financeiro_tenant': ['org_finance', 'unit_finance'],
  'suporte': ['master', 'admin', 'agente'], // support_role
  'org_admin': ['org_admin'],
  'org_finance': ['org_finance'],
  'unit_admin': ['unit_admin'],
  'unit_finance': ['unit_finance'],
  'atendimento': ['atendimento'],
  'leitura': ['leitura'],
};

export type AppRole =
  | 'admin_tenant'
  | 'financeiro_tenant'
  | 'suporte'
  | 'org_admin'
  | 'org_finance'
  | 'unit_admin'
  | 'unit_finance'
  | 'atendimento'
  | 'leitura';

interface UserRolesState {
  profileRole: string | null;
  orgRoles: string[];
  supportRoles: string[];
  isLoading: boolean;
  error: string | null;
}

export function useUserRoles() {
  const { user, profile, loading: authLoading } = useAuth();
  const [state, setState] = useState<UserRolesState>({
    profileRole: null,
    orgRoles: [],
    supportRoles: [],
    isLoading: true,
    error: null,
  });

  const fetchRoles = useCallback(async () => {
    if (!user?.id) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Fetch organization roles from user_unit_roles
      const { data: unitRoles, error: unitRolesError } = await (supabase
        .from('user_unit_roles' as any)
        .select('role')
        .eq('user_id', user.id) as any);

      if (unitRolesError) {
        console.error('[useUserRoles] Error fetching unit roles:', unitRolesError);
      }

      // Fetch system roles from system_users
      const { data: systemUser, error: systemError } = await (supabase
        .from('system_users' as any)
        .select('system_role, active')
        .eq('id', user.id)
        .maybeSingle() as any);

      if (systemError) {
        console.error('[useUserRoles] Error fetching system user:', systemError);
      }

      const orgRoles = unitRoles?.map(r => r.role) || [];

      // System users have a single system_role
      const supportRoles = systemUser?.active && systemUser?.system_role
        ? [systemUser.system_role]
        : [];

      setState({
        profileRole: profile?.role || null,
        orgRoles,
        supportRoles,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error('[useUserRoles] Error:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erro ao carregar papéis do usuário',
      }));
    }
  }, [user?.id, profile?.role]);

  useEffect(() => {
    if (!authLoading) {
      fetchRoles();
    }
  }, [authLoading, fetchRoles]);

  const hasRole = useCallback((roles: AppRole[]): boolean => {
    if (state.isLoading) return false;

    // Master has access to everything
    if (state.supportRoles.includes('master')) {
      return true;
    }

    // Expand aliases to actual roles
    const expandedRoles = roles.flatMap(role => ROLE_ALIASES[role] || [role]);

    // Check profile role (tenant admin)
    if (state.profileRole && expandedRoles.includes(state.profileRole)) {
      return true;
    }

    // Check organization roles
    if (state.orgRoles.some(role => expandedRoles.includes(role))) {
      return true;
    }

    // Check support roles
    if (state.supportRoles.some(role => expandedRoles.includes(role))) {
      return true;
    }

    return false;
  }, [state]);

  const hasAnyRole = useCallback((roles: AppRole[]): boolean => {
    return hasRole(roles);
  }, [hasRole]);

  const hasAllRoles = useCallback((roles: AppRole[]): boolean => {
    return roles.every(role => hasRole([role]));
  }, [hasRole]);

  return {
    ...state,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    refreshRoles: fetchRoles,
  };
}
