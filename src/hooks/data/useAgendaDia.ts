import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface UseAgendaDiaProps {
    date: Date;
    unitId?: string;
    professionalId?: string;
    tenantId?: string;
}

export function useAgendaDia({ date, unitId, professionalId, tenantId }: UseAgendaDiaProps) {
    return useQuery({
        queryKey: ["agenda", "dia", format(date, "yyyy-MM-dd"), unitId, professionalId, tenantId],
        queryFn: async () => {
            let query = supabase
                .from("agenda")
                .select(`
          *,
          pacientes (
            nome,
            telefone
          ),
          profiles (
            nome
          ),
          servicos (
            nome,
            duracao_minutos,
            cor
          )
        `)
                .gte("inicio", `${format(date, "yyyy-MM-dd")}T00:00:00`)
                .lte("inicio", `${format(date, "yyyy-MM-dd")}T23:59:59`)
                .order("inicio", { ascending: true });

            if (tenantId) {
                query = query.eq("tenant_id", tenantId);
            }

            if (unitId) {
                query = query.eq("unit_id", unitId);
            }

            if (professionalId) {
                query = query.eq("profissional_id", professionalId);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            return data;
        },
        enabled: !!date,
    });
}
