import React from "react";
import { TrendingDown, TrendingUp, Clock, DollarSign } from "lucide-react";

const metricas = [
  {
    icon: TrendingDown,
    valor: "-68%",
    label: "No-show",
    detalhe: "redução de faltas com confirmação automática",
    cor: "text-cyan-400",
    bg: "bg-cyan-400/10",
    borda: "border-cyan-400/20",
  },
  {
    icon: TrendingUp,
    valor: "+34%",
    label: "Ocupação da agenda",
    detalhe: "mais horários preenchidos com encaixes inteligentes",
    cor: "text-emerald-400",
    bg: "bg-emerald-400/10",
    borda: "border-emerald-400/20",
  },
  {
    icon: Clock,
    valor: "-8 h/sem",
    label: "WhatsApp manual",
    detalhe: "horas poupadas por semana pela equipe",
    cor: "text-orange-400",
    bg: "bg-orange-400/10",
    borda: "border-orange-400/20",
  },
  {
    icon: DollarSign,
    valor: "+R$ 2.400",
    label: "Receita recuperada",
    detalhe: "por mês em consultas que seriam perdidas",
    cor: "text-violet-400",
    bg: "bg-violet-400/10",
    borda: "border-violet-400/20",
  },
];

export function Metrics() {
  return (
    <section className="py-16 md:py-24 bg-[#0B1220]" id="resultados">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl 2xl:max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 mb-3">
              O que muda
            </p>
            <h2 className="h2-fluid text-white">Números que falam por si</h2>
            <p className="text-[#A9B7D0] mt-3 text-sm flex items-center justify-center gap-2 flex-wrap">
              Baseados em perfis de uso semelhantes.{" "}
              <span className="px-2.5 py-0.5 rounded-full bg-[#1B2A40] text-[#A9B7D0] text-xs border border-[#2A3D55]">
                Dados ilustrativos
              </span>
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {metricas.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.label}
                  className="bg-[#070B12] border border-[#1B2A40] rounded-2xl p-6 flex flex-col items-center text-center hover:border-opacity-50 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Ícone */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${m.bg} border ${m.borda}`}
                  >
                    <Icon className={`h-6 w-6 ${m.cor}`} aria-hidden="true" />
                  </div>

                  {/* Valor principal — nowrap garante que não quebre */}
                  <p
                    className={`text-4xl font-black whitespace-nowrap leading-none mb-2 ${m.cor}`}
                  >
                    {m.valor}
                  </p>

                  {/* Label */}
                  <p className="text-white font-semibold text-base mb-1">
                    {m.label}
                  </p>

                  {/* Detalhe */}
                  <p className="text-[#A9B7D0] text-xs leading-snug">
                    {m.detalhe}
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
