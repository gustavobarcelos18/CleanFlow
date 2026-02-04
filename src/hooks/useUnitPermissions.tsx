import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationContext } from './useOrganizationContext';

interface UnitPermissions {
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
  autonomy_level: 'full' | 'limited' | 'readonly';
}

const DEFAULT_PERMISSIONS: UnitPermissions = {
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
  autonomy_level: 'full'
};

export function useUnitPermissions() {
  const { currentUnit, organization, isOrgAdmin } = useOrganizationContext();
  const [permissions, setPermissions] = useState<UnitPermissions>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    if (!currentUnit?.id || !organization?.id) return;

    try {
      const { data, error } = await supabase
        .from('unit_policies')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('unit_id', currentUnit.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const autonomyLevel = data.autonomy_level as 'full' | 'limited' | 'readonly';
        setPermissions({
          can_edit_settings: data.can_edit_settings ?? false,
          can_edit_services: data.can_edit_services ?? false,
          can_edit_prices: data.can_edit_prices ?? false,
          can_edit_schedules: data.can_edit_schedules ?? false,
          can_edit_messaging: data.can_edit_messaging ?? false,
          can_edit_payment_methods: data.can_edit_payment_methods ?? false,
          can_create_patients: data.can_create_patients ?? true,
          can_edit_patients: data.can_edit_patients ?? true,
          can_delete_patients: data.can_delete_patients ?? false,
          can_create_appointments: data.can_create_appointments ?? true,
          can_edit_appointments: data.can_edit_appointments ?? true,
          can_delete_appointments: data.can_delete_appointments ?? false,
          can_create_professionals: data.can_create_professionals ?? false,
          can_edit_professionals: data.can_edit_professionals ?? false,
          can_delete_professionals: data.can_delete_professionals ?? false,
          can_view_financials: data.can_view_financials ?? true,
          can_create_transactions: data.can_create_transactions ?? true,
          can_edit_transactions: data.can_edit_transactions ?? false,
          can_close_cash_register: data.can_close_cash_register ?? true,
          can_view_reports: data.can_view_reports ?? true,
          can_export_data: data.can_export_data ?? false,
          can_send_messages: data.can_send_messages ?? true,
          can_edit_templates: data.can_edit_templates ?? false,
          can_view_all_conversations: data.can_view_all_conversations ?? true,
          autonomy_level: autonomyLevel
        });
      } else {
        // No policy defined, use defaults for limited
        setPermissions({
          ...DEFAULT_PERMISSIONS,
          can_edit_settings: false,
          can_edit_services: false,
          can_edit_prices: false,
          can_delete_patients: false,
          can_delete_appointments: false,
          can_create_professionals: false,
          can_edit_professionals: false,
          can_delete_professionals: false,
          can_edit_transactions: false,
          can_export_data: false,
          can_edit_templates: false,
          autonomy_level: 'limited'
        });
      }
    } catch (error) {
      console.error('Error fetching unit permissions:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUnit?.id, organization?.id]);

  useEffect(() => {
    if (isOrgAdmin) {
      setPermissions(DEFAULT_PERMISSIONS);
      setLoading(false);
      return;
    }

    if (currentUnit?.id && organization?.id) {
      fetchPermissions();
    }
  }, [currentUnit?.id, organization?.id, isOrgAdmin, fetchPermissions]);

  const can = useCallback((action: keyof Omit<UnitPermissions, 'autonomy_level'>): boolean => {
    if (isOrgAdmin) return true;
    return permissions[action] ?? false;
  }, [permissions, isOrgAdmin]);

  const isReadOnly = permissions.autonomy_level === 'readonly';
  const hasFullAutonomy = permissions.autonomy_level === 'full' || isOrgAdmin;

  return {
    permissions,
    loading,
    can,
    isReadOnly,
    hasFullAutonomy,
    isOrgAdmin
  };
}
