import React from "react";
import { Button } from "@/components/ui/button";
import { Check, X, Sparkles, Zap, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

const planos = [
  {
    nome: "Básico",
    descricao: "Para começar com organização",
    preco: "R$ 97",
    periodo: "/mês",
    icon: Sparkles,
    recursos: [
      { texto: "Agenda online", ok: true },
      { texto: "1 profissional", ok: true },
      { texto: "Lembretes manuais", ok: true },
      { texto: "Suporte por e-mail", ok: true },
      { texto: "IA anti-faltas", ok: false },
      { texto: "WhatsApp automático", ok: false },
    ],
    cta: "Começar agora",
    destaque: false,
  },
  {
    nome: "Pro",
    descricao: "O mais escolhido para crescer",
    preco: "R$ 197",
    periodo: "/mês",
    icon: Zap,
    recursos: [
      { texto: "Agenda inteligente", ok: true },
      { texto: "IA anti-faltas (score)", ok: true },
      { texto: "WhatsApp automático", ok: true },
      { texto: "Encaixes e fila virtual", ok: true },
      { texto: "Analytics de receita", ok: true },
      { texto: "Suporte prioritário", ok: true },
    ],
    cta: "Começar agora",
    destaque: true,
  },
  {
    nome: "Empresa",
    descricao: "Para clínicas e múltiplas salas",
    preco: "R$ 397",
    periodo: "/mês + R$ 49/prof.",
    icon: Building2,
    recursos: [
      { texto: "Tudo do plano Pro", ok: true },
      { texto: "Múltiplos profissionais", ok: true },
      { texto: "Controle de permissões", ok: true },
      { texto: "Multi-salas", ok: true },
      { texto: "Integração via API", ok: true },
      { texto: "Gerente de conta dedicado", ok: true },
    ],
    cta: "Falar com vendas",
    destaque: false,
  },
];

export function Pricing() {
  return (
    <section className="py-16 md:py-24 bg-[#0B1220]" id="planos">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400 mb-3">
              Planos
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Invista menos que o valor de{" "}
              <span className="text-orange-400">
                uma única consulta perdida.
              </span>
            </h2>
            <p className="text-[#A9B7D0] mt-3">
              Cancele quando quiser. ROI visível já na primeira semana.
            </p>
          </div>

          {/* Plans grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planos.map((plano) => {
              const Icon = plano.icon;
              return (
                <div
                  key={plano.nome}
                  className={`rounded-2xl p-6 border flex flex-col transition-all duration-300 relative ${
                    plano.destaque
                      ? "bg-gradient-to-b from-[#0B1220] to-[#071020] border-cyan-400/40 shadow-xl shadow-cyan-400/10 scale-[1.02]"
                      : "bg-[#070B12] border-[#1B2A40] hover:border-[#2A3D55]"
                  }`}
                >
                  {/* Badge */}
                  {plano.destaque && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 rounded-full text-xs font-bold bg-orange-500 text-white whitespace-nowrap">
                        MAIS ESCOLHIDO
                      </span>
                    </div>
                  )}

                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                      plano.destaque
                        ? "bg-cyan-400/15 border border-cyan-400/25"
                        : "bg-[#1B2A40] border border-[#1B2A40]"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${plano.destaque ? "text-cyan-400" : "text-[#A9B7D0]"}`}
                      aria-hidden="true"
                    />
                  </div>

                  <h3 className="text-xl font-bold text-white">{plano.nome}</h3>
                  <p className="text-[#A9B7D0] text-sm mt-1 mb-4">
                    {plano.descricao}
                  </p>

                  <div className="mb-6">
                    <span className="text-4xl font-black text-white">
                      {plano.preco}
                    </span>
                    <span className="text-[#A9B7D0] text-sm ml-1">
                      {plano.periodo}
                    </span>
                  </div>

                  <Link to="/signup" className="mb-6">
                    <Button
                      className={`w-full font-bold ${
                        plano.destaque
                          ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25"
                          : "bg-[#1B2A40] hover:bg-[#2A3D55] text-white"
                      }`}
                    >
                      {plano.cta}
                    </Button>
                  </Link>

                  <ul className="space-y-2.5 flex-1">
                    {plano.recursos.map((r) => (
                      <li
                        key={r.texto}
                        className="flex items-center gap-2.5 text-sm"
                      >
                        {r.ok ? (
                          <Check
                            className="h-4 w-4 text-cyan-400 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <X
                            className="h-4 w-4 text-[#1B2A40] shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={
                            r.ok ? "text-[#EAF2FF]" : "text-[#A9B7D0]/40"
                          }
                        >
                          {r.texto}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Risk reversal + urgency */}
          <div className="mt-10 text-center space-y-2">
            <p className="text-white font-semibold">
              Teste sem cartão. Cancele quando quiser.
            </p>
            <p className="text-[#A9B7D0] text-sm">
              ⚡ Onboarding assistido — vagas limitadas este mês.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
