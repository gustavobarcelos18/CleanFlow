import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SLAIndicatorProps {
  sla: {
    inicio?: string;
    limite?: string;
    atingido?: boolean;
    tempo_resposta_horas?: number;
    tempo_resolucao_horas?: number;
  };
  status: string;
}

export const SLAIndicator = ({ sla, status }: SLAIndicatorProps) => {
  if (!sla || !sla.limite) {
    return null;
  }

  const now = new Date();
  const limite = new Date(sla.limite);
  const inicio = sla.inicio ? new Date(sla.inicio) : new Date();
  
  const tempoRestante = limite.getTime() - now.getTime();
  const tempoTotal = limite.getTime() - inicio.getTime();
  const percentualGasto = ((tempoTotal - tempoRestante) / tempoTotal) * 100;
  
  const horasRestantes = Math.floor(tempoRestante / (1000 * 60 * 60));
  const minutosRestantes = Math.floor((tempoRestante % (1000 * 60 * 60)) / (1000 * 60));
  
  // Ticket resolvido ou fechado
  if (status === 'resolved' || status === 'closed') {
    const resolveuNoSla = sla.atingido === false; // Se false, significa que resolveu antes do limite
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant={resolveuNoSla ? "default" : "destructive"} className="gap-1">
              {resolveuNoSla ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertCircle className="h-3 w-3" />
              )}
              SLA {resolveuNoSla ? "Cumprido" : "Estourado"}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tempo de resposta: {sla.tempo_resposta_horas}h</p>
            <p>Tempo de resolução: {sla.tempo_resolucao_horas}h</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // SLA estourado (já passou do limite)
  if (tempoRestante <= 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              SLA Estourado
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Limite: {limite.toLocaleString('pt-BR')}</p>
            <p>Atrasado: {Math.abs(horasRestantes)}h {Math.abs(minutosRestantes)}m</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // SLA em risco (menos de 20% do tempo restante)
  if (percentualGasto >= 80) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-600 dark:text-yellow-400">
              <Clock className="h-3 w-3" />
              SLA em Risco
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Tempo restante: {horasRestantes}h {minutosRestantes}m</p>
            <p>Limite: {limite.toLocaleString('pt-BR')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  // SLA OK
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            SLA OK
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>Tempo restante: {horasRestantes}h {minutosRestantes}m</p>
          <p>Limite: {limite.toLocaleString('pt-BR')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};