import React from 'react';
import { TenantTimeline } from '@/components/governance/TenantTimeline';
import { RetentionSettings } from '@/components/governance/RetentionSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck } from 'lucide-react';

export default function GovernancaTenant() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Governança do Tenant</h1>
                    <p className="text-muted-foreground">
                        Gerencie logs, auditoria e políticas de retenção de dados.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="timeline" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="timeline">Timeline de Eventos</TabsTrigger>
                    <TabsTrigger value="retention">Retenção de Dados</TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="space-y-4">
                    <TenantTimeline />
                </TabsContent>

                <TabsContent value="retention" className="space-y-4">
                    <RetentionSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}
