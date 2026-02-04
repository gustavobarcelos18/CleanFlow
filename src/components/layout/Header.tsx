import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AlertsPopover } from "@/components/layout/AlertsPopover";
import { WhatsAppNotificationBadge } from "@/components/admin/WhatsAppNotificationBadge";
import { AlarmNotificationBell } from "@/components/notifications/AlarmNotificationBell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { startOfDay, endOfDay } from "date-fns";
import {
  User,
  Calendar,
  Clock,
  Users,
  LogOut
} from "lucide-react";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    waiting: 0
  });

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
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
        .from('agenda')
        .select('id', { count: 'exact', head: true })
        .gte('inicio', dayStart.toISOString())
        .lte('inicio', dayEnd.toISOString());

      // Pendentes de confirmação
      const { data: pendingData } = await supabase
        .from('agenda')
        .select('id', { count: 'exact', head: true })
        .gte('inicio', dayStart.toISOString())
        .lte('inicio', dayEnd.toISOString())
        .eq('confirmado', false)
        .eq('status', 'agendado');

      // Lista de espera
      const { data: waitingData } = await supabase
        .from('lista_espera')
        .select('id', { count: 'exact', head: true })
        .eq('ativo', true);

      setStats({
        today: todayData?.length || 0,
        pending: pendingData?.length || 0,
        waiting: waitingData?.length || 0
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className={cn("bg-card border-b border-border p-4", className)}>
      <div className="flex items-center justify-between">
        {/* Date and Quick Stats */}
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground capitalize">
              {currentDate}
            </h2>
            <p className="text-sm text-muted-foreground">
              Painel de controle da clínica
            </p>
          </div>

          {/* Quick Stats - Only show when there's data */}
          {(stats.today > 0 || stats.pending > 0 || stats.waiting > 0) && (
            <div className="hidden md:flex items-center gap-4">
              {stats.today > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-primary-light rounded-lg">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{stats.today} consultas hoje</span>
                </div>
              )}
              {stats.pending > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-warning-light rounded-lg">
                  <Clock className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium text-warning">{stats.pending} pendentes</span>
                </div>
              )}
              {stats.waiting > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-success-light rounded-lg">
                  <Users className="h-4 w-4 text-success" />
                  <span className="text-sm font-medium text-success">{stats.waiting} na espera</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* WhatsApp Notifications */}
          <WhatsAppNotificationBadge />

          {/* Alarm Notifications */}
          <AlarmNotificationBell />

          {/* Notifications */}
          <AlertsPopover />

          {/* User Profile */}
          <Button variant="ghost" className="gap-2" asChild>
            <Link to="/perfil">
              <Avatar className="w-8 h-8">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.nome} />
                ) : (
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs">
                    {profile?.nome ? getInitials(profile.nome) : <User className="h-4 w-4" />}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium">{profile?.nome || user?.email}</p>
                <p className="text-xs text-muted-foreground">
                  {profile?.role === "admin" ? "Administrador" : profile?.role === "profissional" ? "Profissional" : "Usuário"}
                </p>
              </div>
            </Link>
          </Button>

          {/* Logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => signOut()}>
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Sair do CleanFlow</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}