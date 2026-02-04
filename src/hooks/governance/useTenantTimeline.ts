import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TimelineEvent {
    id: string;
    type: string;
    description: string;
    user_id?: string;
    created_at: string;
    metadata?: any;
    level?: string;
}

export function useTenantTimeline() {
    const { profile } = useAuth();
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile?.tenant_id) return;

        const fetchEvents = async () => {
            setLoading(true);
            try {
                // Fetch from system_logs
                const { data, error } = await supabase
                    .from('system_logs')
                    .select('*')
                    .eq('tenant_id', profile.tenant_id)
                    .order('created_at', { ascending: false })
                    .limit(50);

                if (error) throw error;

                const formattedEvents: TimelineEvent[] = data.map((log: any) => ({
                    id: log.id,
                    type: log.service || 'system',
                    description: log.message,
                    user_id: log.user_id,
                    created_at: log.created_at,
                    metadata: log.metadata,
                    level: log.level
                }));

                setEvents(formattedEvents);
            } catch (err) {
                console.error('Error fetching timeline:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [profile?.tenant_id]);

    return { events, loading };
}
