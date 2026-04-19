import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { normalizeWhatsAppStatus, WhatsappInstance, WhatsAppStatus } from '@/types/whatsapp';
import { toast } from 'sonner';

export const useWhatsAppConnection = (tenantId: string | undefined, isActiveTab: boolean) => {
  const [instance, setInstance] = useState<WhatsappInstance | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  
  // Timer references to avoid memory leaks
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isComponentMounted = useRef(true);

  useEffect(() => {
    isComponentMounted.current = true;
    return () => {
      isComponentMounted.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const fetchInstance = useCallback(async () => {
    if (!tenantId) return null;
    try {
      const { data, error } = await supabase
        .from('whatsapp_instances')
        // Explicitly omitting session_data and queue-specific fields
        .select('id, tenant_id, name, status, qr_code, last_activity, metadata, created_at, updated_at')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (isComponentMounted.current) {
        if (data) {
          setInstance({
            ...data,
            status: normalizeWhatsAppStatus(data.status),
            metadata: data.metadata ? (data.metadata as Record<string, unknown>) : {}
          } as WhatsappInstance);
        } else {
          setInstance(null);
        }
      }
      return data;
    } catch (err: unknown) {
      if (isComponentMounted.current) {
        toast.error('Erro ao carregar status do WhatsApp');
        console.error('Fetch error:', err instanceof Error ? err.message : String(err));
      }
      return null;
    } finally {
      if (isComponentMounted.current) {
        setIsLoading(false);
      }
    }
  }, [tenantId]);

  // Recursive polling logic as a singleton
  const runPoll = useCallback(async () => {
    // If unmounted or hidden/inactive, we definitely don't poll
    if (!isComponentMounted.current) return;
    
    // Clear any existing timer to avoid overlapping
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);

    if (document.hidden || !isActiveTab) {
      // If hidden or not in the active tab, we check again in 5s
      // We don't fetch anything to save resources
      pollTimerRef.current = setTimeout(runPoll, 5000);
      return;
    }

    setIsPolling(true);
    const data = await fetchInstance();
    setIsPolling(false);
    
    if (!isComponentMounted.current) return;

    // Adaptive interval
    const status = normalizeWhatsAppStatus(data?.status);
    let nextInterval = 15000; // Slow poll: 15s
    
    if (status === 'CONNECTING' || status === 'QR_READY') {
      nextInterval = 3000; // Fast poll: 3s
    }

    // Schedule the next poll ONLY if it hasn't been unmounted during fetch
    if (isComponentMounted.current) {
      pollTimerRef.current = setTimeout(runPoll, nextInterval);
    }
  }, [isActiveTab, fetchInstance]);

  // Handle visibility changes and tab changes to restart or stop polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      } else if (isActiveTab && tenantId) {
        // Resume polling immediately when returning to the tab
        if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
        runPoll();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Initial start if everything is active
    if (tenantId && !isLoading) {
      runPoll();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [isActiveTab, tenantId, isLoading, runPoll]);

  // Initial load effect
  useEffect(() => {
    fetchInstance();
  }, [fetchInstance]);

  // Actions
  const createInstance = async () => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const { error } = await supabase.from('whatsapp_instances').insert({
        tenant_id: tenantId,
        name: 'Principal',
        status: 'DISCONNECTED'
      });
      if (error) throw error;
      toast.success('Instância criada! Você pode conectar agora.');
      await fetchInstance();
    } catch (err: unknown) {
      toast.error('Não foi possível criar a instância.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (newStatus: WhatsAppStatus) => {
    if (!instance?.id) return;
    try {
      // Disconnecting or Re-Connecting implies clearing the QR
      const shouldClearQr = ['DISCONNECTED', 'CONNECTING'].includes(newStatus);
      
      const updateData = shouldClearQr 
        ? { status: newStatus, qr_code: null, updated_at: new Date().toISOString() } 
        : { status: newStatus, updated_at: new Date().toISOString() };

      const { error } = await supabase
        .from('whatsapp_instances')
        .update(updateData)
        .eq('id', instance.id);

      if (error) throw error;
      
      // Update local state optimisticially
      setInstance(prev => prev ? { ...prev, ...updateData } as WhatsappInstance : null);
      
      if (newStatus === 'CONNECTING') toast.info('Processando...');
      if (newStatus === 'DISCONNECTED') toast.success('Comando enviado.');
    } catch (err) {
      toast.error('Erro ao registrar intenção');
    }
  };

  return {
    instance,
    isLoading,
    isPolling,
    createInstance,
    updateStatus,
  };
};
