import React from "react";
import {
  CheckCircle,
  XCircle,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import patientImage from "@/assets/patient-satisfied.jpg";

export function BeforeAfter() {
  const beforeItems = [
    "Telefone tocando sem parar e papelada espalhada",
    "Buracos na agenda que ninguém avisou",
    "Secretária focada apenas em confirmar horários",
    "Faturamento imprevisível no fim do mês",
  ];

  const afterItems = [
    "Painel limpo, pacientes confirmados automaticamente",
    "Agenda lotada, com encaixes feitos pela IA",
    "Secretária focada em atender bem e vender",
    "Crescimento constante e receita garantida",
  ];

  return (
    <section className="py-12 md:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8 md:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 rounded-full border border-success/20 mb-6">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">
              Resultados Comprovados
            </span>
          </div>
          <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4">
            Antes e depois do CleanFlow
          </h2>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Veja a transformação real que o CleanFlow traz para o seu
            atendimento
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start mb-8 md:mb-12">
          <div className="space-y-8">
            <div className="bg-card border-2 border-destructive/20 rounded-2xl p-8 space-y-6 shadow-lg">
              <div className="mb-6">
                <h3 className="text-5xl font-bold text-destructive">Antes</h3>
              </div>
              {beforeItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-destructive/5 rounded-xl"
                >
                  <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-foreground leading-relaxed">{item}</p>
                </div>
              ))}
            </div>

            <div className="bg-card border-2 border-success/20 rounded-2xl p-8 space-y-6 shadow-lg">
              <div className="mb-6">
                <h3 className="text-5xl font-bold text-success">Depois</h3>
              </div>
              {afterItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-success/5 rounded-xl"
                >
                  <CheckCircle className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                  <p className="text-foreground leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border">
              <img
                src={patientImage}
                alt="Profissional de saúde satisfeito em consultório moderno"
                className="w-full h-auto object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-success/10 to-success/5 border-2 border-success/20 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-14 h-14 bg-success rounded-2xl flex items-center justify-center">
                    <TrendingDown className="h-7 w-7 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground text-center mb-1">
                  -60%
                </p>
                <p className="text-sm text-muted-foreground text-center leading-tight">
                  Redução de faltas
                </p>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center">
                    <TrendingUp className="h-7 w-7 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-foreground text-center mb-1">
                  +45%
                </p>
                <p className="text-sm text-muted-foreground text-center leading-tight">
                  Aumento de faturamento
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-accent/10 to-accent/5 border-2 border-accent/20 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-accent rounded-2xl flex items-center justify-center">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground mb-1">92%</p>
                  <p className="text-sm text-muted-foreground leading-tight">
                    Taxa de confirmação de pacientes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
