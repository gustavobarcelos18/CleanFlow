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
        "bg-background/80 backdrop-blur-md border-b border-border px-6 h-20 flex items-center sticky top-0 z-[90]",
        className,
      )}
    >
      <div className="flex items-center justify-between w-full gap-2 md:gap-4">
        {/* Date and Quick Stats - Oculto em mobile extremo */}
        <div className="flex items-center gap-2 md:gap-6 shrink-0">
          <div className="hidden sm:block shrink-0">
            <h2 className="text-[10px] sm:text-sm lg:text-lg font-bold text-foreground capitalize tracking-tight truncate max-w-[80px] sm:max-w-none">
              {currentDate}
            </h2>
            <p className="hidden lg:block text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
              Painel de Controle
            </p>
          </div>

          {/* Quick Stats - Resumido em telas pequenas */}
          {(stats.today > 0 || stats.pending > 0 || stats.waiting > 0) && (
            <div className="hidden sm:flex items-center gap-1.5 md:gap-2">
              {stats.today > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 bg-primary/10 border border-primary/20 rounded-full whitespace-nowrap">
                  <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-primary italic">
                    {stats.today}
                  </span>
                </div>
              )}
              {stats.pending > 0 && (
                <div className="flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 bg-amber-500/10 border border-amber-500/20 rounded-full whitespace-nowrap">
                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-amber-500 italic">
                    {stats.pending}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Center Title - Centralizado e Reduzido */}
        <div className="flex-1 flex flex-col items-center justify-center px-1 md:px-2 min-w-0">
          {title && (
            <h1 className="text-[11px] sm:text-sm md:text-lg lg:text-2xl font-black text-foreground tracking-tight leading-loose truncate w-full text-center uppercase italic">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="hidden md:block text-[9px] lg:text-[11px] text-muted-foreground font-bold mt-0.5 uppercase tracking-[0.05em] lg:tracking-[0.2em] opacity-60 truncate w-full text-center">
              {subtitle}
            </p>
          )}
        </div>
        {/* User Actions - Priorização de itens */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <TooltipProvider>
            <div className="flex items-center gap-1 sm:gap-3">
              <div className="hidden xs:flex">
                <SupportChatWidget variant="header" />
              </div>
              
              <div className="hidden xs:flex">
                <ThemeToggle />
              </div>

              <div className="hidden sm:block h-6 w-px bg-border mx-0.5" />
              
              <AlertsPopover />

              <Button
                variant="ghost"
                className="flex items-center gap-2 hover:bg-muted py-1 px-1 sm:px-2 rounded-xl"
                asChild
              >
                <Link to="/perfil">
                  <Avatar className="w-7 h-7 sm:w-9 sm:h-9 border-2 border-primary/20 shadow-lg shadow-primary/10">
                    {profile?.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={profile.nome} />
                    ) : (
                      <AvatarFallback className="bg-primary/20 text-primary text-[10px] sm:text-xs font-black">
                        {profile?.nome ? (
                          getInitials(profile.nome)
                        ) : (
                          <User className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-black text-foreground leading-tight truncate max-w-[80px]">
                      {profile?.nome || user?.email}
                    </p>
                  </div>
                </Link>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-8 w-8 sm:h-9 sm:w-9"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
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
