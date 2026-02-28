import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ClipboardList, TrendingUp, Building2 } from "lucide-react";

const perfis = [
  {
    icon: ClipboardList,
    fase: "Começando",
    headline: "Você quer ordem e confirmação automática",
    descricao:
      "Chega de WhatsApp manual e agenda de papel. Configure em minutos e veja as confirmações acontecerem sozinhas.",
    cta: "Começar agora",
    destaque: false,
  },
  {
    icon: TrendingUp,
    fase: "Crescendo",
    headline: "Você precisa reduzir faltas e ter visão financeira",
    descricao:
      "A IA cuida dos no-shows, encaixes preenchem buracos e você finalmente sabe quanto entrou no caixa.",
    cta: "Começar agora",
    destaque: true,
  },
  {
    icon: Building2,
    fase: "Multiunidade",
    headline: "Você quer governança e controle por função",
    descricao:
      "Gerencie equipes, salas e unidades com permissões por função. Analytics consolidado sem bagunça.",
    cta: "Começar agora",
    destaque: false,
  },
];

export function TargetAudience() {
  return (
    <section className="py-16 md:py-24 bg-[#070B12]" id="para-quem">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 mb-3">
              Para quem é
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Em qual fase você está?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {perfis.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.fase}
                  className={`rounded-2xl p-6 border transition-all duration-300 flex flex-col ${
                    p.destaque
                      ? "bg-gradient-to-br from-cyan-400/10 to-blue-500/5 border-cyan-400/30 shadow-lg shadow-cyan-400/10"
                      : "bg-[#0B1220] border-[#1B2A40]"
                  }`}
                >
                  <div className="mb-4">
                    <Icon
                      className={`h-6 w-6 ${p.destaque ? "text-cyan-400" : "text-[#A9B7D0]"} opacity-80`}
                      aria-hidden="true"
                    />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-1">
                    {p.fase}
                  </p>
                  <h3 className="text-base font-bold text-white mb-3">
                    {p.headline}
                  </h3>
                  <p className="text-[#A9B7D0] text-sm leading-relaxed flex-1">
                    {p.descricao}
                  </p>
                  <div className="mt-6">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        document
                          .getElementById("planos")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="w-full border-[#1B2A40] text-[#A9B7D0] hover:bg-[#1B2A40] hover:text-white transition-all"
                    >
                      {p.cta}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
