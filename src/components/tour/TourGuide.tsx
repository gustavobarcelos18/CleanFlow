import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { TourStep } from '@/hooks/useTour';

interface TourGuideProps {
  isOpen: boolean;
  currentStep: number;
  steps: TourStep[];
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  totalSteps: number;
}

export const TourGuide: React.FC<TourGuideProps> = ({
  isOpen,
  currentStep,
  steps,
  onNext,
  onPrev,
  onSkip,
  totalSteps
}) => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isOpen || !steps[currentStep]) return;

    const updatePosition = () => {
      const target = document.querySelector(steps[currentStep].target);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const placement = steps[currentStep].placement || 'bottom';

      let top = 0;
      let left = 0;

      switch (placement) {
        case 'top':
          top = rect.top - 20;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 20;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 20;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 20;
          break;
      }

      setPosition({ top, left });

      // Scroll suave até o elemento
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen, currentStep, steps]);

  if (!isOpen || !steps[currentStep] || !position) return null;

  const step = steps[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]" />

      {/* Spotlight effect */}
      {steps[currentStep].target && (
        <div 
          className="fixed z-[101] pointer-events-none"
          style={{
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
            ...(() => {
              const target = document.querySelector(steps[currentStep].target);
              if (!target) return {};
              const rect = target.getBoundingClientRect();
              return {
                top: rect.top - 4,
                left: rect.left - 4,
                width: rect.width + 8,
                height: rect.height + 8,
                borderRadius: '8px',
              };
            })()
          }}
        />
      )}

      {/* Tour Card */}
      <Card
        className="fixed z-[102] w-96 p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4"
        style={{
          top: position.top,
          left: position.left,
          transform: 'translate(-50%, 0)',
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              Passo {currentStep + 1} de {totalSteps}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSkip}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-foreground mb-6">
          {step.content}
        </p>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onSkip}
            className="text-xs"
          >
            Pular tour
          </Button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onPrev}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
            <Button
              size="sm"
              onClick={onNext}
              className="bg-gradient-primary"
            >
              {isLastStep ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Concluir
                </>
              ) : (
                <>
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1 mt-4">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === currentStep
                  ? 'w-6 bg-primary'
                  : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>
      </Card>
    </>
  );
};