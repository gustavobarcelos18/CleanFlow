import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const DEFAULT_WIDTH = 256; // 64 * 4 = w-64 in tailwind

export function useSidebarWidth() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    loadWidth();
  }, []);

  const loadWidth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await (supabase
        .from('user_preferences' as any)
        .select('sidebar_width')
        .eq('user_id', user.id)
        .maybeSingle() as any);

      if (data?.sidebar_width) {
        setWidth(data.sidebar_width);
      }
    } catch (error: any) {
      // Ignora erro se a tabela não existir ou outro erro de busca, mantendo o fallback DEFAULT_WIDTH
      if (error?.code !== 'PGRST116' && error?.status !== 404) {
        console.error('Erro ao carregar largura da sidebar:', error);
      }
    }
  };

  const saveWidth = async (newWidth: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase
        .from('user_preferences' as any)
        .upsert({
          user_id: user.id,
          sidebar_width: newWidth,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        } as any) as any);
    } catch (error) {
      console.error('Erro ao salvar largura da sidebar:', error);
    }
  };

  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;

    const newWidth = Math.min(Math.max(e.clientX, MIN_WIDTH), MAX_WIDTH);
    setWidth(newWidth);
  };

  const handleMouseUp = () => {
    if (isResizing) {
      setIsResizing(false);
      saveWidth(width);
    }
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, width]);

  return {
    width,
    isResizing,
    handleMouseDown,
    MIN_WIDTH,
    MAX_WIDTH
  };
}
