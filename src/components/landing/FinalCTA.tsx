import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function FinalCTA() {
  return (
    <section className="py-16 md:py-24 bg-[#070B12] relative overflow-hidden">
      {/* Glow */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div className="w-[700px] h-[400px] bg-orange-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative container mx-auto px-4 text-center max-w-3xl">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
          Pare de perder dinheiro com{" "}
          <span className="text-orange-400">faltas</span> e buracos na agenda.
        </h2>
        <p className="text-[#A9B7D0] text-lg mb-8">
          Junte-se a mais de 1.200 profissionais que automatizaram suas agendas
          e passaram a crescer de forma previsível.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Button
            size="lg"
            onClick={() =>
              document
                .getElementById("planos")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-base px-10 py-6 shadow-2xl shadow-orange-500/30 group transition-all"
          >
            Começar agora
            <ArrowRight
              className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform"
              aria-hidden="true"
            />
          </Button>
          <Link to="/login">
            <Button
              size="lg"
              variant="outline"
              className="border-[#1B2A40] text-[#EAF2FF] hover:border-cyan-400/60 hover:bg-cyan-400/10 hover:text-white text-base px-10 py-6 transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
            >
              Login
            </Button>
          </Link>
        </div>

        <p className="text-[#A9B7D0] text-sm">
          Sem cartão no teste. Cancele quando quiser.
        </p>
      </div>
    </section>
  );
}
