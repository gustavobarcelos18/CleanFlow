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
  Bell
} from "lucide-react";
import { useSidebarWidth } from "@/hooks/useSidebarWidth";
import { useTenantData } from "@/hooks/useTenantData";

interface SidebarProps {
  className?: string;
  onLinkClick?: () => void;
}

// Itens fixos que não devem ser reordenados
const fixedItems = [
  {
    title: "Dashboard",
    icon: Home,
    href: "/dashboard",
    color: "text-medical-cyan"
  },
  {
    title: "Agenda do Dia",
    icon: Calendar,
    href: "/agenda",
    color: "text-medical-cyan"
  },
  {
    title: "Atendimento",
    icon: FileEdit,
    href: "/atendimento",
    color: "text-medical-cyan"
  }
];

// Itens que devem ser ordenados alfabeticamente
const alphabeticalItems = [
  {
    title: "Caixa Diário",
    icon: ShoppingBag,
    href: "/caixa-diario",
    color: "text-muted-foreground"
  },
  {
    title: "Especialidades",
    icon: Stethoscope,
    href: "/especialidades",
    color: "text-muted-foreground"
  },
  {
    title: "Exames",
    icon: TestTube,
    href: "/exames",
    color: "text-muted-foreground"
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    href: "/financeiro",
    color: "text-muted-foreground"
  },
  {
    title: "FlowChat",
    icon: MessageSquare,
    href: "/flowchat",
    color: "text-success"
  },
  {
    title: "Pacientes",
    icon: Users,
    href: "/pacientes",
    color: "text-muted-foreground"
  },
  {
    title: "Pacotes",
    icon: ShoppingBag,
    href: "/pacotes",
    color: "text-muted-foreground"
  },
  {
    title: "Perfil",
    icon: User,
    href: "/perfil",
    color: "text-muted-foreground"
  },
  {
    title: "Planos de Saúde",
    icon: ClipboardList,
    href: "/planos-saude",
    color: "text-muted-foreground"
  },
  {
    title: "Procedimentos",
    icon: Syringe,
    href: "/procedimentos",
    color: "text-muted-foreground"
  },
  {
    title: "Profissionais",
    icon: Users,
    href: "/profissionais",
    color: "text-muted-foreground"
  },
  {
    title: "Tipos de Profissional",
    icon: User,
    href: "/tipos-profissional",
    color: "text-muted-foreground"
  },
  {
    title: "Prontuários",
    icon: ClipboardList,
    href: "/prontuarios",
    color: "text-muted-foreground"
  },
  {
    title: "Relatórios",
    icon: BarChart3,
    href: "/relatorios",
    color: "text-muted-foreground"
  },
  {
    title: "Unidades",
    icon: Building2,
    href: "/unidades",
    color: "text-muted-foreground"
  }
].sort((a, b) => a.title.localeCompare(b.title));

// Item fixo no final
const supportItem = {
  title: "Suporte",
  icon: MessageSquare,
  href: "/tickets",
  color: "text-blue-500"
};

const alarmesItem = {
  title: "Alarmes",
  icon: Bell,
  href: "/alarmes-lembretes",
  color: "text-orange-500"
};

const configItem = {
  title: "Configurações",
  icon: Settings,
  href: "/configuracoes",
  color: "text-muted-foreground"
};

const helpItem = {
  title: "Central de Ajuda",
  icon: HelpCircle,
  href: "/support",
  color: "text-muted-foreground"
};

const sidebarItems = [...fixedItems, ...alphabeticalItems, supportItem, alarmesItem, configItem, helpItem];

export function Sidebar({ className, onLinkClick }: SidebarProps) {
  const location = useLocation();
  const { displayName, isLoading } = useTenantData();
  const { width, isResizing, handleMouseDown } = useSidebarWidth();

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'profissional': return 'Profissional Autônomo';
      case 'consultorio': return 'Consultório';
      case 'clinica': return 'Clínica';
      default: return 'Estabelecimento';
    }
  };

  return (
    <div
      className={cn("bg-sidebar border-r border-sidebar-border h-full flex flex-col relative", className)}
      style={{ width: `${width}px` }}
    >
      <div className="p-6 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-primary rounded-lg">
            <Stethoscope className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-sidebar-foreground">
              CleanFlow
            </h1>
            <p className="text-sm text-muted-foreground leading-tight break-words">
              {isLoading ? "Carregando..." : displayName}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation with ScrollArea */}
      <ScrollArea className="flex-1 px-4">
        <nav className="py-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Button
                key={item.href}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-11",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-medical"
                    : "hover:bg-sidebar-accent text-sidebar-foreground"
                )}
                asChild
              >
                <Link to={item.href} onClick={onLinkClick}>
                  <Icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : item.color)} />
                  <span className="flex-1 text-left">{item.title}</span>
                </Link>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Status indicator - Fixed at bottom */}
      <div className="p-4 flex-shrink-0">
        <div className="bg-success-light border border-success/20 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-success">Sistema Ativo</span>
          </div>
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className={cn(
          "absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors group",
          isResizing && "bg-primary"
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