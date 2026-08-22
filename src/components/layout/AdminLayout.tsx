import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LayoutDashboard,
  Ticket,
  Users,
  Package,
  Shield,
  FileText,
  BarChart3,
  MessageSquare,
  Settings,
  Bell,
  Building2,
  Workflow,
  ListChecks,
  Plug,
  Puzzle,
  Scale,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Headphones,
} from "lucide-react";
import { useSidebarWidth } from "@/hooks/useSidebarWidth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdminThemeToggle } from "@/components/admin/AdminThemeToggle";
import { ChatNotificationBell } from "@/components/admin/ChatNotificationBell";
import { useAdminTheme } from "@/hooks/useAdminTheme";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const adminMenuItems = [
  {
    title: "Painel de Suporte",
    icon: Headphones,
    href: "/admin",
    color: "text-blue-600",
  },
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
    color: "text-blue-500",
  },
  {
    title: "Alarmes",
    icon: Bell,
    href: "/admin/alarmes-lembretes",
    color: "text-yellow-500",
  },
  {
    title: "Automações",
    icon: Workflow,
    href: "/admin/automations",
    color: "text-pink-500",
  },
  {
    title: "Equipe",
    icon: Users,
    href: "/admin/users",
    color: "text-amber-500",
  },
  {
    title: "Governança Org",
    icon: Scale,
    href: "/admin/org-governance",
    color: "text-indigo-500",
  },
  {
    title: "Governança Tenant",
    icon: Shield,
    href: "/admin/governanca-tenant",
    color: "text-cyan-500",
  },
  {
    title: "Integrações",
    icon: Plug,
    href: "/admin/integracoes-api",
    color: "text-violet-500",
  },
  {
    title: "Lista de Espera",
    icon: ListChecks,
    href: "/admin/lista-espera",
    color: "text-teal-500",
  },
  {
    title: "Planos",
    icon: DollarSign,
    href: "/admin/planos",
    color: "text-emerald-500",
  },
  {
    title: "Plugins",
    icon: Puzzle,
    href: "/admin/plugins",
    color: "text-rose-500",
  },
  {
    title: "Relatórios",
    icon: BarChart3,
    href: "/admin/reports",
    color: "text-green-500",
  },
  {
    title: "Tenants",
    icon: Building2,
    href: "/admin/tenants",
    color: "text-purple-500",
  },
  {
    title: "Tickets",
    icon: Ticket,
    href: "/admin/tickets",
    color: "text-orange-500",
  },
  {
    title: "WhatsApp",
    icon: MessageSquare,
    href: "/admin/whatsapp",
    color: "text-green-600",
  },
];


export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { width: sidebarWidth, isResizing } = useSidebarWidth();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  useAdminTheme(); // Ensure theme is applied immediately

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/admin/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast.error("Erro ao fazer logout");
    }
  };

  const SidebarContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div className="flex flex-col h-full bg-[#0B1220]">
      {/* Header Sidebar */}
      <div className="p-4 border-b border-[#1B2A40] flex items-center justify-between h-16 shrink-0">
        {(!isCollapsed || isMobile) && (
          <div>
            <h2 className="font-black text-lg tracking-tight text-white">
              Admin <span className="text-cyan-400">Flow</span>
            </h2>
            <p className="text-[10px] uppercase font-bold text-cyan-400/70 tracking-widest">
              Suporte Master
            </p>
          </div>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="ml-auto"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Menu Items */}
      <ScrollArea className="flex-1 px-2 py-4">
        <nav className="space-y-1">
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link key={item.href} to={item.href} onClick={onLinkClick}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-4 h-12 sm:h-14 transition-all duration-200 rounded-xl",
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 font-black border-r-4 border-cyan-400 rounded-none shadow-lg shadow-cyan-500/10"
                      : "text-[#A9B7D0] hover:bg-white/5 hover:text-white font-semibold",
                    isCollapsed && !isMobile && "justify-center px-2",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0",
                      isActive ? "text-cyan-400" : "text-[#A9B7D0]",
                    )}
                  />
                  {(!isCollapsed || isMobile) && (
                    <span className="truncate text-[14px] sm:text-[15px] tracking-tight text-left flex-1">
                      {item.title}
                    </span>
                  )}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Footer com Logout */}
      <div className="p-4 border-t border-[#1B2A40] space-y-2 shrink-0">
        <Link to="/admin/settings" onClick={onLinkClick}>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-10 text-muted-foreground hover:text-foreground",
              isCollapsed && !isMobile && "justify-center px-2",
            )}
          >
            <Settings className="h-5 w-5 flex-shrink-0" />
            {(!isCollapsed || isMobile) && <span>Configurações</span>}
          </Button>
        </Link>

        <Button
          variant="outline"
          className={cn(
            "w-full justify-start gap-3 h-10 text-red-600 hover:text-red-700 hover:bg-red-50/5 border-[#1B2A40]",
            isCollapsed && !isMobile && "justify-center px-2",
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {(!isCollapsed || isMobile) && <span>Sair</span>}
        </Button>

        {(!isCollapsed || isMobile) && (
          <div className="text-[10px] text-muted-foreground pt-2">
            <p className="font-semibold">ClinFlow Admin v1.0.0</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#070B12] text-[#EAF2FF]">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            "border-r border-[#1B2A40] bg-[#0B1220] transition-all duration-300 flex flex-col shrink-0",
            isCollapsed ? "w-16" : "w-64",
          )}
          style={{ width: isCollapsed ? "64px" : sidebarWidth }}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header - Persistente */}
        <header className="h-14 sm:h-16 border-b border-[#1B2A40] bg-[#070B12]/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-10 w-full">
          <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
            {isMobile && (
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 text-[#A9B7D0]">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 border-r-[#1B2A40] bg-[#0B1220]">
                  <SidebarContent onLinkClick={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>
            )}
            <h1 className="text-[10px] sm:text-xs md:text-sm font-bold text-[#A9B7D0] uppercase tracking-widest truncate">
              {adminMenuItems.find((i) => i.href === location.pathname)
                ?.title || "Administração"}
            </h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <AdminThemeToggle />
            <ChatNotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <main
          className={cn(
            "flex-1 overflow-x-hidden overflow-y-auto bg-[#070B12]",
            !isResizing && "transition-all duration-200 ease-out",
          )}
        >
          <div className="p-4 sm:p-6 lg:p-8 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
