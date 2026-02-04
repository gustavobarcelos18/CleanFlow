import React from "react";
import {
  Target,
  Heart,
  Zap,
  Shield,
  Users,
  TrendingUp
} from "lucide-react";

const pillars = [
  {
    icon: Target,
    title: "Foco no Profissional",
    description: "Desenvolvido para profissionais liberais e empresas de serviços. Cada funcionalidade foi pensada para resolver problemas reais de agendamento e gestão.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Zap,
    title: "Automação Inteligente",
    description: "Reduza 80% do trabalho manual com automações de WhatsApp, confirmações automáticas e IA que prevê faltas antes que aconteçam.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: Heart,
    title: "Experiência do Cliente",
    description: "Portal do cliente, agendamento online, confirmações por WhatsApp e lembretes automáticos. Seus clientes vão amar.",
    color: "from-red-500 to-orange-500"
  },
  {
    icon: TrendingUp,
    title: "Crescimento Sustentável",
    description: "Analytics em tempo real, insights acionáveis e relatórios que ajudam você a tomar decisões baseadas em dados para crescer seu negócio.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Shield,
    title: "Segurança Máxima",
    description: "100% conforme LGPD, criptografia end-to-end, backup automático e auditoria completa. Seus dados e dos seus clientes estão seguros.",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: Users,
    title: "Suporte Dedicado",
    description: "Time brasileiro disponível para ajudar. Onboarding personalizado, treinamento completo e suporte contínuo para seu sucesso.",
    color: "from-indigo-500 to-purple-500"
  }
];

const activities = [
  { name: "Saúde", count: "Médicos, Dentistas, Fisioterapeutas" },
  { name: "Estética", count: "Salões, Spas, Clínicas de Estética" },
  { name: "Advocacia", count: "Escritórios, Advogados Autônomos" },
  { name: "Psicologia", count: "Psicólogos, Terapeutas, Coaches" },
  { name: "Beleza", count: "Manicures, Cabeleireiros, Barbeiros" },
  { name: "Oficinas", count: "Mecânicas, Assistências Técnicas" },
  { name: "Consultorias", count: "Consultores, Contadores, Arquitetos" },
  { name: "Educação", count: "Professores Particulares, Cursos" },
];

export function ValuePillars() {
  return (
    <section className="py-24 bg-white dark:bg-slate-950">
      <div className="container mx-auto px-4">
        {/* Activities Section */}
        <div className="max-w-5xl mx-auto mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perfeito para
              <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Diversos Segmentos
              </span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Seja você profissional autônomo ou empresa com equipe,
              o CleanFlow se adapta ao seu negócio
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {activities.map((activity, index) => (
              <div
                key={index}
                className="group bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {activity.name}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {activity.count}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-slate-600 dark:text-slate-400">
              E muitos outros segmentos que trabalham com agendamento de horários
            </p>
          </div>
        </div>

        {/* Value Pillars */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Por que escolher o
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CleanFlow?
            </span>
          </h2>

          <p className="text-xl text-slate-600 dark:text-slate-300">
            Mais que um software de gestão, somos seu parceiro para transformar
            e escalar seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <div
                key={index}
                className="group relative bg-slate-50 dark:bg-slate-900 rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-transparent overflow-hidden"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${pillar.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                {/* Icon */}
                <div className={`relative inline-flex p-4 rounded-2xl bg-gradient-to-br ${pillar.color} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="relative text-xl font-bold mb-3 text-slate-900 dark:text-white">
                  {pillar.title}
                </h3>

                <p className="relative text-slate-600 dark:text-slate-300 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
              1.200+
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Profissionais ativos
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              70%
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Redução de faltas
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
              99.9%
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Uptime garantido
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
              4.8/5
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              Avaliação média
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
