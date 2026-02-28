import React from "react";
import { Calendar, MessageSquare, Brain } from "lucide-react";

const recursos = [
  {
    icon: Calendar,
    beneficio: "Menos atraso e mais previsibilidade",
    recurso: "Agenda do dia clara",
    descricao:
      "Veja em um olhar quem chegou, quem vai chegar e quem está em risco.",
  },
  {
    icon: MessageSquare,
    beneficio: "Menos faltas e menos retrabalho",
    recurso: "WhatsApp com confirmação",
    descricao:
      "Automação humanizada que confirma, lembra e remarca sem mover um dedo.",
  },
  {
    icon: Brain,
    beneficio: "Priorize quem pode faltar",
    recurso: "IA anti-faltas",
    descricao:
      "Score de risco por paciente 48h antes. Sua equipe age preventivamente.",
  },
];

export function Features() {
  return (
    <section className="py-16 md:py-24 bg-[#0B1220]" id="funcionalidades">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 mb-3">
              Recursos
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Tudo que um negócio premium exige.
            </h2>
            <p className="text-[#A9B7D0] mt-3 text-base max-w-xl mx-auto">
              A união entre alta tecnologia e simplicidade de uso.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recursos.map((r) => {
              const Icon = r.icon;
              return (
                <div
                  key={r.recurso}
                  className="group bg-[#070B12] border border-[#1B2A40] rounded-2xl p-6 hover:border-cyan-400/30 hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="mb-4">
                    <Icon
                      className="h-7 w-7 text-cyan-400 opacity-80"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1">
                    {r.beneficio}
                  </p>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {r.recurso}
                  </h3>
                  <p className="text-[#A9B7D0] text-sm leading-relaxed">
                    {r.descricao}
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
