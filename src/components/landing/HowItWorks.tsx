import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Stethoscope, Calendar, MessageCircle, Activity } from "lucide-react";
import { FluxoCompletoDialog } from "./FluxoCompletoDialog";

export function HowItWorks() {
  const [fluxoDialogOpen, setFluxoDialogOpen] = useState(false);

  const steps = [
    {
      number: 1,
      icon: Settings,
      title: "Configure seu modo de agenda",
      description: "Escolha: agenda por profissional de saúde ou por consultório/sala",
    },
    {
      number: 2,
      icon: Stethoscope,
      title: "Cadastre procedimentos e especialidades",
      description: "Procedimentos médicos, duração, preço e especialidades (odonto, fisio, estética, clínica geral...)",
    },
    {
      number: 3,
      icon: Calendar,
      title: "Paciente agenda pelo link",
      description: "Link público com consentimento LGPD integrado",
    },
    {
      number: 4,
      icon: MessageCircle,
      title: "Confirmações automáticas e encaixes",
      description:
        "CleanFlow gerencia lembretes de consultas e preenche vagas automaticamente com pacientes da lista de espera",
    },
    {
      number: 5,
      icon: Activity,
      title: "Acompanhe no Painel do Dia da Clínica",
      description: "Recepcionistas visualizam riscos de falta por paciente e fazem ações preventivas rapidamente",
    },
  ];

  return (
    <>
      <FluxoCompletoDialog open={fluxoDialogOpen} onOpenChange={setFluxoDialogOpen} />
      <section id="como-funciona" className="py-12 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 md:mb-4">
              Da marcação da consulta ao atendimento sem transtornos
            </h2>
          </div>

          <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="flex gap-6 items-start bg-card border border-border rounded-xl p-6 hover:shadow-medical transition-shadow"
                >
                  <div className="flex-shrink-0">
                    <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                      {step.number}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="h-6 w-6 text-primary" />
                      <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12">
            <Button variant="outline" size="lg" onClick={() => setFluxoDialogOpen(true)}>
              Ver fluxo completo
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
