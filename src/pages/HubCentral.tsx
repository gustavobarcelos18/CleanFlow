import React from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Link } from "react-router-dom";
import {
  Calendar,
  Users,
  MessageSquare,
  BarChart3,
  FileEdit,
  DollarSign,
  ClipboardList,
  Syringe,
  TestTube,
} from "lucide-react";
import { cn } from "@/lib/utils";

const hubModules = [
  {
    title: "Visão Geral",
    description: "Métricas diárias, alertas e próximas consultas",
    icon: BarChart3,
    href: "/visao-geral",
    color:
      "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:border-cyan-400/50",
    gradient: "from-cyan-500/5 to-transparent",
  },
  {
    title: "Agenda do Dia",
    description: "Gerencie marcações, encaixes e bloqueios",
    icon: Calendar,
    href: "/agenda",
    color:
      "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:border-blue-400/50",
    gradient: "from-blue-500/5 to-transparent",
  },
  {
    title: "Atendimento",
    description: "Inicie chamadas e registre evoluções",
    icon: FileEdit,
    href: "/atendimento",
    color:
      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:border-emerald-400/50",
    gradient: "from-emerald-500/5 to-transparent",
  },
  {
    title: "FlowChat",
    description: "Mensageria e automação de WhatsApp",
    icon: MessageSquare,
    href: "/flowchat",
    color:
      "bg-success/10 text-success border-success/20 hover:border-success/50",
    gradient: "from-success/5 to-transparent",
  },
  {
    title: "Pacientes",
    description: "Cadastros, histórico e prontuários",
    icon: Users,
    href: "/pacientes",
    color:
      "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:border-purple-400/50",
    gradient: "from-purple-500/5 to-transparent",
  },
  {
    title: "Prontuários",
    description: "Acesse rapidamente o registro clínico",
    icon: ClipboardList,
    href: "/prontuarios",
    color:
      "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:border-indigo-400/50",
    gradient: "from-indigo-500/5 to-transparent",
  },
  {
    title: "Procedimentos",
    description: "Tabela de preços e serviços da clínica",
    icon: Syringe,
    href: "/procedimentos",
    color:
      "bg-pink-500/10 text-pink-400 border-pink-500/20 hover:border-pink-400/50",
    gradient: "from-pink-500/5 to-transparent",
  },
  {
    title: "Exames",
    description: "Resultados e pedidos laboratoriais",
    icon: TestTube,
    href: "/exames",
    color:
      "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:border-rose-400/50",
    gradient: "from-rose-500/5 to-transparent",
  },
  {
    title: "Financeiro",
    description: "Contas, faturamento e fluxo de caixa",
    icon: DollarSign,
    href: "/financeiro",
    color:
      "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:border-orange-400/50",
    gradient: "from-orange-500/5 to-transparent",
  },
];

const HubCentral = () => {
  return (
    <MainLayout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Hub <span className="text-primary">Central</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Acesso rápido aos principais módulos da sua clínica.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hubModules.map((module) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.href}
                to={module.href}
                className="group relative block"
              >
                <div
                  className={cn(
                    "h-full p-6 rounded-2xl border bg-gradient-to-br transition-all duration-300",
                    "hover:-translate-y-1 hover:shadow-xl",
                    module.color,
                    module.gradient,
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-background/40 backdrop-blur-sm border border-inherit">
                      <Icon className="h-6 w-6" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <h3 className="font-bold text-foreground tracking-tight group-hover:text-inherit transition-colors">
                        {module.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-snug">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};

export default HubCentral;
