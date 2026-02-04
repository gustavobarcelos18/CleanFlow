import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TourState {
    hasSeenTour: boolean;
    currentTourId: string | null;
    isRunning: boolean;
    stepIndex: number;

    // Actions
    startTour: (tourId: string) => void;
    endTour: () => void;
    markTourAsSeen: () => void;
    resetTour: () => void;
    setStepIndex: (index: number) => void;
}

export const useTourStore = create<TourState>()(
    persist(
        (set) => ({
            hasSeenTour: false,
            currentTourId: null,
            isRunning: false,
            stepIndex: 0,

            startTour: (tourId: string) => set({
                currentTourId: tourId,
                isRunning: true,
                stepIndex: 0
            }),

            endTour: () => set({
                isRunning: false,
                currentTourId: null,
                stepIndex: 0
            }),

            markTourAsSeen: () => set({ hasSeenTour: true }),

            resetTour: () => set({
                hasSeenTour: false,
                currentTourId: null,
                isRunning: false,
                stepIndex: 0
            }),

            setStepIndex: (index: number) => set({ stepIndex: index }),
        }),
        {
            name: 'cleanflow-tour-storage',
        }
    )
);
