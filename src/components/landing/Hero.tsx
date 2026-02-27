import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#070B12]">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(#22D3EE 1px, transparent 1px), linear-gradient(90deg, #22D3EE 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative landing-container py-16 md:py-24 3xl:py-36">
        <div className="max-w-5xl 2xl:max-w-7xl mx-auto text-center space-y-8">
          {/* Main headline — escala fluida até ~96px em 4K */}
          <h1 className="headline-punch">
            Menos faltas. <span className="text-cyan-400">Agenda cheia.</span>
            <br />
            <span className="text-orange-500">Mais dinheiro no caixa.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[#A9B7D0] max-w-3xl mx-auto leading-relaxed">
            O CleanFlow automatiza confirmações no WhatsApp, <br />
            preenche buracos na agenda e dá visão clara de ocupação e
            receita.{" "}
          </p>

          {/* Main highlights — simplificados e horizontais para maior leveza */}
          <div className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-[#A9B7D0] text-sm md:text-base max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              <CheckCircle
                className="h-4 w-4 text-cyan-400 shrink-0 opacity-70"
                aria-hidden="true"
              />
              <span>Confirmação automática</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle
                className="h-4 w-4 text-cyan-400 shrink-0 opacity-70"
                aria-hidden="true"
              />
              <span>Setup em minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle
                className="h-4 w-4 text-cyan-400 shrink-0 opacity-70"
                aria-hidden="true"
              />
              <span>Visão clara de caixa</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button
              size="lg"
              onClick={() =>
                document
                  .getElementById("planos")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-base px-8 py-6 shadow-xl shadow-orange-500/30 group transition-all"
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
                className="border-[#1B2A40] text-[#EAF2FF] hover:border-cyan-400/60 hover:bg-cyan-400/10 hover:text-white text-base px-8 py-6 transition-all hover:shadow-[0_0_20px_rgba(34,211,238,0.15)]"
              >
                Login
              </Button>
            </Link>
          </div>

          {/* Lead magnet link */}
          <a
            href="#checklist"
            className="inline-flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 underline underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
          >
            Quero o checklist anti-faltas grátis
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>

          {/* Social proof bar */}
          <div className="mt-8 pt-8 border-t border-[#1B2A40] flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-[#A9B7D0]">
            <div className="flex -space-x-2" aria-label="Avatares de usuários">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-[#070B12]"
                  aria-hidden="true"
                />
              ))}
            </div>
            <span>
              <strong className="text-white">+1.200 profissionais</strong> já
              automatizaram suas agendas
            </span>
            <div className="flex gap-0.5" aria-label="Avaliação 5 estrelas">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="w-4 h-4 fill-orange-400"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
              <span className="ml-1.5 text-[#A9B7D0]">4.9/5</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
