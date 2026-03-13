import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnitManagement } from '@/components/units/UnitManagement';
import { UnitPolicyManager } from '@/components/organization/UnitPolicyManager';
import { OrganizationDashboard } from '@/components/organization/OrganizationDashboard';
import { useOrganizationContext } from '@/hooks/useOrganizationContext';
import { Building2, Shield, BarChart3, Settings, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';

const OrganizationManager = () => {
  const { organization, isOrgAdmin, isLoading } = useOrganizationContext();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8 text-center">Carregando...</div>
      </MainLayout>
    );
  }

  if (!organization) {
    return (
      <MainLayout>
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Sem Organização</h2>
          <p className="text-muted-foreground">
            Você não está vinculado a uma organização com múltiplas unidades.
          </p>
        </Card>
      </MainLayout>
    );
  }

  if (!isOrgAdmin) {
    return (
      <MainLayout>
        <Card className="p-8 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground">
            Apenas administradores da organização podem acessar esta área.
          </p>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-muted/30 pb-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-300 dark:to-gray-600 pr-2 pb-1">
              Gestão da Organização
            </h1>
            <p className="text-muted-foreground font-medium">
              Gerencie suas unidades, permissões e visualize dados consolidados
            </p>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="units" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Unidades</span>
            </TabsTrigger>
            <TabsTrigger value="policies" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Políticas</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <OrganizationDashboard />
          </TabsContent>

          <TabsContent value="units">
            <UnitManagement />
          </TabsContent>

          <TabsContent value="policies">
            <UnitPolicyManager />
          </TabsContent>

          <TabsContent value="users">
            <Card className="p-8 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Gestão de Usuários</h3>
              <p>Gerencie os usuários e suas permissões em cada unidade.</p>
              <p className="text-sm mt-2">(Em desenvolvimento)</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default OrganizationManager;
