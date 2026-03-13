import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AlertsPopover } from "@/components/layout/AlertsPopover";
import { WhatsAppNotificationBadge } from "@/components/admin/WhatsAppNotificationBadge";
import { AlarmNotificationBell } from "@/components/notifications/AlarmNotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { startOfDay, endOfDay } from "date-fns";
import { User, Calendar, Clock, Users, LogOut } from "lucide-react";
import { useLayoutTitle } from "@/hooks/useLayoutTitle";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { title, subtitle } = useLayoutTitle();
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    waiting: 0,
  });

  const currentDate = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const dayStart = startOfDay(now);
      const dayEnd = endOfDay(now);

      // Consultas de hoje
      const { data: todayData } = await supabase
        .from("agenda")
        .select("id", { count: "exact", head: true })
        .gte("inicio", dayStart.toISOString())
        .lte("inicio", dayEnd.toISOString());

      // Pendentes de confirmação
      const { data: pendingData } = await supabase
        .from("agenda")
        .select("id", { count: "exact", head: true })
        .gte("inicio", dayStart.toISOString())
        .lte("inicio", dayEnd.toISOString())
        .eq("confirmado", false)
        .eq("status", "agendado");

      // Lista de espera
      const { data: waitingData } = await supabase
        .from("lista_espera")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true);

      setStats({
        today: todayData?.length || 0,
        pending: pendingData?.length || 0,
        waiting: waitingData?.length || 0,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header
      className={cn(
        "bg-background/80 backdrop-blur-md border-b border-border px-6 h-20 flex items-center sticky top-0 z-40",
        className,
      )}
    >
      <div className="flex items-center justify-between w-full">
        {/* Date and Quick Stats */}
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-xl font-bold text-foreground capitalize tracking-tight">
              {currentDate}
            </h2>
            <p className="text-sm text-muted-foreground">
              Painel de controle da clínica
            </p>
          </div>

          {/* Quick Stats - Only show when there's data */}
          {(stats.today > 0 || stats.pending > 0 || stats.waiting > 0) && (
            <div className="hidden md:flex items-center gap-3">
              {stats.today > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-bold text-primary">
                    {stats.today} hoje
                  </span>
                </div>
              )}
              {stats.pending > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 border border-warning/20 rounded-full">
                  <Clock className="h-3.5 w-3.5 text-warning" />
                  <span className="text-xs font-bold text-warning">
                    {stats.pending} alertas
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Center Title */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 animate-in fade-in slide-in-from-top-2 duration-500">
          {title && (
            <h1 className="text-2xl font-black text-foreground tracking-tight leading-none">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-[11px] text-muted-foreground font-medium mt-1 uppercase tracking-[0.2em] opacity-70">
              {subtitle}
            </p>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <div className="flex items-center gap-3">
              <SupportChatWidget variant="header" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <ThemeToggle />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={10}>
                  <p className="font-medium text-xs">Alternar Tema</p>
                </TooltipContent>
              </Tooltip>

              <div className="h-6 w-px bg-border mx-1" />
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center">
                    <AlertsPopover />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={10}>
                  <p className="font-medium text-xs">Notificações</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-3 hover:bg-muted transition-all duration-200 py-1.5 px-2 rounded-xl"
                    asChild
                  >
                    <Link to="/perfil">
                      <Avatar className="w-9 h-9 border-2 border-primary/20 shadow-lg shadow-primary/10">
                        {profile?.avatar_url ? (
                          <AvatarImage src={profile.avatar_url} alt={profile.nome} />
                        ) : (
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-black">
                            {profile?.nome ? (
                              getInitials(profile.nome)
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <p className="text-sm font-black text-foreground leading-tight">
                          {profile?.nome || user?.email}
                        </p>
                        <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">
                          {profile?.role === "admin"
                            ? "Administrador"
                            : profile?.role === "profissional"
                              ? "Profissional"
                              : "Usuário"}
                        </p>
                      </div>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={10}>
                  <p className="font-medium text-xs">Meu Perfil</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={10}>
                  <p className="font-medium text-xs">Sair</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>
    </header>
  );
}
