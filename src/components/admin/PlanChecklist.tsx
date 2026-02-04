import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useBilling } from "@/hooks/useBilling";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Zap, Users, MessageSquare } from "lucide-react";
import { useNavigate } from 'react-router-dom';

export function PlanChecklist() {
    const { planCode, loading: billingLoading } = useBilling();
    const navigate = useNavigate();
    const [usage, setUsage] = useState({
        clients: 0,
        professionals: 0,
        messages: 0
    });
    const [limits, setLimits] = useState({
        clients: Infinity,
        professionals: 1,
        messages: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (planCode) {
            fetchUsageAndLimits();
        }
    }, [planCode]);

    const fetchUsageAndLimits = async () => {
        setLoading(true);
        try {
            // Fetch Usage
            // Mocking usage fetch for now, ideally this comes from a view or rpc
            const { count: clientCount } = await supabase.from('pacientes').select('*', { count: 'exact', head: true });
            const { count: profCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'profissional');

            // Mock message usage (would come from a message_logs table)
            const messageCount = 120;

            setUsage({
                clients: clientCount || 0,
                professionals: profCount || 1,
                messages: messageCount
            });

            // Set Limits based on Plan Code
            // This should ideally come from the plans table or a config
            let newLimits = { clients: Infinity, professionals: 1, messages: 0 };

            if (planCode === 'free_solo') {
                newLimits = { clients: 50, professionals: 1, messages: 0 };
            } else if (planCode === 'pro_solo') {
                newLimits = { clients: Infinity, professionals: 1, messages: 500 };
            } else if (planCode === 'clinic') {
                newLimits = { clients: Infinity, professionals: 5, messages: 2000 };
            }

            setLimits(newLimits);

        } catch (error) {
            console.error("Error fetching usage:", error);
        } finally {
            setLoading(false);
        }
    };

    if (billingLoading || loading) {
        return <Card><CardContent className="p-6"><Loader2 className="animate-spin" /></CardContent></Card>;
    }

    const getPlanName = (code: string | null) => {
        switch (code) {
            case 'free_solo': return 'Free Solo';
            case 'pro_solo': return 'Pro Solo';
            case 'clinic': return 'Clínica';
            case 'multi_unit': return 'Multiunidades';
            default: return 'Desconhecido';
        }
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Resumo do Plano
                    </CardTitle>
                    <Badge variant={planCode === 'free_solo' ? 'secondary' : 'default'}>
                        {getPlanName(planCode)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Professionals */}
                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-3 w-3" /> Profissionais
                        </span>
                        <span className="font-medium">
                            {usage.professionals} / {limits.professionals === Infinity ? '∞' : limits.professionals}
                        </span>
                    </div>
                    {limits.professionals !== Infinity && (
                        <Progress value={(usage.professionals / limits.professionals) * 100} />
                    )}
                </div>

                {/* Clients */}
                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Clientes</span>
                        <span className="font-medium">
                            {usage.clients} / {limits.clients === Infinity ? '∞' : limits.clients}
                        </span>
                    </div>
                    {limits.clients !== Infinity && (
                        <Progress value={(usage.clients / limits.clients) * 100} className={usage.clients >= limits.clients ? "bg-red-100" : ""} />
                    )}
                </div>

                {/* Messages */}
                {limits.messages > 0 && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="flex items-center gap-2 text-muted-foreground">
                                <MessageSquare className="h-3 w-3" /> Mensagens WhatsApp
                            </span>
                            <span className="font-medium">
                                {usage.messages} / {limits.messages}
                            </span>
                        </div>
                        <Progress value={(usage.messages / limits.messages) * 100} />
                    </div>
                )}

                {/* Upgrade Call to Action */}
                {planCode === 'free_solo' && (
                    <div className="pt-2">
                        <Button
                            variant="outline"
                            className="w-full border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                            onClick={() => navigate('/admin/planos')}
                        >
                            Fazer Upgrade
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
