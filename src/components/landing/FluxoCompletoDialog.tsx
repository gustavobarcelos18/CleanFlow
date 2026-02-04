import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  UserPlus,
  Calendar,
  MessageCircle,
  CheckCircle,
  Clock,
  Users,
  Activity,
  ArrowRight,
  Mail,
  Phone,
  CalendarCheck,
  AlertCircle,
  RefreshCw
} from "lucide-react";

interface FluxoCompletoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FluxoCompletoDialog({ open, onOpenChange }: FluxoCompletoDialogProps) {
  const fluxoSteps = [
    {
      fase: "Fase 1: Agendamento",
      steps: [
        {
          icon: UserPlus,
          title: "Paciente acessa o link",
          description: "Link público da clínica com formulário de agendamento e consentimento LGPD integrado",
          color: "text-primary bg-primary/10"
        },
        {
          icon: Calendar,
          title: "Escolhe procedimento e horário",
          description: "Visualiza disponibilidade em tempo real, escolhe profissional (ou sala) e confirma",
          color: "text-primary bg-primary/10"
        },
        {
          icon: CheckCircle,
          title: "Consulta registrada",
          description: "Sistema cria o agendamento e adiciona à agenda da clínica automaticamente",
          color: "text-success bg-success/10"
        }
      ]
    },
    {
      fase: "Fase 2: Confirmação Automática",
      steps: [
        {
          icon: Clock,
          title: "D-2: Primeiro lembrete",
          description: "48 horas antes, sistema envia WhatsApp e e-mail com botões de Confirmar/Reagendar/Cancelar",
          color: "text-warning bg-warning/10"
        },
        {
          icon: MessageCircle,
          title: "H-3: Segundo lembrete",
          description: "3 horas antes, nova confirmação automática por WhatsApp para pacientes que não responderam",
          color: "text-warning bg-warning/10"
        },
        {
          icon: CalendarCheck,
          title: "Paciente confirma",
          description: "Um clique no link confirma a presença. Status atualizado em tempo real no sistema",
          color: "text-success bg-success/10"
        }
      ]
    },
    {
      fase: "Fase 3: Gestão Inteligente",
      steps: [
        {
          icon: AlertCircle,
          title: "Painel de Risco do Dia",
          description: "Recepção visualiza score de risco de falta por paciente e recebe sugestões de ação preventiva",
          color: "text-destructive bg-destructive/10"
        },
        {
          icon: RefreshCw,
          title: "Cancelamento detectado",
          description: "Paciente cancela? Sistema automaticamente notifica lista de espera em segundos",
          color: "text-warning bg-warning/10"
        },
        {
          icon: Users,
          title: "Encaixe automático",
          description: "Primeiro paciente da lista a aceitar fica com o horário. Vaga preenchida sem esforço",
          color: "text-success bg-success/10"
        }
      ]
    },
    {
      fase: "Fase 4: Atendimento e Análise",
      steps: [
        {
          icon: Activity,
          title: "Consulta realizada",
          description: "Profissional marca status como 'Concluído'. Histórico do paciente atualizado automaticamente",
          color: "text-primary bg-primary/10"
        },
        {
          icon: Mail,
          title: "Follow-up automático",
          description: "Após a consulta, sistema pode enviar pesquisa de satisfação e lembretes de retorno",
          color: "text-primary bg-primary/10"
        },
        {
          icon: Phone,
          title: "Análise de desempenho",
          description: "Relatórios mostram taxa de comparecimento, horários críticos e oportunidades de melhoria",
          color: "text-success bg-success/10"
        }
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl md:text-3xl font-bold">
            Fluxo Completo do CleanFlow
          </DialogTitle>
          <DialogDescription className="text-base">
            Veja como o sistema funciona do início ao fim, automatizando todo o processo de gestão de consultas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-6">
          {fluxoSteps.map((fase, faseIndex) => (
            <div key={faseIndex} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {faseIndex + 1}
                </div>
                <h3 className="text-xl font-bold text-foreground">{fase.fase}</h3>
              </div>

              <div className="ml-4 pl-4 border-l-2 border-border space-y-4">
                {fase.steps.map((step, stepIndex) => {
                  const Icon = step.icon;
                  const isLastStep = stepIndex === fase.steps.length - 1;

                  return (
                    <div key={stepIndex} className="relative">
                      <div className="flex gap-4 items-start bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className={`flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center ${step.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </div>

                      {!isLastStep && (
                        <div className="flex justify-center my-2">
                          <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {faseIndex < fluxoSteps.length - 1 && (
                <div className="flex items-center justify-center py-4">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-border">
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Começar agora grátis
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
