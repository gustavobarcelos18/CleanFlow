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
import { SupportChatWidget } from "@/components/support/SupportChatWidget";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
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
    <div className="bg-orange-600 text-white px-4 py-2 flex items-center justify-between shadow-md z-50 relative">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">
          Acessando como Suporte Administrativo
        </span>
      </div>
      <Button
        variant="secondary"
        size="sm"
        className="h-7 text-xs bg-white text-orange-600 hover:bg-orange-50 border-0"
        onClick={handleExitImpersonation}
      >
        <LogOut className="h-3 w-3 mr-1" />
        Sair do Acesso
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {impersonationId && <ImpersonationBanner />}
        <div className="flex flex-col h-screen">
          {/* Mobile Header with Menu Button */}
          <div className="flex items-center gap-2 p-4 bg-card border-b border-border">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar onLinkClick={() => setSidebarOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="flex-1">
              <Header className="p-0 border-0" />
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 overflow-auto p-4">{children}</main>
        </div>
        <SupportChatWidget />
      </div>
    );
  }

  // Desktop layout

  return (
    <div className="min-h-screen bg-background text-foreground">
      {impersonationId && <ImpersonationBanner />}
      <div className="flex">
        {/* Sidebar - z-40 para ficar acima do conteúdo */}
        <div
          className="fixed left-0 top-0 h-full z-40"
          style={{ top: impersonationId ? "44px" : "0" }}
        >
          <Sidebar />
        </div>

        {/* Main Content - z-0 para ficar abaixo do sidebar */}
        <div
          className={cn(
            "flex-1 relative z-0",
            !isResizing && "transition-all duration-200 ease-out",
          )}
          style={{ marginLeft: `${width}px` }}
        >
          <Header />
          <main className="p-6">{children}</main>
        </div>
      </div>
      <SupportChatWidget />
    </div>
  );
}
