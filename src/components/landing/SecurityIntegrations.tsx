import React from "react";
import { ShieldCheck, MessageCircle, Calendar, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function SecurityIntegrations() {
  return (
    <section className="py-24 relative overflow-hidden bg-slate-950 text-white">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
      <div className="absolute -left-40 top-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
      <div className="absolute -right-40 bottom-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full border border-blue-500/20 mb-6">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">
              Conformidade e Proteção
            </span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Seus pacientes. Seus dados.
            <span className="block mt-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent pb-1">
              Segurança Absoluta
            </span>
          </h2>
          <p className="text-lg text-slate-300">
            Tratamos a segurança das informações de saúde como nossa principal
            prioridade. Infraestrutura de ponta a ponta com as integrações que
            você já utiliza.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16">
          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 text-center hover:bg-slate-800/50 transition-colors">
            <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-500/20">
              <MessageCircle className="w-7 h-7 text-green-400" />
            </div>
            <h3 className="font-bold mb-2">WhatsApp Oficial</h3>
            <p className="text-sm text-slate-400">
              Mensagens enviadas sem risco de banimento.
            </p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 text-center hover:bg-slate-800/50 transition-colors">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <ShieldCheck className="w-7 h-7 text-blue-400" />
            </div>
            <h3 className="font-bold mb-2">100% LGPD</h3>
            <p className="text-sm text-slate-400">
              Consentimento do paciente integrado no agendamento.
            </p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 text-center hover:bg-slate-800/50 transition-colors">
            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
              <Lock className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="font-bold mb-2">Criptografia Forte</h3>
            <p className="text-sm text-slate-400">
              Bancos de dados isolados e dados sensíveis mascarados.
            </p>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 text-center hover:bg-slate-800/50 transition-colors">
            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
              <Calendar className="w-7 h-7 text-orange-400" />
            </div>
            <h3 className="font-bold mb-2">Sincronização</h3>
            <p className="text-sm text-slate-400">
              Integração nativa com sua rotina de calendário.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-white"
          >
            <Link to="/about">Saiba mais sobre segurança</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
