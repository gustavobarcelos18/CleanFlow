
import { supabase } from "@/integrations/supabase/client";

export interface CommissionConfig {
    professionalId: string;
    percentage: number; // 0 to 100
    fixedValue?: number;
}

export async function calculateCommission(appointmentId: string, value: number) {
    // 1. Get professional from appointment
    const { data: appointment } = await supabase
        .from('agenda')
        .select('profissional_id')
        .eq('id', appointmentId)
        .single();

    if (!appointment?.profissional_id) return 0;

    // 2. Get commission config (mocked for now, needs table)
    // In a real scenario, we would fetch from a 'professional_commissions' table
    // For MVP, we assume a default or metadata in profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('metadata')
        .eq('id', appointment.profissional_id)
        .single();

    const commissionRate = profile?.metadata?.commission_rate || 0; // Default 0%

    const commissionValue = (value * commissionRate) / 100;

    return commissionValue;
}

export async function registerCommission(appointmentId: string, value: number) {
    const commission = await calculateCommission(appointmentId, value);
    if (commission > 0) {
        // Insert into a commissions table (to be created)
        console.log(`Commission calculated: ${commission} for appointment ${appointmentId}`);
        // await supabase.from('commissions').insert({ ... })
    }
}
