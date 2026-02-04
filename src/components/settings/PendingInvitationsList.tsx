
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';

interface Invitation {
    id: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
}

export function PendingInvitationsList() {
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchInvitations = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('team_invitations')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching invitations:', error);
        } else {
            setInvitations(data || []);
        }
        setLoading(false);
    };

    const handleCancel = async (id: string) => {
        const { error } = await supabase
            .from('team_invitations')
            .delete()
            .eq('id', id);

        if (error) {
            toast({
                title: "Erro ao cancelar",
                description: "Não foi possível cancelar o convite.",
                variant: "destructive"
            });
        } else {
            toast({
                title: "Convite cancelado",
                description: "O convite foi removido com sucesso."
            });
            fetchInvitations();
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    if (loading) return <div className="text-sm text-muted-foreground">Carregando convites...</div>;

    if (invitations.length === 0) return null;

    return (
        <div className="space-y-4 mt-6">
            <h3 className="text-lg font-semibold">Convites Pendentes</h3>
            <div className="border rounded-lg divide-y">
                {invitations.map((invite) => (
                    <div key={invite.id} className="p-4 flex items-center justify-between">
                        <div>
                            <p className="font-medium">{invite.email}</p>
                            <div className="flex gap-2 mt-1">
                                <Badge variant="outline">{invite.role}</Badge>
                                <span className="text-xs text-muted-foreground">
                                    Enviado em {new Date(invite.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => handleCancel(invite.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
