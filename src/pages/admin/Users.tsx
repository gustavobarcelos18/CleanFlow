import { AdminLayout } from "@/components/layout/AdminLayout";
import { SupportTeamManagement } from "@/components/admin/SupportTeamManagement";
import { SupportPermissionsManagement } from "@/components/admin/SupportPermissionsManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminUsers() {
  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie usuários de suporte e suas permissões
          </p>
        </div>

        <Tabs defaultValue="team" className="space-y-4">
          <TabsList>
            <TabsTrigger value="team">Equipe de Suporte</TabsTrigger>
            <TabsTrigger value="permissions">Permissões</TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="space-y-4">
            <SupportTeamManagement />
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <SupportPermissionsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}