import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Button } from "@/components/ui/button";
import { Menu, AlertTriangle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useSidebarWidth } from "@/hooks/useSidebarWidth";

interface MobileLayoutProps {
  children: React.ReactNode;
  contentClassName?: string;
}

export function MobileLayout({ children, contentClassName }: MobileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { profile, loading } = useAuth();
  const navigate = useNavigate();
  const { width, isResizing } = useSidebarWidth();
  const [impersonationId, setImpersonationId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("support_impersonation_tenant_id");
    setImpersonationId(id);
  }, []);

  // Redirect to signup if user has no tenant (first time OAuth users)
  useEffect(() => {
    if (!loading && profile && !profile.tenant_id && !impersonationId) {
      navigate("/signup");
    }
  }, [profile, loading, navigate, impersonationId]);

  const handleExitImpersonation = () => {
    localStorage.removeItem("support_impersonation_tenant_id");
    window.location.href = "/admin/tenants";
  };

  const ImpersonationBanner = () => (
    <div className="bg-orange-600 text-white px-2 sm:px-4 py-2 flex items-center justify-between shadow-md z-[60] relative">
      <div className="flex items-center gap-1 sm:gap-2">
        <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
        <span className="text-[10px] sm:text-sm font-medium truncate">
          Modo Suporte Administrador
        </span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="h-6 sm:h-7 text-[10px] sm:text-xs bg-white text-orange-600 hover:bg-orange-50 border-0"
        onClick={handleExitImpersonation}
      >
        <LogOut className="h-3 w-3 mr-1" />
        Sair
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
        {impersonationId && <ImpersonationBanner />}

        {/* Mobile Header with Menu Button */}
        <div className="sticky top-0 z-50 flex items-center gap-2 p-2 sm:p-4 bg-card/80 backdrop-blur-md border-b border-border h-16 sm:h-20">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 sm:w-80 border-r-0">
              <Sidebar onLinkClick={() => setSidebarOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex-1 min-w-0">
            <Header className="p-0 border-0 h-auto bg-transparent backdrop-blur-none sticky-none" />
          </div>
        </div>

        {/* Main Content */}
        <main className={cn("flex-1 p-4 overflow-x-hidden pt-6", contentClassName)}>
          <div className="max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Desktop layout

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-clip">
      {impersonationId && <ImpersonationBanner />}
      <div className="flex w-full">
        {/* Sidebar - z-50 to stay above everything */}
        <div
          className="fixed left-0 top-0 h-full z-50 border-r border-border/50 hidden md:block"
          style={{ 
            top: impersonationId ? "44px" : "0",
            width: `${width}px`
          }}
        >
          <Sidebar />
        </div>

        {/* Main Content Area - scrolls independently if needed */}
        <div
          className={cn(
            "flex-1 relative z-0 min-w-0 min-h-screen",
            !isResizing && "transition-all duration-200 ease-out",
          )}
          style={{ marginLeft: isMobile ? "0px" : `${width}px` }}
        >
          <Header className="hidden md:flex" />
          <main className={cn("p-6 md:p-10 max-w-full overflow-x-hidden", contentClassName)}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
