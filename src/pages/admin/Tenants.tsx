import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { TenantManagement } from "@/components/admin/TenantManagement";
import { PlanManagement } from "@/components/admin/PlanManagement";
import { PriceManagement } from "@/components/admin/PriceManagement";
import { InvoiceManagement } from "@/components/admin/InvoiceManagement";
import { DunningManagement } from "@/components/admin/DunningManagement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminTenants() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Tenants</h1>
          <p className="text-muted-foreground">
            Gerencie clientes, planos e assinaturas
          </p>
        </div>

        <Tabs defaultValue="tenants" className="space-y-4">
          <TabsList>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="plans">Planos</TabsTrigger>
            <TabsTrigger value="prices">Preços & FX</TabsTrigger>
            <TabsTrigger value="invoices">Faturas</TabsTrigger>
            <TabsTrigger value="dunning">Cobrança</TabsTrigger>
          </TabsList>

          <TabsContent value="tenants" className="space-y-4">
            <TenantManagement />
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <PlanManagement />
          </TabsContent>

          <TabsContent value="prices" className="space-y-4">
            <PriceManagement />
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            <InvoiceManagement />
          </TabsContent>

          <TabsContent value="dunning" className="space-y-4">
            <DunningManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}