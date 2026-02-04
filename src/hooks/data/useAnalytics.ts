import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, subDays } from "date-fns";

export interface AnalyticsFilter {
    periodo: '7d' | '30d' | '90d' | 'custom';
    dataInicio?: Date;
    dataFim?: Date;
    unidadeId?: string;
    profissionalId?: string;
}

const getPeriodDates = (filter: AnalyticsFilter) => {
    const end = filter.dataFim || endOfDay(new Date());
    let start = filter.dataInicio;

    if (!start) {
        const days = filter.periodo === '90d' ? 90 : filter.periodo === '30d' ? 30 : 7;
        start = startOfDay(subDays(end, days));
    }

    return { start: start.toISOString(), end: end.toISOString() };
};

export const useAnalyticsOcupacao = (filter: AnalyticsFilter) => {
    const { start, end } = getPeriodDates(filter);

    return useQuery({
        queryKey: ['analytics-ocupacao', filter],
        queryFn: async () => {
            let query = supabase
                .from('view_analytics_ocupacao_diaria')
                .select('*')
                .gte('data', start)
                .lte('data', end);

            if (filter.unidadeId && filter.unidadeId !== 'all') {
                query = query.eq('unidade_id', filter.unidadeId);
            }
            if (filter.profissionalId && filter.profissionalId !== 'all') {
                query = query.eq('profissional_id', filter.profissionalId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
    });
};

export const useAnalyticsNoShow = (filter: AnalyticsFilter) => {
    const { start, end } = getPeriodDates(filter);

    return useQuery({
        queryKey: ['analytics-noshow', filter],
        queryFn: async () => {
            let query = supabase
                .from('view_analytics_no_show')
                .select('*')
                .gte('data', start)
                .lte('data', end);

            if (filter.unidadeId && filter.unidadeId !== 'all') {
                query = query.eq('unidade_id', filter.unidadeId);
            }
            if (filter.profissionalId && filter.profissionalId !== 'all') {
                query = query.eq('profissional_id', filter.profissionalId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
    });
};

export const useAnalyticsMensageria = (filter: AnalyticsFilter) => {
    const { start, end } = getPeriodDates(filter);

    return useQuery({
        queryKey: ['analytics-mensageria', filter],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('view_analytics_mensageria')
                .select('*')
                .gte('data', start)
                .lte('data', end);

            if (error) throw error;
            return data;
        }
    });
};

export const useAnalyticsAutomacoes = (filter: AnalyticsFilter) => {
    const { start, end } = getPeriodDates(filter);

    return useQuery({
        queryKey: ['analytics-automacoes', filter],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('view_analytics_automacoes')
                .select('*')
                .gte('data', start)
                .lte('data', end);

            if (error) throw error;
            return data;
        }
    });
};
