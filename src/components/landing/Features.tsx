import React from "react";
import {
  Calendar,
  MessageSquare,
  Brain,
  BarChart3,
  Zap,
  Shield,
  Workflow,
  Building2,
  CreditCard,
  Plug
} from "lucide-react";

const features = [
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    description: "Gestão completa de agendamentos com visualização por dia, semana ou mês. Arrastar e soltar para reagendar, confirmações automáticas e sincronização em tempo real.",
    color: "from-blue-500 to-cyan-500",
    badge: "Essencial"
  },
  {
    icon: Brain,
    title: "IA Anti No-Show",
    description: "Inteligência artificial que prevê faltas com 85% de precisão. Score de risco por paciente, alertas proativos e recomendações de ações para reduzir no-shows.",
    color: "from-purple-500 to-pink-500",
    badge: "IA"
  },
  {
    icon: MessageSquare,
    title: "Automação WhatsApp",
    description: "Confirmações automáticas D-2 e H-3h, lembretes personalizados, templates customizáveis e histórico completo de conversas. Integração nativa com WhatsApp Business.",
    color: "from-green-500 to-emerald-500",
    badge: "Automação"
  },
  {
    icon: BarChart3,
    title: "Analytics Avançado",
    description: "Dashboards interativos com métricas de ocupação, no-show, receita, desempenho por profissional e muito mais. Exportação para Excel e PDF.",
    color: "from-orange-500 to-red-500",
    badge: "BI"
  },
  {
    icon: Workflow,
    title: "Flow Builder",
    description: "Crie automações visuais sem código. Fluxos de confirmação, lembretes, follow-ups e campanhas de marketing totalmente personalizáveis.",
    color: "from-indigo-500 to-purple-500",
    badge: "Novo"
  },
  {
    icon: Building2,
    title: "Multi-unidade",
    description: "Gerencie múltiplas clínicas ou consultórios em uma única plataforma. Governança centralizada, analytics consolidados e configurações por unidade.",
    color: "from-teal-500 to-cyan-500",
    badge: "Empresarial"
  },
  {
    icon: CreditCard,
    title: "Financeiro Completo",
    description: "Controle de receitas, despesas, fluxo de caixa, faturas e cobranças. Integração com Stripe e Pagar.me para pagamentos online.",
    color: "from-yellow-500 to-orange-500",
    badge: "Pro"
  },
  {
    icon: Plug,
    title: "API & Webhooks",
    description: "API pública RESTful para integrações customizadas. Webhooks em tempo real para eventos importantes. SDK de plugins para extensibilidade total.",
    color: "from-slate-500 to-gray-500",
    badge: "Desenvolvedores"
  },
  {
    icon: Shield,
    title: "Segurança LGPD",
    description: "Conformidade total com LGPD, criptografia end-to-end, backup automático, auditoria completa e controle granular de permissões por usuário.",
    color: "from-red-500 to-pink-500",
    badge: "Segurança"
  },
  {
    icon: Zap,
    title: "Performance",
    description: "Infraestrutura na nuvem com 99.9% de uptime. Carregamento instantâneo, sincronização em tempo real e suporte a milhares de agendamentos simultâneos.",
    color: "from-yellow-400 to-yellow-600",
    badge: "Cloud"
  }
];

export function Features() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900" id="funcionalidades">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 mb-6">
            <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Funcionalidades Completas
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Tudo que você precisa para
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Revolucionar sua Clínica
            </span>
          </h2>

          <p className="text-xl text-slate-600 dark:text-slate-300">
            Mais de 50 funcionalidades desenvolvidas especificamente para profissionais
            de saúde, estética e bem-estar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 hover:-translate-y-1"
              >
                {/* Badge */}
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                    {feature.badge}
                  </span>
                </div>

                {/* Icon */}
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-8 w-8 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">
                  {feature.title}
                </h3>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            E muito mais: Prontuário Eletrônico, Lista de Espera, Gestão de Estoque,
            Relatórios Customizados, Integrações com Laboratórios...
          </p>
          <a
            href="#planos"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:gap-3 transition-all"
          >
            Ver todos os recursos por plano
            <Zap className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
