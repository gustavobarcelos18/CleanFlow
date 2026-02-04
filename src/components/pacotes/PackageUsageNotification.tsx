import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, RefreshCw } from "lucide-react";

interface PackageUsageNotificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageName: string;
  currentSession: number;
  totalSessions: number;
  remainingSessions: number;
  shouldOfferRenewal: boolean;
  onRenewPackage?: () => void;
}

export function PackageUsageNotification({
  open,
  onOpenChange,
  packageName,
  currentSession,
  totalSessions,
  remainingSessions,
  shouldOfferRenewal,
  onRenewPackage
}: PackageUsageNotificationProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <AlertDialogTitle>Procedimento Executado</AlertDialogTitle>
              <AlertDialogDescription className="text-xs">
                Pacote: {packageName}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso do Pacote</span>
              <Package className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sessão atual:</span>
                <span className="font-semibold">{currentSession} de {totalSessions}</span>
              </div>
              
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${(currentSession / totalSessions) * 100}%` }}
                />
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sessões restantes:</span>
                <span className="font-semibold text-primary">{remainingSessions}</span>
              </div>
            </div>
          </div>

          {shouldOfferRenewal && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">
                    Renove seu pacote agora!
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Você está próximo de finalizar seu pacote. Renove agora para continuar aproveitando os benefícios.
                  </p>
                  {onRenewPackage && (
                    <Button
                      size="sm"
                      onClick={() => {
                        onRenewPackage();
                        onOpenChange(false);
                      }}
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Renovar Pacote
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            Entendido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
