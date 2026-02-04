import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface UseFinanceiroCaixaDiaProps {
    date: Date;
    tenantId?: string;
    unitId?: string;
}

export function useFinanceiroCaixaDia({ date, tenantId, unitId }: UseFinanceiroCaixaDiaProps) {
    return useQuery({
        queryKey: ["financeiro", "caixa", format(date, "yyyy-MM-dd"), tenantId, unitId],
        queryFn: async () => {
            // Assuming 'transacoes' or similar table exists for financial records
            // If not, we might need to aggregate from 'agenda' (valor_consulta)

            let query = supabase
                .from("agenda") // Using agenda as a proxy for daily income for now if no transaction table
                .select("valor_consulta, forma_pagamento_id, status")
                .eq("status", "concluido") // Only completed appointments count as income usually
                .gte("inicio", `${format(date, "yyyy-MM-dd")}T00:00:00`)
                .lte("inicio", `${format(date, "yyyy-MM-dd")}T23:59:59`);

            if (tenantId) {
                query = query.eq("tenant_id", tenantId);
            }

            if (unitId) {
                query = query.eq("unit_id", unitId);
            }

            const { data, error } = await query;

            if (error) {
                throw error;
            }

            // Calculate total
            const total = data?.reduce((acc, curr) => acc + (Number(curr.valor_consulta) || 0), 0) || 0;

            return {
                transactions: data,
                total,
            };
        },
        enabled: !!date,
    });
}
