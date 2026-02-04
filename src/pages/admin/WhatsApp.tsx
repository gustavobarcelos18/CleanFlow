import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminWhatsAppManagement } from "@/components/admin/AdminWhatsAppManagement";

export default function WhatsAppPage() {
    return (
        <AdminLayout>
            <div className="p-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold">Gerenciamento WhatsApp</h1>
                    <p className="text-muted-foreground">
                        Configure provedores, números e pacotes de WhatsApp
                    </p>
                </div>
                <AdminWhatsAppManagement />
            </div>
        </AdminLayout>
    );
}
