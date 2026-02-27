import React from "react";
import { Phone, CalendarX, MessageCircleWarning } from "lucide-react";

const dores = [
  {
    icon: Phone,
    titulo: "Falta em cima da hora",
    descricao:
      "Paciente some sem avisar. Slot vazio. Profissional parado. Dinheiro perdido.",
  },
  {
    icon: CalendarX,
    titulo: "Agenda com buracos",
    descricao:
      "Horários vagos que ninguém preencheu. Receita que escorregou pelo ralo.",
  },
  {
    icon: MessageCircleWarning,
    titulo: "WhatsApp vira caos",
    descricao:
      "Secretária presa no celular o dia todo tentando confirmar quem vai aparecer.",
  },
];

export function AgitacaoDor() {
  return (
    <section className="py-16 md:py-24 bg-[#070B12]" id="problema">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-orange-400 mb-3">
              O problema
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Você perde dinheiro assim
            </h2>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dores.map((dor) => {
              const Icon = dor.icon;
              return (
                <div
                  key={dor.titulo}
                  className="bg-[#0B1220] border border-[#1B2A40] rounded-2xl p-6 hover:border-orange-500/40 transition-colors duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
                    <Icon
                      className="h-6 w-6 text-orange-400"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {dor.titulo}
                  </h3>
                  <p className="text-[#A9B7D0] text-sm leading-relaxed">
                    {dor.descricao}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Linha de impacto */}
          <div className="mt-10 text-center">
            <p className="text-xl md:text-2xl font-bold text-white">
              No fim do mês,{" "}
              <span className="text-orange-400">
                isso vira receita que sumiu.
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
