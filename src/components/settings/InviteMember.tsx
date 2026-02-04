
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/utils/rbac";
import { useAuth } from "@/hooks/useAuth";
import { seatManager } from "@/domain/billing/seatManager";

export function InviteMember() {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<UserRole>("receptionist");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const { profile } = useAuth();

    const handleInvite = async () => {
        setLoading(true);
        try {
            // 1. Check if user exists (optional, or handled by Supabase Auth invite)
            // For this MVP, we'll assume we are creating a profile or invitation record.
            // In a real app, use supabase.auth.admin.inviteUserByEmail (requires service role)
            // or a dedicated Edge Function.

            // We will call a hypothetical edge function 'invite-user'
            const { error } = await supabase.functions.invoke('invite-user', {
                body: { email, role }
            });

            if (error) throw error;

            // Recalcular seats após convite (assumindo que convite ocupa seat)
            if (profile?.tenant_id) {
                // Não bloqueia a UI, mas garante atualização
                seatManager.onProfessionalCreated(profile.tenant_id).catch(console.error);
            }

            toast({
                title: "Convite enviado!",
                description: `Um convite foi enviado para ${email} com o perfil de ${role}.`,
            });
            setEmail("");
        } catch (error: any) {
            console.error("Erro ao convidar:", error);
            toast({
                title: "Erro ao enviar convite",
                description: error.message || "Tente novamente mais tarde.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-lg">
            <h3 className="text-lg font-semibold">Convidar Membro da Equipe</h3>
            <div className="flex gap-2">
                <Input
                    placeholder="Email do colaborador"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Função" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="receptionist">Recepcionista</SelectItem>
                        <SelectItem value="professional">Profissional</SelectItem>
                        <SelectItem value="manager">Gerente</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleInvite} disabled={loading}>
                    {loading ? "Enviando..." : "Convidar"}
                </Button>
            </div>
        </div>
    );
}
