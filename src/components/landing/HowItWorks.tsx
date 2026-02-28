import React from "react";
import { Settings, MessageSquare, BarChart3 } from "lucide-react";

const passos = [
  {
    numero: "01",
    icon: Settings,
    titulo: "Configura agenda e serviços",
    descricao:
      "Cadastre profissionais, salas, horários e procedimentos. Leva minutos.",
  },
  {
    numero: "02",
    icon: MessageSquare,
    titulo: "Liga as automações de WhatsApp",
    descricao:
      "Confirmações, lembretes e encaixes automáticos funcionando no mesmo dia.",
  },
  {
    numero: "03",
    icon: BarChart3,
    titulo: "Acompanha ocupação, faltas e caixa",
    descricao: "Painel em tempo real com tudo que importa. Decisão em minutos.",
  },
];

export function HowItWorks() {
  return (
    <section
      className="py-16 md:py-24 bg-transparent relative z-10"
      id="como-funciona"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 mb-3">
              Simples assim
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Como funciona em{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                3 passos
              </span>
            </h2>
            <p className="text-[#A9B7D0] mt-3 text-base max-w-xl mx-auto">
              Configurou uma vez. O sistema trabalha pra você 24 horas por dia.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div
              className="hidden md:block absolute top-10 left-[calc(33%_+_48px)] right-[calc(33%_+_48px)] h-px bg-gradient-to-r from-cyan-400/30 to-cyan-400/30"
              aria-hidden="true"
            />

            {passos.map((passo) => {
              const Icon = passo.icon;
              return (
                <div
                  key={passo.numero}
                  className="bg-[#0B1220] border border-[#1B2A40] rounded-2xl p-8 text-center hover:border-cyan-400/30 transition-colors duration-300 relative"
                >
                  <div className="w-16 h-16 mx-auto bg-cyan-400/10 border border-cyan-400/20 rounded-2xl flex items-center justify-center mb-5">
                    <Icon
                      className="h-8 w-8 text-cyan-400"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">
                    {passo.titulo}
                  </h3>
                  <p className="text-[#A9B7D0] text-sm leading-relaxed">
                    {passo.descricao}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
