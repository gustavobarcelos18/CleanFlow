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
import { useLayoutTitle } from "@/hooks/useLayoutTitle";
import { useEffect } from "react";

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
  const { setTitle, setSubtitle } = useLayoutTitle();

  useEffect(() => {
    setTitle("Hub Central");
    setSubtitle("Acesso rápido aos principais módulos da sua clínica");
  }, [setTitle, setSubtitle]);

  return (
    <MainLayout>
      <div className="space-y-8 animate-in fade-in duration-500 pb-10">

        <div className="grid gap-6 md:gap-8 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] max-w-[1600px] mx-auto">
          {hubModules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.href}
                to={module.href}
                className="group relative flex flex-col h-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-[1.75rem] animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both shadow-sm hover:shadow-2xl transition-all"
                style={{ animationDelay: `${index * 30}ms` }}
                aria-label={`Acessar módulo ${module.title}`}
              >
                <div
                  className={cn(
                    "flex flex-col h-full p-6 md:p-8 lg:p-10 bg-muted/20 backdrop-blur-xl rounded-[1.75rem] border border-muted/40 transition-all duration-500 relative overflow-hidden",
                    "hover:-translate-y-2 hover:bg-muted/30 hover:border-primary/20",
                  )}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-40", module.gradient)} />
                  
                  <div className="relative z-10 flex flex-col items-center text-center h-full">
                    {/* Icon Container */}
                    <div className={cn(
                      "mb-6 p-4 md:p-5 rounded-2xl backdrop-blur-md border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg", 
                      module.color
                    )}>
                      <Icon className="h-8 w-8 md:h-10 md:w-10" strokeWidth={1.5} aria-hidden="true" />
                    </div>
                    
                    {/* Text Content */}
                    <div className="flex-1 flex flex-col space-y-3 px-2">
                      <h3 className="font-black text-foreground text-lg md:text-xl xl:text-2xl uppercase tracking-tighter group-hover:text-primary transition-colors duration-300 line-clamp-2 leading-tight">
                        {module.title}
                      </h3>
                      <p className="text-xs md:text-sm lg:text-base text-muted-foreground leading-relaxed font-semibold opacity-80 group-hover:opacity-100 transition-opacity max-w-[260px] mx-auto line-clamp-3">
                        {module.description}
                      </p>
                    </div>

                    {/* Alinhamento na Base (CTA/Indicator) */}
                    <div className="mt-8 flex flex-col items-center gap-4 w-full">
                      <div className="h-1.5 w-12 rounded-full bg-primary/10 group-hover:bg-primary/40 transition-all duration-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/0 group-hover:text-primary/60 transition-all duration-500 translate-y-2 group-hover:translate-y-0 italic">
                        Explorar
                      </span>
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
