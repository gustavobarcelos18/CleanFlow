import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Organization {
  id: string;
  nome_fantasia: string;
  razao_social: string | null;
  documento: string | null;
  moeda: string;
  timezone: string;
  status: string;
}

interface Unit {
  id: string;
  organization_id: string;
  nome_unidade: string;
  codigo_interno: string | null;
  razao_social: string | null;
  documento: string | null;
  is_matriz: boolean;
  status: string;
}

interface UserRole {
  id: string;
  organization_id: string;
  unit_id: string | null;
  role: 'org_admin' | 'org_finance' | 'unit_admin' | 'unit_finance' | 'atendimento' | 'leitura';
}

interface OrganizationContextType {
  organization: Organization | null;
  units: Unit[];
  currentUnit: Unit | null;
  userRoles: UserRole[];
  isLoading: boolean;
  isMultiUnit: boolean;
  setCurrentUnit: (unit: Unit | null) => void;
  refreshData: () => Promise<void>;
  hasRole: (roles: UserRole['role'][]) => boolean;
  hasUnitAccess: (unitId: string) => boolean;
  isOrgAdmin: boolean;
  isUnitAdmin: boolean;
  isMaster: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { profile, user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isMaster, setIsMaster] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganizationData = useCallback(async () => {
    if (!profile?.organization_id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch organization
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .maybeSingle();

      if (orgError) throw orgError;
      if (orgData) {
        setOrganization(orgData as Organization);
      }

      // Fetch units
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('status', 'ativo')
        .order('is_matriz', { ascending: false })
        .order('nome_unidade');

      if (unitsError) throw unitsError;
      setUnits((unitsData as Unit[]) || []);

      // Set default current unit (matriz or first)
      if (unitsData && unitsData.length > 0 && !currentUnit) {
        const matriz = unitsData.find((u: any) => u.is_matriz);
        setCurrentUnit((matriz || unitsData[0]) as Unit);
      }

      // Fetch user roles
      if (user?.id) {
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_unit_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('organization_id', profile.organization_id);

        if (rolesError) throw rolesError;
        setUserRoles((rolesData as UserRole[]) || []);

        // Check if user is master/system_user
        const { data: systemUserData } = await (supabase as any)
          .from('system_users')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        setIsMaster(!!systemUserData);
      }

    } catch (error) {
      console.error('Erro ao buscar dados da organização:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.organization_id, user?.id]);

  useEffect(() => {
    fetchOrganizationData();
  }, [fetchOrganizationData]);

  // Check if user has any of the specified roles
  const hasRole = useCallback((roles: UserRole['role'][]) => {
    return userRoles.some(ur => roles.includes(ur.role));
  }, [userRoles]);

  // Check if user has access to a specific unit
  const hasUnitAccess = useCallback((unitId: string) => {
    // Org-level roles have access to all units
    const hasOrgRole = userRoles.some(ur =>
      ur.unit_id === null && ['org_admin', 'org_finance'].includes(ur.role)
    );
    if (hasOrgRole) return true;

    // Check unit-specific access
    return userRoles.some(ur => ur.unit_id === unitId);
  }, [userRoles]);

  const isMultiUnit = units.length > 1;
  const isOrgAdmin = hasRole(['org_admin']);
  const isUnitAdmin = hasRole(['org_admin', 'unit_admin']);

  return (
    <OrganizationContext.Provider value={{
      organization,
      units,
      currentUnit,
      userRoles,
      isLoading,
      isMultiUnit,
      setCurrentUnit,
      refreshData: fetchOrganizationData,
      hasRole,
      hasUnitAccess,
      isOrgAdmin,
      isUnitAdmin,
      isMaster
    }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
}
