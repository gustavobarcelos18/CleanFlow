import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { differenceInMinutes, differenceInSeconds, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AtendimentoTimerProps {
  inicioAtendimento: Date;
  duracaoMinutos: number;
  proximoAtendimento?: Date;
}

export function AtendimentoTimer({ 
  inicioAtendimento, 
  duracaoMinutos,
  proximoAtendimento 
}: AtendimentoTimerProps) {
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [tempoRestante, setTempoRestante] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      
      // Tempo decorrido desde o início
      const decorrido = differenceInSeconds(now, inicioAtendimento);
      setTempoDecorrido(decorrido);

      // Tempo até o próximo atendimento
      if (proximoAtendimento) {
        const restante = differenceInSeconds(proximoAtendimento, now);
        setTempoRestante(restante);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [inicioAtendimento, proximoAtendimento]);

  const formatarTempo = (segundos: number) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;

    if (horas > 0) {
      return `${horas}h ${minutos}m ${segs}s`;
    }
    if (minutos > 0) {
      return `${minutos}m ${segs}s`;
    }
    return `${segs}s`;
  };

  const getStatusColor = () => {
    const minutosDecorridos = tempoDecorrido / 60;
    const percentual = (minutosDecorridos / duracaoMinutos) * 100;

    if (percentual >= 100) return "text-destructive";
    if (percentual >= 75) return "text-warning";
    return "text-success";
  };

  const getStatusIcon = () => {
    const minutosDecorridos = tempoDecorrido / 60;
    const percentual = (minutosDecorridos / duracaoMinutos) * 100;

    if (percentual >= 100) return <AlertTriangle className="h-5 w-5" />;
    if (percentual >= 75) return <Clock className="h-5 w-5" />;
    return <CheckCircle2 className="h-5 w-5" />;
  };

  const getBackgroundColor = () => {
    const minutosDecorridos = tempoDecorrido / 60;
    const percentual = (minutosDecorridos / duracaoMinutos) * 100;

    if (percentual >= 100) return "bg-destructive/5 border-destructive/20";
    if (percentual >= 75) return "bg-warning/5 border-warning/20";
    return "bg-success/5 border-success/20";
  };

  const minutosDecorridos = Math.floor(tempoDecorrido / 60);
  const segundosDecorridos = tempoDecorrido % 60;
  const percentualTempo = Math.min((tempoDecorrido / 60 / duracaoMinutos) * 100, 100);

  return (
    <Card className={getBackgroundColor()}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`${getStatusColor()}`}>
                {getStatusIcon()}
              </div>
              <h3 className="font-semibold">Cronômetro de Atendimento</h3>
            </div>
            <Badge variant="outline" className="text-xs">
              Duração prevista: {duracaoMinutos}min
            </Badge>
          </div>

          {/* Tempo Decorrido */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tempo decorrido:</span>
              <span className={`font-mono font-bold text-2xl ${getStatusColor()}`}>
                {String(minutosDecorridos).padStart(2, '0')}:
                {String(segundosDecorridos).padStart(2, '0')}
              </span>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  percentualTempo >= 100 
                    ? 'bg-destructive' 
                    : percentualTempo >= 75 
                    ? 'bg-warning' 
                    : 'bg-success'
                }`}
                style={{ width: `${Math.min(percentualTempo, 100)}%` }}
              />
            </div>

            <div className="text-xs text-muted-foreground text-center">
              {percentualTempo >= 100 
                ? `Excedido em ${Math.floor(tempoDecorrido / 60) - duracaoMinutos} minutos`
                : `${Math.floor(percentualTempo)}% do tempo previsto`
              }
            </div>
          </div>

          {/* Próximo Atendimento */}
          {proximoAtendimento && tempoRestante !== null && (
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Próximo paciente em:</span>
                <div className="text-right">
                  {tempoRestante > 0 ? (
                    <>
                      <span className="font-mono font-semibold text-lg">
                        {formatarTempo(tempoRestante)}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        às {format(proximoAtendimento, "HH:mm", { locale: ptBR })}
                      </div>
                    </>
                  ) : (
                    <Badge variant="destructive" className="animate-pulse">
                      Paciente aguardando!
                    </Badge>
                  )}
                </div>
              </div>

              {tempoRestante < 300 && tempoRestante > 0 && (
                <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 p-2 rounded">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Menos de 5 minutos para o próximo atendimento</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
