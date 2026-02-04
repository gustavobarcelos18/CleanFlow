import { AdminLayout } from "@/components/layout/AdminLayout";
import { IntegrationsConfig } from "@/components/admin/IntegrationsConfig";

export default function Integrations() {
    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Integrações</h1>
                    <p className="text-muted-foreground">
                        Gerencie as integrações com plataformas externas e provedores.
                    </p>
                </div>
                <IntegrationsConfig />
            </div>
        </AdminLayout>
    );
}
