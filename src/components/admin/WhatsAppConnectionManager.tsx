import { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { useWhatsAppConnection } from "@/hooks/useWhatsAppConnection";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Smartphone, LogOut, RefreshCw, AlertTriangle, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  isActiveTab: boolean;
}

export function WhatsAppConnectionManager({ isActiveTab }: Props) {
  const { session } = useAuth();
  const [tenantId, setTenantId] = useState<string | undefined>();
  
  // Safe local countdown purely for the UI. No DB edits here.
  const [qrCountdown, setQrCountdown] = useState<number>(45);

  useEffect(() => {
    async function loadTenant() {
      if (!session?.user?.id) return;
      const { data } = await supabase
        .from("rbac_usuarios")
        .select("tenant_id")
        .eq("id", session.user.id)
        .maybeSingle();

      if (data?.tenant_id) {
        setTenantId(data.tenant_id);
      }
    }
    loadTenant();
  }, [session]);

  const { instance, isLoading, isPolling, createInstance, updateStatus } = useWhatsAppConnection(tenantId, isActiveTab);

  // Local QR TTL logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (instance?.status === 'QR_READY' && instance?.qr_code) {
      setQrCountdown(45);
      interval = setInterval(() => {
        setQrCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setQrCountdown(45);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [instance?.status, instance?.qr_code]);

  if (isLoading) {
    return (
      <Card className="bg-card/30 border border-border/50 backdrop-blur-md rounded-xl p-5">
        <div className="flex items-center space-x-4">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando instância...</p>
        </div>
      </Card>
    );
  }

  // --- EMPTY STATE (Scenario A/B UX) ---
  if (!instance) {
    return (
      <Card className="bg-card/30 border border-border/50 backdrop-blur-md rounded-xl">
        <CardContent className="flex flex-col items-center justify-center min-h-[250px] p-6 text-center space-y-4">
          <Smartphone className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-bold">Nenhuma instância vinculada</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1">
              Sua organização ainda não possui uma instância do WhatsApp conectada.
            </p>
          </div>
          <Button onClick={createInstance}>
            Criar Instância
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Helpers
  const isQrVisible = instance.status === 'QR_READY' && instance.qr_code && qrCountdown > 0;
  
  const getBadgeVariant = () => {
    switch(instance.status) {
      case 'CONNECTED': return 'default'; // standard primary or green
      case 'DISCONNECTED': return 'secondary';
      case 'QUARANTINE': return 'destructive';
      case 'CONNECTING': 
      case 'QR_READY':
        return 'outline';
      default: return 'outline';
    }
  };

  const formattedActivity = instance.last_activity 
    ? formatDistanceToNow(new Date(instance.last_activity), { addSuffix: true, locale: ptBR })
    : 'Nunca';

  return (
    <div className="space-y-6">
      {/* SLIM TOOLBAR -> STATUS BANNER */}
      <div className="bg-card/30 border border-border/50 backdrop-blur-md p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center hidden sm:flex">
             <Smartphone className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold truncate leading-none">{instance.name}</h2>
              <Badge variant={getBadgeVariant()} className="text-[10px] sm:text-xs">
                {instance.status}
              </Badge>
              {isPolling && <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse ml-1" title="Polling ativo" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Último sinal: {formattedActivity}
            </p>
          </div>
        </div>
        
        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto shrink-0">
          {instance.status === 'DISCONNECTED' && (
             <Button onClick={() => updateStatus('CONNECTING')} className="w-full sm:w-auto gap-2">
               <QrCode className="h-4 w-4" /> Conectar
             </Button>
          )}

          {instance.status === 'QUARANTINE' && (
             <Button disabled variant="destructive" className="w-full sm:w-auto gap-2" title="Instância retida por excesso de falhas. Ação administrativa necessária.">
               <AlertTriangle className="h-4 w-4" /> Quarentena (Contate Suporte)
             </Button>
          )}

          {['CONNECTED', 'CONNECTING', 'QR_READY'].includes(instance.status) && (
            <Button onClick={() => updateStatus('DISCONNECTED')} variant="outline" className="w-full sm:w-auto gap-2 hover:bg-destructive/10 hover:text-destructive">
               <LogOut className="h-4 w-4" /> Desconectar
            </Button>
          )}
        </div>
      </div>

      {/* QR CODE DISPLAY BOX */}
      {(instance.status === 'QR_READY' || instance.status === 'CONNECTING') && (
        <Card className="bg-card/50 overflow-hidden border border-border/40 max-w-sm mx-auto sm:mx-0">
          <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
            {instance.status === 'CONNECTING' ? (
              <div className="space-y-4 flex flex-col items-center">
                 <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                 <p className="text-sm text-muted-foreground">Iniciando dispositivo e gerando QR Code...</p>
                 <p className="text-xs text-muted-foreground mt-2">Aguarde, isso pode levar alguns segundos.</p>
              </div>
            ) : isQrVisible ? (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  {/* react-qr-code accepts raw string safely and renders SVG */}
                  <QRCode value={instance.qr_code!} size={192} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Escaneie o QR Code</p>
                  <p className="text-xs text-muted-foreground">Abra o WhatsApp {">"} Aparelhos Conectados</p>
                </div>
                <Badge variant="outline" className={qrCountdown < 10 ? "text-destructive border-destructive/50" : ""}>
                   Expira em {qrCountdown}s
                </Badge>
              </div>
            ) : (
              <div className="space-y-4 flex flex-col items-center">
                 <AlertTriangle className="h-8 w-8 text-destructive" />
                 <p className="text-sm text-foreground font-medium">QR Code expirado</p>
                 <Button onClick={() => updateStatus('CONNECTING')} variant="outline" size="sm" className="mt-2">
                   Gerar Novo QR Code
                 </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
