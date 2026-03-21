import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles, AppRole } from '@/hooks/useUserRoles';
import { AccessDenied } from '@/pages/AccessDenied';

interface RequireRoleProps {
  roles: AppRole[];
  children: React.ReactNode;
  redirectTo?: string;
}

export function RequireRole({ roles, children, redirectTo }: RequireRoleProps) {
  const { user, loading: authLoading } = useAuth();
  const { hasRole, isLoading: rolesLoading } = useUserRoles();

  // Show loading while checking auth and roles
  if (authLoading || rolesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Verificando permissões...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (!hasRole(roles)) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return <AccessDenied />;
  }

  return <div className="app-auth contents">{children}</div>;
}

// HOC version for wrapping components
export function withRequireRole<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  roles: AppRole[],
  redirectTo?: string
) {
  return function WithRoleComponent(props: P) {
    return (
      <RequireRole roles={roles} redirectTo={redirectTo}>
        <WrappedComponent {...props} />
      </RequireRole>
    );
  };
}

// Route guard presets for common patterns
export const RoleGuards = {
  // Financial routes - financeiro_tenant, admin_tenant, org_finance, org_admin
  financial: ['financeiro_tenant', 'admin_tenant', 'org_finance', 'org_admin'] as AppRole[],
  
  // Support routes - suporte, admin_tenant, org_admin
  support: ['suporte', 'admin_tenant', 'org_admin'] as AppRole[],
  
  // Configuration routes - admin_tenant, org_admin
  config: ['admin_tenant', 'org_admin'] as AppRole[],
  
  // Any admin (tenant or org level)
  anyAdmin: ['admin_tenant', 'org_admin', 'unit_admin'] as AppRole[],
  
  // Organization level only
  orgLevel: ['org_admin', 'org_finance'] as AppRole[],
};
