import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  Stethoscope,
  Home,
  ShoppingBag,
  TestTube,
  User,
  ClipboardList,
  Syringe,
  GripVertical,
  FileEdit,
  DollarSign,
  Building2,
  HelpCircle,
  Bell,
} from "lucide-react";
import { useSidebarWidth } from "@/hooks/useSidebarWidth";
import { useTenantData } from "@/hooks/useTenantData";

interface SidebarProps {
  className?: string;
  onLinkClick?: () => void;
}

// 1. Operação Principal
const coreItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard",
    color: "text-medical-cyan",
  },
  {
    title: "Agenda do Dia",
    icon: Calendar,
    href: "/agenda",
    color: "text-medical-cyan",
  },
  {
    title: "Atendimento",
    icon: FileEdit,
    href: "/atendimento",
    color: "text-medical-cyan",
  },
  {
    title: "FlowChat",
    icon: MessageSquare,
    href: "/flowchat",
    color: "text-success",
  },
];

// 2. Clínico e Pacientes
const clinicalItems = [
  {
    title: "Pacientes",
    icon: Users,
    href: "/pacientes",
    color: "text-muted-foreground",
  },
  {
    title: "Prontuários",
    icon: ClipboardList,
    href: "/prontuarios",
    color: "text-muted-foreground",
  },
  {
    title: "Exames",
    icon: TestTube,
    href: "/exames",
    color: "text-muted-foreground",
  },
];

// 3. Financeiro e Comercial
const financialItems = [
  {
    title: "Financeiro",
    icon: DollarSign,
    href: "/financeiro",
    color: "text-muted-foreground",
  },
  {
    title: "Caixa Diário",
    icon: ShoppingBag,
    href: "/caixa-diario",
    color: "text-muted-foreground",
  },
  {
    title: "Pacotes",
    icon: ShoppingBag,
    href: "/pacotes",
    color: "text-muted-foreground",
  },
  {
    title: "Procedimentos",
    icon: Syringe,
    href: "/procedimentos",
    color: "text-muted-foreground",
  },
  {
    title: "Planos de Saúde",
    icon: ClipboardList,
    href: "/planos-saude",
    color: "text-muted-foreground",
  },
];

// 4. Gestão e Relatórios
const managementItems = [
  {
    title: "Relatórios",
    icon: BarChart3,
    href: "/relatorios",
    color: "text-muted-foreground",
  },
  {
    title: "Profissionais",
    icon: Users,
    href: "/profissionais",
    color: "text-muted-foreground",
  },
  {
    title: "Unidades",
    icon: Building2,
    href: "/unidades",
    color: "text-muted-foreground",
  },
  {
    title: "Especialidades",
    icon: Stethoscope,
    href: "/especialidades",
    color: "text-muted-foreground",
  },
  {
    title: "Tipos de Profissional",
    icon: User,
    href: "/tipos-profissional",
    color: "text-muted-foreground",
  },
];

// 5. Itens de Rodapé (Ajustes e Conta)
const bottomItems = [
  {
    title: "Alarmes",
    icon: Bell,
    href: "/alarmes-lembretes",
    color: "text-orange-500",
  },
  {
    title: "Central de Ajuda",
    icon: HelpCircle,
    href: "/support",
    color: "text-muted-foreground",
  },
  {
    title: "Configurações",
    icon: Settings,
    href: "/configuracoes",
    color: "text-muted-foreground",
  },
  {
    title: "Perfil",
    icon: User,
    href: "/perfil",
    color: "text-muted-foreground",
  },
];

const sidebarSections = [
  { label: "Principal", items: coreItems },
  { label: "Clínico", items: clinicalItems },
  { label: "Financeiro", items: financialItems },
  { label: "Gestão", items: managementItems },
];

export function Sidebar({ className, onLinkClick }: SidebarProps) {
  const location = useLocation();
  const { displayName, isLoading } = useTenantData();
  const { width, isResizing, handleMouseDown } = useSidebarWidth();

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "profissional":
        return "Profissional Autônomo";
      case "consultorio":
        return "Consultório";
      case "clinica":
        return "Clínica";
      default:
        return "Estabelecimento";
    }
  };

  return (
    <div
      className={cn(
        "bg-[#070B12] border-r border-[#1B2A40] h-full flex flex-col relative",
        className,
      )}
      style={{ width: `${width}px` }}
    >
      <div className="px-6 border-b border-[#1B2A40] flex-shrink-0 h-20 flex items-center">
        <div className="flex items-center gap-3 w-full">
          <div className="p-2 bg-[#22D3EE] rounded-lg shadow-lg shadow-cyan-500/20 flex-shrink-0">
            <Stethoscope className="h-6 w-6 text-[#070B12]" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-black text-white tracking-tight leading-none">
              CleanFlow
            </h1>
            <p className="text-[11px] text-[#A9B7D0] font-bold leading-tight mt-0.5 truncate uppercase tracking-wider">
              {isLoading ? "Carregando..." : displayName}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation with ScrollArea */}
      <ScrollArea className="flex-1 px-4">
        <nav className="py-4 space-y-6">
          {sidebarSections.map((section) => (
            <div key={section.label} className="space-y-2">
              <h3 className="px-4 text-[10px] font-black uppercase tracking-widest text-[#A9B7D0]/40">
                {section.label}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  return (
                    <Button
                      key={item.href}
                      variant={isActive ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-4 h-14 transition-all duration-200 rounded-xl",
                        isActive
                          ? "bg-[#22D3EE] text-[#070B12] font-black shadow-lg shadow-cyan-500/30"
                          : "hover:bg-[#1B2A40]/50 text-[#A9B7D0] hover:text-white font-semibold",
                      )}
                      asChild
                    >
                      <Link to={item.href} onClick={onLinkClick}>
                        <Icon
                          className={cn(
                            "h-6 w-6",
                            isActive ? "text-[#070B12]" : item.color,
                          )}
                        />
                        <span className="flex-1 text-left text-[14px] font-black tracking-tight">
                          {item.title}
                        </span>
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom Section - Settings/Profile */}
      <div className="px-4 py-4 border-t border-[#1B2A40] space-y-1 flex-shrink-0">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Button
              key={item.href}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-4 h-12 transition-all duration-200 rounded-lg",
                isActive
                  ? "bg-[#22D3EE]/10 text-[#22D3EE] font-black"
                  : "text-[#A9B7D0] hover:bg-[#1B2A40]/30 hover:text-white font-medium",
              )}
              asChild
            >
              <Link to={item.href} onClick={onLinkClick}>
                <Icon className="h-5 w-5" />
                <span className="flex-1 text-left text-[13px] tracking-tight">
                  {item.title}
                </span>
              </Link>
            </Button>
          );
        })}
      </div>

      {/* Status indicator - Balanced */}
      <div className="px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3 px-1">
          <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse shadow-sm shadow-success/50"></div>
          <span className="text-[11px] font-black uppercase tracking-widest text-success/80">
            Sistema Ativo
          </span>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className={cn(
          "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors group",
          isResizing && "bg-primary",
        )}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-background border border-border rounded p-1 shadow-sm">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
