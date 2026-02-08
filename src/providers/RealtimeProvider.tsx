import React, { createContext, useContext, useEffect, useRef } from 'react';
import { RealtimePostgresChangesPayload, RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type RealtimeCallback = (payload: RealtimePostgresChangesPayload<any>) => void;

interface RealtimeSubscription {
    channel: RealtimeChannel;
    callbacks: Set<RealtimeCallback>;
}

interface RealtimeContextType {
    subscribe: (
        table: string,
        callback: RealtimeCallback,
        event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
        filter?: string
    ) => () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Map of "table:event:filter" -> Subscription
    const subscriptions = useRef<Map<string, RealtimeSubscription>>(new Map());

    const subscribe = (
        table: string,
        callback: RealtimeCallback,
        event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
        filter?: string
    ) => {
        const key = `${table}:${event}:${filter || ''}`;

        if (!subscriptions.current.has(key)) {
            console.log(`[RealtimeProvider] Criando novo canal para: ${key}`);
            const channel = supabase
                .channel(`rt:${key}`)
                .on(
                    'postgres_changes' as any,
                    { schema: 'public', table, event, filter },
                    (payload: any) => {
                        const sub = subscriptions.current.get(key);
                        if (sub) {
                            sub.callbacks.forEach(cb => cb(payload));
                        }
                    }
                )
                .subscribe();

            subscriptions.current.set(key, {
                channel,
                callbacks: new Set([callback])
            });
        } else {
            console.log(`[RealtimeProvider] Reutilizando canal existente para: ${key}`);
            subscriptions.current.get(key)!.callbacks.add(callback);
        }

        // Return unsubscribe function
        return () => {
            const sub = subscriptions.current.get(key);
            if (sub) {
                sub.callbacks.delete(callback);
                if (sub.callbacks.size === 0) {
                    console.log(`[RealtimeProvider] Removendo canal sem inscritos: ${key}`);
                    supabase.removeChannel(sub.channel);
                    subscriptions.current.delete(key);
                }
            }
        };
    };

    return (
        <RealtimeContext.Provider value={{ subscribe }}>
            {children}
        </RealtimeContext.Provider>
    );
};

export const useRealtimeContext = () => {
    const context = useContext(RealtimeContext);
    if (!context) {
        throw new Error('useRealtimeContext deve ser usado dentro de um RealtimeProvider');
    }
    return context;
};
