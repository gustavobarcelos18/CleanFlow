import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Info } from "lucide-react";
import { useBilling } from "@/hooks/useBilling";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface PlanFeature {
    name: string;
    included: boolean;
    limit?: string;
}

interface Plan {
    id: string;
    name: string;
    price: string;
    description: string;
    features: PlanFeature[];
    highlight?: boolean;
    buttonText: string;
    action: () => void;
}

import { PlanChecklist } from "@/components/admin/PlanChecklist";

export default function Planos() {
    const { planCode, loading } = useBilling();
    const { profile } = useAuth();

    const handleSubscribe = async (newPlanCode: string) => {
        try {
            const { error } = await supabase.functions.invoke('billing-ops', {
                body: {
                    action: 'change_plan',
                    tenantId: profile?.tenant_id,
                    newPlanCode: newPlanCode,
                    effective: 'immediate'
                }
            });

            if (error) throw error;
            toast.success("Plano atualizado com sucesso!");
        } catch (error) {
            console.error(error);
            toast.error("Erro ao atualizar plano.");
        }
    };

    const plans: Plan[] = [
        {
            id: 'free_solo',
            name: 'Free Solo',
            price: 'R$ 0,00',
            description: 'A porta de entrada para digitalizar seu consultório.',
            buttonText: planCode === 'free_solo' ? 'Plano Atual' : 'Começar Grátis',
            action: () => handleSubscribe('free_solo'),
            features: [
                { name: '1 Profissional', included: true },
                { name: 'Até 50 Clientes', included: true, limit: '50' },
                { name: 'Agenda Online', included: true },
                { name: 'Prontuário Eletrônico', included: true },
                { name: 'WhatsApp Automatizado', included: false },
                { name: 'Gestão Financeira', included: false },
            ]
        },
        {
            id: 'pro_solo',
            name: 'Pro Solo',
            price: 'R$ 299,00',
            description: 'Automatize sua rotina e fidelize pacientes.',
            highlight: true,
            buttonText: planCode === 'pro_solo' ? 'Plano Atual' : 'Fazer Upgrade',
            action: () => handleSubscribe('pro_solo'),
            features: [
                { name: '1 Profissional', included: true },
                { name: 'Clientes Ilimitados', included: true },
                { name: 'Agenda Online', included: true },
                { name: 'Prontuário Eletrônico', included: true },
                { name: 'WhatsApp Automatizado', included: true, limit: '500 msgs/mês' },
                { name: 'Gestão Financeira Completa', included: true },
            ]
        },
        {
            id: 'clinic',
            name: 'Clínica / Empresa',
            price: 'R$ 699,00',
            description: 'Gestão avançada para equipes e clínicas.',
            buttonText: planCode === 'clinic' ? 'Plano Atual' : 'Fazer Upgrade',
            action: () => handleSubscribe('clinic'),
            features: [
                { name: '5 Profissionais + 3 Secretárias', included: true },
                { name: 'Clientes Ilimitados', included: true },
                { name: 'Múltiplas Agendas', included: true },
                { name: 'Prontuário Compartilhado', included: true },
                { name: 'WhatsApp Automatizado', included: true, limit: '2000 msgs/mês' },
                { name: 'Gestão Financeira Avançada', included: true },
                { name: 'Relatórios de BI', included: true },
            ]
        },
        {
            id: 'multi_unit',
            name: 'Multiunidades',
            price: 'Sob Consulta',
            description: 'Para redes de clínicas e franquias.',
            buttonText: 'Falar com Vendas',
            action: () => window.open('https://wa.me/5511999999999', '_blank'),
            features: [
                { name: 'Unidades Ilimitadas', included: true },
                { name: 'Painel de Governança', included: true },
                { name: 'Relatórios Consolidados', included: true },
                { name: 'Gestão Centralizada', included: true },
                { name: 'API Dedicada', included: true },
                { name: 'Desconto Progressivo', included: true },
            ]
        }
    ];

    if (loading) return <div className="p-8 text-center">Carregando planos...</div>;

    return (
        <div className="container mx-auto p-6 space-y-8">
            {planCode && (
                <div className="mb-8">
                    <PlanChecklist />
                </div>
            )}

            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Escolha o plano ideal para você</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Comece gratuitamente e evolua conforme sua clínica cresce. Sem contratos de fidelidade.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                {plans.map((p) => (
                    <Card key={p.id} className={`flex flex-col ${p.highlight ? 'border-primary shadow-lg scale-105 relative' : ''}`}>
                        {p.highlight && (
                            <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                <Badge className="bg-primary text-primary-foreground px-3 py-1">Mais Popular</Badge>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-2xl">{p.name}</CardTitle>
                            <div className="mt-2 mb-4">
                                <span className="text-3xl font-bold">{p.price}</span>
                                {p.price !== 'Sob Consulta' && <span className="text-muted-foreground">/mês</span>}
                            </div>
                            <CardDescription>{p.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3">
                                {p.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        {feature.included ? (
                                            <Check className="h-5 w-5 text-green-500 shrink-0" />
                                        ) : (
                                            <X className="h-5 w-5 text-muted-foreground shrink-0 opacity-50" />
                                        )}
                                        <span className={`text-sm ${!feature.included && 'text-muted-foreground opacity-50'}`}>
                                            {feature.name}
                                            {feature.limit && <span className="block text-xs font-semibold text-primary">{feature.limit}</span>}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                variant={p.highlight ? 'default' : 'outline'}
                                onClick={p.action}
                                disabled={planCode === p.id}
                            >
                                {p.buttonText}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <div className="bg-muted/50 rounded-lg p-8 mt-12 text-center">
                <h3 className="text-lg font-semibold mb-2">Precisa de mais recursos?</h3>
                <p className="text-muted-foreground mb-4">
                    Oferecemos pacotes adicionais de mensagens WhatsApp e usuários extras para qualquer plano pago.
                </p>
                <Button variant="link" className="text-primary">Ver Adicionais <Info className="ml-2 h-4 w-4" /></Button>
            </div>
        </div>
    );
}
