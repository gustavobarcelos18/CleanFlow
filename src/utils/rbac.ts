
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'manager' | 'professional' | 'receptionist' | 'patient';

export interface Permission {
    resource: string;
    action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    admin: [
        { resource: '*', action: 'manage' }
    ],
    manager: [
        { resource: 'appointments', action: 'manage' },
        { resource: 'patients', action: 'manage' },
        { resource: 'financial', action: 'manage' },
        { resource: 'professionals', action: 'read' },
        { resource: 'settings', action: 'read' }
    ],
    professional: [
        { resource: 'appointments', action: 'manage' }, // Own appointments usually filtered by RLS
        { resource: 'patients', action: 'read' },
        { resource: 'patients', action: 'update' }, // Prontuário
        { resource: 'financial', action: 'read' } // Own commissions
    ],
    receptionist: [
        { resource: 'appointments', action: 'manage' },
        { resource: 'patients', action: 'manage' },
        { resource: 'financial', action: 'create' } // Receive payments
    ],
    patient: [
        { resource: 'appointments', action: 'read' }, // Own
        { resource: 'appointments', action: 'create' }
    ]
};

export async function getUserRole(userId: string): Promise<UserRole | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

    if (error || !data) return null;
    return data.role as UserRole;
}

export function hasPermission(role: UserRole, resource: string, action: string): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;

    return permissions.some(p =>
        (p.resource === '*' || p.resource === resource) &&
        (p.action === 'manage' || p.action === action)
    );
}
