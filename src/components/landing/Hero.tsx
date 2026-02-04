import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="relative container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">
              Plataforma Completa de Gestão para Profissionais e Empresas
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Gerencie sua Agenda com
            <span className="block mt-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Inteligência Artificial
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Agenda inteligente, automações de WhatsApp, IA para reduzir faltas,
            analytics avançado. Para médicos, dentistas, advogados, psicólogos,
            estética, oficinas e muito mais.
          </p>

          {/* Supported Activities */}
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-200">
              Saúde
            </span>
            <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-200">
              Estética
            </span>
            <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-200">
              Advocacia
            </span>
            <span className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-200">
              Psicologia
            </span>
            <span className="px-3 py-1 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-200">
              Beleza
            </span>
            <span className="px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-200">
              Oficinas
            </span>
            <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-200">
              Consultorias
            </span>
          </div>

          {/* Key Benefits */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-xl md:text-2xl font-medium pt-8">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 md:h-10 md:w-10 text-yellow-400" />
              <span className="text-slate-200">Reduz 70% das faltas</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 md:h-10 md:w-10 text-green-400" />
              <span className="text-slate-200">100% seguro e LGPD</span>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 md:h-10 md:w-10 text-purple-400" />
              <span className="text-slate-200">IA integrada</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-6 text-lg shadow-2xl shadow-blue-500/50 group"
            >
              <Link to="/signup">
                Começar Grátis Agora
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800 px-8 py-6 text-lg"
            >
              <Link to="/about">
                Ver Demonstração
              </Link>
            </Button>
          </div>

          {/* Social Proof */}
          <div className="pt-8 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-slate-900"
                  />
                ))}
              </div>
              <div className="text-left ml-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 fill-yellow-400"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-slate-400">
                  <span className="font-semibold text-white">1.200+</span> profissionais confiam
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
          <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-2xl shadow-blue-500/20 group">
            <div className="bg-slate-900 p-3 flex items-center gap-2 border-b border-slate-700">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex-1 text-center text-sm text-slate-400">
                CleanFlow Dashboard
              </div>
            </div>
            <div className="aspect-video bg-slate-900 relative">
              <img
                src="/assets/dashboard-mockup.png"
                alt="CleanFlow Dashboard Interface"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image is missing
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-gradient-to-br', 'from-slate-800', 'to-slate-900');
                  const fallbackDiv = document.createElement('div');
                  fallbackDiv.innerHTML = '<div class="text-center space-y-4"><p class="text-slate-300 text-lg">Dashboard Preview</p></div>';
                  e.currentTarget.parentElement?.appendChild(fallbackDiv);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}