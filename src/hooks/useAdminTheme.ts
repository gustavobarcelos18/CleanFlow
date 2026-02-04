import { useEffect, useLayoutEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Theme = 'light' | 'dark';

export function useAdminTheme() {
    const [theme, setTheme] = useState<Theme>(() => {
        // Initialize from localStorage to avoid FOUC
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('admin-theme') as Theme;
            return saved || 'dark';
        }
        return 'dark';
    });
    const [loading, setLoading] = useState(true);

    // Apply theme immediately before paint
    useLayoutEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        // Also save to localStorage to ensure consistency
        localStorage.setItem('admin-theme', theme);
    }, [theme]);

    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setLoading(false);
                return;
            }

            const { data: systemUser, error } = await supabase
                .from('system_users')
                .select('theme_preference')
                .eq('id', user.id)
                .single();

            if (!error && systemUser) {
                const userTheme = (systemUser as any).theme_preference as Theme;
                if (userTheme && userTheme !== theme) {
                    setTheme(userTheme);
                }
            }
        } catch (error) {
            console.error('Erro ao carregar tema:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTheme = async () => {
        const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('system_users')
                    .update({ theme_preference: newTheme } as any)
                    .eq('id', user.id);
            }
            toast.success(`Tema ${newTheme === 'dark' ? 'escuro' : 'claro'} ativado`);
        } catch (error) {
            console.error('Erro ao salvar tema:', error);
        }
    };

    return {
        theme,
        toggleTheme,
        loading
    };
}
