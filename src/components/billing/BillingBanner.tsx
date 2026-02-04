import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CreditCard } from "lucide-react";
import { useBilling } from "@/hooks/useBilling";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function BillingBanner() {
    const { status, loading } = useBilling();
    const navigate = useNavigate();

    if (loading || !status || status === 'active' || status === 'trialing' || status === 'incomplete') {
        return null;
    }

    if (status === 'past_due' || status === 'unpaid') {
        return (
            <Alert variant="destructive" className="mb-4 border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Ação Necessária</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                    <span>
                        Identificamos uma pendência no seu pagamento. Atualize seus dados para evitar interrupção do serviço.
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-4 bg-background hover:bg-accent"
                        onClick={() => navigate('/configuracoes')}
                    >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Regularizar
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    if (status === 'canceled') {
        return (
            <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Assinatura Cancelada</AlertTitle>
                <AlertDescription className="flex items-center justify-between">
                    <span>
                        Sua assinatura foi cancelada. Reative para continuar usando o CleanFlow.
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="ml-4"
                        onClick={() => navigate('/configuracoes')}
                    >
                        Reativar Assinatura
                    </Button>
                </AlertDescription>
            </Alert>
        );
    }

    return null;
}
