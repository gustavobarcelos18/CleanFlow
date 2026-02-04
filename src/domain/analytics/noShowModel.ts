import { differenceInDays, getHours } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

export interface NoShowInput {
    paciente_id: string;
    data_agendamento: Date;
    data_criacao?: Date;
    origem: string;
    servico_preco?: number;
}

export interface NoShowResult {
    score: number; // 0 a 100
    level: 'baixo' | 'medio' | 'alto';
    factors: string[];
}

export const noShowModel = {
    async calcularScore(input: NoShowInput): Promise<NoShowResult> {
        let score = 0;
        const factors: string[] = [];

        // 1. Histórico do Paciente (Peso Alto)
        // Busca estatísticas de no-show do paciente
        const { count: totalAppointments } = await supabase
            .from('agenda')
            .select('*', { count: 'exact', head: true })
            .eq('paciente_id', input.paciente_id);

        const { count: noShows } = await supabase
            .from('agenda')
            .select('*', { count: 'exact', head: true })
            .eq('paciente_id', input.paciente_id)
            .eq('status', 'nao_compareceu'); // Assumindo status 'nao_compareceu' ou similar

        const total = totalAppointments || 0;
        const missed = noShows || 0;

        if (total > 0) {
            const rate = missed / total;
            if (rate > 0.5) {
                score += 50;
                factors.push('Histórico de faltas alto (>50%)');
            } else if (rate > 0.2) {
                score += 30;
                factors.push('Histórico de faltas moderado (>20%)');
            } else if (rate > 0) {
                score += 10;
                factors.push('Já faltou anteriormente');
            } else {
                // Bonificação por bom histórico
                score -= 10;
                factors.push('Bom histórico de presença');
            }
        } else {
            // Paciente novo: risco levemente maior por desconhecimento
            score += 10;
            factors.push('Paciente novo');
        }

        // 2. Antecedência (Lead Time)
        // Agendamentos feitos com muita antecedência tendem a ser esquecidos
        const created = input.data_criacao || new Date();
        const daysInAdvance = differenceInDays(input.data_agendamento, created);

        if (daysInAdvance > 20) {
            score += 20;
            factors.push('Agendado com muita antecedência (>20 dias)');
        } else if (daysInAdvance > 7) {
            score += 10;
            factors.push('Agendado com antecedência (>7 dias)');
        } else if (daysInAdvance === 0) {
            // Agendamento no mesmo dia: risco menor (impulso/urgência)
            score -= 5;
            factors.push('Agendamento de última hora');
        }

        // 3. Horário do Agendamento
        // Extremos do dia podem ter mais faltas
        const hour = getHours(input.data_agendamento);
        if (hour < 9 || hour > 18) {
            score += 5;
            factors.push('Horário alternativo (cedo/tarde)');
        }

        // 4. Origem
        if (input.origem === 'agendamento_publico') {
            score += 10; // Auto-agendamento pode ter menos compromisso
            factors.push('Auto-agendamento online');
        }

        // Normalização (0 a 100)
        score = Math.max(0, Math.min(100, score));

        // Classificação
        let level: 'baixo' | 'medio' | 'alto' = 'baixo';
        if (score >= 70) level = 'alto';
        else if (score >= 40) level = 'medio';

        return { score, level, factors };
    }
};
