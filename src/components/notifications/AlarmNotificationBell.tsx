import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { playNotificationSound, playUrgentNotificationSound } from '@/utils/notificationSound';

interface Alarme {
    id: string;
    titulo: string;
    descricao: string;
    tipo: 'alarme' | 'lembrete' | 'tarefa';
    prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
    data_hora: string;
    concluido: boolean;
}

export function AlarmNotificationBell() {
    const { profile } = useAuth();
    const [alarmes, setAlarmes] = useState<Alarme[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!profile?.id) return;

        loadAlarmes();

        // Verificar alarmes a cada minuto
        const interval = setInterval(() => {
            checkForTriggeredAlarms();
        }, 60000); // 1 minuto

        // Subscription em tempo real
        const channel = supabase
            .channel('alarmes_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'alarmes_lembretes',
                    filter: `usuario_id=eq.${profile.id}`
                },
                () => {
                    loadAlarmes();
                }
            )
            .subscribe();

        return () => {
            clearInterval(interval);
            channel.unsubscribe();
        };
    }, [profile?.id]);

    const loadAlarmes = async () => {
        if (!profile?.id) return;

        try {
            const now = new Date();
            const { data, error } = await supabase
                .from('alarmes_lembretes')
                .select('*')
                .eq('usuario_id', profile.id)
                .eq('concluido', false)
                .eq('ativo', true)
                .lte('data_hora', now.toISOString())
                .order('data_hora', { ascending: false })
                .limit(10);

            if (error) throw error;

            setAlarmes(data || []);
            setUnreadCount(data?.length || 0);
        } catch (error) {
            console.error('Erro ao carregar alarmes:', error);
        }
    };

    const checkForTriggeredAlarms = async () => {
        if (!profile?.id) return;

        try {
            const now = new Date();
            const oneMinuteAgo = new Date(now.getTime() - 60000);

            const { data, error } = await supabase
                .from('alarmes_lembretes')
                .select('*')
                .eq('usuario_id', profile.id)
                .eq('concluido', false)
                .eq('ativo', true)
                .gte('data_hora', oneMinuteAgo.toISOString())
                .lte('data_hora', now.toISOString());

            if (error) throw error;

            // Se houver novos alarmes disparados
            if (data && data.length > 0) {
                data.forEach((alarme: any) => {
                    // Som diferente para urgente
                    if (alarme.prioridade === 'urgente') {
                        playUrgentNotificationSound();
                    } else {
                        playNotificationSound();
                    }
                    showNotification(alarme);
                });
                loadAlarmes();
            }
        } catch (error) {
            console.error('Erro ao verificar alarmes disparados:', error);
        }
    };

    const showNotification = (alarme: Alarme) => {
        const prioridadeEmoji = {
            baixa: '📌',
            media: '⚠️',
            alta: '🔔',
            urgente: '🚨'
        };

        toast.warning(
            `${prioridadeEmoji[alarme.prioridade]} ${alarme.titulo}`,
            {
                description: alarme.descricao,
                duration: 10000,
                action: {
                    label: 'Ver',
                    onClick: () => window.location.href = '/alarmes-lembretes'
                }
            }
        );
    };

    const marcarComoConcluido = async (id: string) => {
        try {
            const { error } = await supabase
                .from('alarmes_lembretes')
                .update({ concluido: true })
                .eq('id', id);

            if (error) throw error;

            toast.success('Alarme marcado como concluído');
            loadAlarmes();
        } catch (error) {
            console.error('Erro ao marcar alarme:', error);
            toast.error('Erro ao marcar alarme como concluído');
        }
    };

    const getPrioridadeColor = (prioridade: string) => {
        const colors = {
            baixa: 'bg-gray-100 text-gray-800',
            media: 'bg-yellow-100 text-yellow-800',
            alta: 'bg-orange-100 text-orange-800',
            urgente: 'bg-red-100 text-red-800'
        };
        return colors[prioridade as keyof typeof colors] || colors.media;
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Alarmes Ativos</h4>
                        {unreadCount > 0 && (
                            <Badge variant="secondary">{unreadCount}</Badge>
                        )}
                    </div>

                    <ScrollArea className="h-[400px]">
                        {alarmes.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>Nenhum alarme ativo</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {alarmes.map((alarme) => (
                                    <div
                                        key={alarme.id}
                                        className="p-3 border rounded-lg space-y-2 hover:bg-accent transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <h5 className="font-medium text-sm">{alarme.titulo}</h5>
                                                {alarme.descricao && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {alarme.descricao}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge className={getPrioridadeColor(alarme.prioridade)}>
                                                {alarme.prioridade}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(alarme.data_hora), "dd/MM/yyyy 'às' HH:mm", {
                                                    locale: ptBR
                                                })}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => marcarComoConcluido(alarme.id)}
                                            >
                                                Concluir
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    {alarmes.length > 0 && (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => window.location.href = '/alarmes-lembretes'}
                        >
                            Ver Todos os Alarmes
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
