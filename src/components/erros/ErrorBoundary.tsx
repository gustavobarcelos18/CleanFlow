import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCcw, Home, Copy, Check } from "lucide-react";
import { reportarErro } from "@/lib/reportarErro";

interface Props {
    children: ReactNode;
    user_id?: string | null;
    tenant_id?: string | null;
    organization_id?: string | null;
    organization_unit_id?: string | null;
}

interface State {
    hasError: boolean;
    error: Error | null;
    copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        copied: false
    };

    public static getDerivedStateFromError(error: Error): State {
        // Atualiza o estado para que a próxima renderização mostre a UI de fallback.
        return { hasError: true, error, copied: false };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Reportar o erro automaticamente para o suporte
        reportarErro(error, {
            user_id: this.props.user_id,
            tenant_id: this.props.tenant_id,
            organization_id: this.props.organization_id,
            organization_unit_id: this.props.organization_unit_id,
            metadata: {
                componentStack: errorInfo.componentStack
            }
        });

        console.error("Uncaught error captured by ErrorBoundary:", error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    private handleGoHome = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = "/";
    };

    private copyErrorDetails = () => {
        if (this.state.error) {
            const details = `URL: ${window.location.href}\nErro: ${this.state.error.name}: ${this.state.error.message}\nStack: ${this.state.error.stack}`;
            navigator.clipboard.writeText(details);
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 2000);
        }
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen w-full flex items-center justify-center p-4 bg-muted/30">
                    <Card className="w-full max-w-md shadow-lg border-destructive/20 transition-all animate-in fade-in zoom-in duration-300">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-4">
                                <AlertCircle className="h-10 w-10 text-destructive" />
                            </div>
                            <CardTitle className="text-2xl font-bold tracking-tight">Ocorreu um erro</CardTitle>
                            <CardDescription className="text-sm mt-2">
                                Infelizmente, algo deu errado na renderização desta página. Nossa equipe de suporte já foi notificada.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-4">
                            <div className="bg-muted p-3 rounded-md border text-[10px] font-mono overflow-auto max-h-[120px] text-muted-foreground whitespace-pre-wrap">
                                {this.state.error?.name}: {this.state.error?.message}
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2 pt-2">
                            <div className="flex w-full gap-2">
                                <Button
                                    onClick={this.handleReset}
                                    variant="default"
                                    className="flex-1 gap-2"
                                >
                                    <RefreshCcw className="h-4 w-4" />
                                    Recarregar
                                </Button>
                                <Button
                                    onClick={this.handleGoHome}
                                    variant="outline"
                                    className="flex-1 gap-2"
                                >
                                    <Home className="h-4 w-4" />
                                    Início
                                </Button>
                            </div>
                            <Button
                                onClick={this.copyErrorDetails}
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs text-muted-foreground hover:bg-transparent"
                            >
                                {this.state.copied ? (
                                    <>
                                        <Check className="h-3 w-3 mr-2 text-success" />
                                        Copiado para o suporte
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-3 w-3 mr-2" />
                                        Copiar detalhes técnicos
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}
