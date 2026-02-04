import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TourStep {
  target: string;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export const useTour = (pageSlug: string, steps: TourStep[]) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTourPreference = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_tour_preferences')
          .select('*')
          .eq('user_id', user.id)
          .eq('page_slug', pageSlug)
          .maybeSingle();

        if (error) throw error;

        // Se não há preferência ou o tour não foi desabilitado/completado, mostrar
        if (!data || (!data.tour_disabled && !data.tour_completed)) {
          setIsOpen(true);
        }
      } catch (error) {
        console.error('Erro ao verificar preferências do tour:', error);
      } finally {
        setLoading(false);
      }
    };

    checkTourPreference();
  }, [user, pageSlug]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = async () => {
    if (!user) return;

    try {
      await supabase
        .from('user_tour_preferences')
        .upsert({
          user_id: user.id,
          page_slug: pageSlug,
          tour_disabled: true,
          last_shown_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,page_slug'
        });
    } catch (error) {
      console.error('Erro ao salvar preferência do tour:', error);
    }

    setIsOpen(false);
  };

  const completeTour = async () => {
    if (!user) return;

    try {
      await supabase
        .from('user_tour_preferences')
        .upsert({
          user_id: user.id,
          page_slug: pageSlug,
          tour_completed: true,
          last_shown_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,page_slug'
        });
    } catch (error) {
      console.error('Erro ao completar tour:', error);
    }

    setIsOpen(false);
  };

  const restartTour = async () => {
    if (!user) return;

    try {
      await supabase
        .from('user_tour_preferences')
        .upsert({
          user_id: user.id,
          page_slug: pageSlug,
          tour_completed: false,
          tour_disabled: false,
          last_shown_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,page_slug'
        });

      setCurrentStep(0);
      setIsOpen(true);
    } catch (error) {
      console.error('Erro ao reiniciar tour:', error);
    }
  };

  return {
    isOpen,
    currentStep,
    loading,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    restartTour,
    totalSteps: steps.length
  };
};