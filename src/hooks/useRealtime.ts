import { useEffect, useRef } from 'react';
import { useRealtimeContext } from '@/providers/RealtimeProvider';
import { useQueryClient, QueryKey } from '@tanstack/react-query';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Hook para escutar mudanças em uma tabela específica
 */
export function useRealtime<T = Record<string, unknown>>(
    table: string,
    callback: (payload: RealtimePostgresChangesPayload<T>) => void,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
    filter?: string
) {
    const { subscribe } = useRealtimeContext();
    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const unsubscribe = subscribe(
            table,
            (payload) => callbackRef.current(payload),
            event,
            filter
        );
        return unsubscribe;
    }, [table, event, filter, subscribe]);
}

/**
 * Hook utilitário para invalidar queries do React Query quando houver mudanças no banco
 */
export function useInvalidateOnChanges(
    table: string,
    queryKeys: QueryKey[],
    options?: {
        event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
        filter?: string;
        debounceMs?: number;
    }
) {
    const queryClient = useQueryClient();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useRealtime(
        table,
        () => {
            if (options?.debounceMs) {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(() => {
                    queryKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
                }, options.debounceMs);
            } else {
                queryKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
            }
        },
        options?.event || '*',
        options?.filter
    );

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);
}
