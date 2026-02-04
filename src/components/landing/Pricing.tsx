import React from "react";
import { Check, X, Sparkles, Zap, Building2, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Free Solo",
    description: "Perfeito para começar",
    price: "R$ 0",
    period: "/mês",
    icon: Sparkles,
    color: "from-slate-600 to-slate-800",
    features: [
      { text: "Até 50 clientes", included: true },
      { text: "1 profissional", included: true },
      { text: "Agenda básica", included: true },
      { text: "WhatsApp manual", included: true },
      { text: "Relatórios básicos", included: true },
      { text: "Automações", included: false },
      { text: "IA Anti Faltas", included: false },
      { text: "API & Webhooks", included: false },
    ],
    cta: "Começar Grátis",
    popular: false,
  },
  {
    name: "Pro Solo",
    description: "Para profissionais autônomos",
    price: "R$ 299",
    period: "/mês",
    icon: Zap,
    color: "from-blue-600 to-cyan-600",
    features: [
      { text: "Clientes ilimitados", included: true },
      { text: "1 profissional", included: true },
      { text: "Agenda completa", included: true },
      { text: "WhatsApp automático", included: true },
      { text: "IA Anti Faltas", included: true },
      { text: "Automações ilimitadas", included: true },
      { text: "Analytics avançado", included: true },
      { text: "API & Webhooks", included: true },
    ],
    cta: "Começar Teste Grátis",
    popular: true,
  },
  {
    name: "Empresa",
    description: "Para empresas com equipe",
    price: "R$ 699",
    period: "/mês + R$ 99/profissional",
    icon: Building2,
    color: "from-purple-600 to-pink-600",
    features: [
      { text: "Tudo do Pro Solo", included: true },
      { text: "Profissionais ilimitados", included: true },
      { text: "Multi-usuário", included: true },
      { text: "Gestão de equipe", included: true },
      { text: "Financeiro completo", included: true },
      { text: "Prontuário/Histórico", included: true },
      { text: "Integrações avançadas", included: true },
      { text: "Suporte prioritário", included: true },
    ],
    cta: "Falar com Vendas",
    popular: false,
  },
  {
    name: "Multi-unidades",
    description: "Para redes e franquias",
    price: "R$ 699",
    period: "/mês por unidade (10% desc.)",
    icon: Network,
    color: "from-orange-600 to-red-600",
    features: [
      { text: "Tudo do Empresa", included: true },
      { text: "Unidades ilimitadas", included: true },
      { text: "Governança centralizada", included: true },
      { text: "Analytics consolidado", included: true },
      { text: "Configurações por unidade", included: true },
      { text: "White label (opcional)", included: true },
      { text: "Gerente de conta dedicado", included: true },
      { text: "SLA garantido", included: true },
    ],
    cta: "Falar com Especialista",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950" id="planos">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 mb-6">
            <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Planos Transparentes
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Escolha o plano ideal para
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              o seu negócio
            </span>
          </h2>

          <p className="text-xl text-slate-600 dark:text-slate-300">
            Comece grátis e faça upgrade quando precisar. Sem taxas ocultas,
            sem contratos longos, cancele quando quiser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto pt-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <div
                key={index}
                className={`relative rounded-2xl p-8 ${plan.popular
                  ? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-2xl scale-105 border-4 border-blue-400"
                  : "bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700"
                  }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-4 py-1.5 text-xs font-bold rounded-full bg-yellow-400 text-slate-900 shadow-lg whitespace-nowrap">
                      MAIS POPULAR
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${plan.color} mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>

                {/* Plan Name */}
                <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? "text-white" : "text-slate-900 dark:text-white"}`}>
                  {plan.name}
                </h3>

                <p className={`text-sm mb-6 ${plan.popular ? "text-blue-100" : "text-slate-600 dark:text-slate-400"}`}>
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-bold ${plan.popular ? "text-white" : "text-slate-900 dark:text-white"}`}>
                      {plan.price}
                    </span>
                    <span className={`text-sm ${plan.popular ? "text-blue-100" : "text-slate-600 dark:text-slate-400"}`}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  asChild
                  className={`w-full mb-6 ${plan.popular
                    ? "bg-white text-blue-600 hover:bg-blue-50"
                    : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700"
                    }`}
                >
                  <Link to="/signup">
                    {plan.cta}
                  </Link>
                </Button>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className={`h-5 w-5 flex-shrink-0 ${plan.popular ? "text-green-300" : "text-green-600 dark:text-green-400"}`} />
                      ) : (
                        <X className={`h-5 w-5 flex-shrink-0 ${plan.popular ? "text-blue-200" : "text-slate-400"}`} />
                      )}
                      <span className={`text-sm ${feature.included
                        ? plan.popular ? "text-white" : "text-slate-700 dark:text-slate-300"
                        : plan.popular ? "text-blue-200" : "text-slate-400"
                        }`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-2xl p-8 border border-blue-200 dark:border-blue-800">
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              Todos os planos incluem:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Atualizações gratuitas</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Backup automático</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Suporte por e-mail</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">SSL e criptografia</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Conformidade LGPD</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">99.9% uptime</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Link */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Dúvidas sobre os planos?{" "}
            <a href="#faq" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
              Veja as perguntas frequentes
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
