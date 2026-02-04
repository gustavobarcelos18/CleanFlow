import React, { useEffect } from 'react';
import Joyride, { CallBackProps, STATUS, Step, Styles } from 'react-joyride';
import { useTourStore } from '@/stores/useTourStore';
import { useTheme } from '@/components/theme/ThemeProvider';

interface GuidedTourProps {
    steps: Step[];
    tourId: string;
    run?: boolean;
    continuous?: boolean;
    showProgress?: boolean;
    showSkipButton?: boolean;
}

export function GuidedTour({
    steps,
    tourId,
    run = false,
    continuous = true,
    showProgress = true,
    showSkipButton = true
}: GuidedTourProps) {
    const { theme } = useTheme();
    const { isRunning, currentTourId, stepIndex, endTour, markTourAsSeen, setStepIndex } = useTourStore();

    const shouldRun = run || (isRunning && currentTourId === tourId);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, index, type } = data;

        if (type === 'step:after') {
            setStepIndex(index + 1);
        }

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
            endTour();
            markTourAsSeen();
        }
    };

    // Estilos personalizados baseados no tema
    const styles: Styles = {
        options: {
            primaryColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
            backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            textColor: theme === 'dark' ? '#f9fafb' : '#111827',
            overlayColor: 'rgba(0, 0, 0, 0.5)',
            arrowColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            zIndex: 10000,
        },
        tooltip: {
            borderRadius: 8,
            padding: 20,
        },
        tooltipContainer: {
            textAlign: 'left',
        },
        tooltipTitle: {
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem',
        },
        tooltipContent: {
            fontSize: '0.95rem',
            lineHeight: '1.6',
        },
        buttonNext: {
            backgroundColor: theme === 'dark' ? '#3b82f6' : '#2563eb',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: '0.9rem',
        },
        buttonBack: {
            marginRight: 10,
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        },
        buttonSkip: {
            color: theme === 'dark' ? '#9ca3af' : '#6b7280',
        },
    };

    const locale = {
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar',
        next: 'Próximo',
        skip: 'Pular tour',
    };

    return (
        <Joyride
            steps={steps}
            run={shouldRun}
            continuous={continuous}
            showProgress={showProgress}
            showSkipButton={showSkipButton}
            stepIndex={stepIndex}
            callback={handleJoyrideCallback}
            styles={styles}
            locale={locale}
            disableOverlayClose
            disableCloseOnEsc={false}
            spotlightClicks={true}
            scrollToFirstStep
            scrollOffset={100}
            hideCloseButton={false}
            disableScrolling={false}
        />
    );
}
