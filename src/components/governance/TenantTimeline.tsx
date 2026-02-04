import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useTenantTimeline, TimelineEvent } from '@/hooks/governance/useTenantTimeline';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, AlertTriangle, FileText, MessageSquare, DollarSign } from 'lucide-react';

export function TenantTimeline() {
    const { events, loading } = useTenantTimeline();

    if (loading) {
        return <div>Carregando timeline...</div>;
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'billing': return <DollarSign className="h-4 w-4" />;
            case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
            case 'security': return <AlertTriangle className="h-4 w-4" />;
            case 'export': return <FileText className="h-4 w-4" />;
            default: return <Activity className="h-4 w-4" />;
        }
    };

    const getBadgeVariant = (level?: string) => {
        switch (level) {
            case 'error': return 'destructive';
            case 'warning': return 'secondary'; // or yellow if custom
            default: return 'outline';
        }
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Timeline de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                        {events.map((event) => (
                            <div key={event.id} className="flex gap-4 border-b pb-4 last:border-0">
                                <div className="mt-1 bg-muted p-2 rounded-full h-fit">
                                    {getIcon(event.type)}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium leading-none">
                                            {event.type.toUpperCase()}
                                        </p>
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(event.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {event.description}
                                    </p>
                                    {event.level && (
                                        <Badge variant={getBadgeVariant(event.level)} className="mt-2 text-xs">
                                            {event.level}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                        {events.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">
                                Nenhum evento registrado recentemente.
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
