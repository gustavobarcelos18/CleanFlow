
import { create } from 'zustand';
import { supabase } from "@/integrations/supabase/client";

export interface SegmentConfig {
    id: string;
    name: string;
    terminology: {
        client_label: string;
        file_label: string;
        service_label: string;
        asset_label?: string;
    };
    features: string[];
    theme: {
        primaryColor: string;
        icon: string;
    };
}

interface SegmentStore {
    currentSegment: SegmentConfig | null;
    isLoading: boolean;
    fetchSegment: (segmentId: string) => Promise<void>;
    setSegment: (segment: SegmentConfig) => void;
}

// Default fallback (Health)
const defaultSegment: SegmentConfig = {
    id: 'saude',
    name: 'Saúde',
    terminology: {
        client_label: 'Paciente',
        file_label: 'Prontuário',
        service_label: 'Procedimento'
    },
    features: ['anamnese', 'prescricao'],
    theme: {
        primaryColor: '#016CA5',
        icon: 'Stethoscope'
    }
};

export const useSegmentStore = create<SegmentStore>((set) => ({
    currentSegment: defaultSegment,
    isLoading: false,
    fetchSegment: async (segmentId: string) => {
        set({ isLoading: true });
        try {
            const { data, error } = await supabase
                .from('segment_configs')
                .select('*')
                .eq('id', segmentId)
                .single();

            if (data) {
                set({ currentSegment: data });
            } else {
                console.warn(`Segment ${segmentId} not found, using default.`);
                set({ currentSegment: defaultSegment });
            }
        } catch (error) {
            console.error("Error fetching segment:", error);
        } finally {
            set({ isLoading: false });
        }
    },
    setSegment: (segment) => set({ currentSegment: segment })
}));

// Hook helper for terminology
export const useTerminology = () => {
    const segment = useSegmentStore(state => state.currentSegment);
    return segment?.terminology || defaultSegment.terminology;
};
