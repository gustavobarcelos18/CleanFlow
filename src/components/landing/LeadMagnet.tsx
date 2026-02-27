import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight } from "lucide-react";

export function LeadMagnet() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email.trim()) {
      setEnviado(true);
    }
  };

  return (
    <section className="py-16 md:py-24 bg-[#0B1220]" id="checklist">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          {/* Icon */}
          <div className="w-14 h-14 mx-auto bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-6">
            <Mail className="h-7 w-7 text-orange-400" aria-hidden="true" />
          </div>

          <p className="text-sm font-semibold uppercase tracking-widest text-orange-400 mb-3">
            Lead magnet gratuito
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Quer reduzir faltas já essa semana?
          </h2>
          <p className="text-[#A9B7D0] mb-8">Guia curto. Prático. Sem spam.</p>

          {!enviado ? (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3"
              aria-label="Formulário de captura de e-mail"
            >
              <label htmlFor="email-lead" className="sr-only">
                Seu e-mail profissional
              </label>
              <input
                id="email-lead"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu e-mail profissional"
                className="flex-1 bg-[#070B12] border border-[#1B2A40] text-[#EAF2FF] placeholder-[#A9B7D0]/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 transition-all"
              />
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 shadow-lg shadow-orange-500/25 group whitespace-nowrap"
              >
                Quero o checklist
                <ArrowRight
                  className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform"
                  aria-hidden="true"
                />
              </Button>
            </form>
          ) : (
            <div className="bg-[#070B12] border border-cyan-400/30 rounded-2xl p-6 text-center">
              <p className="text-cyan-400 font-bold text-lg">
                ✓ Perfeito! Verifique seu e-mail.
              </p>
              <p className="text-[#A9B7D0] text-sm mt-2">
                O checklist está a caminho. Sem spam, prometemos.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
