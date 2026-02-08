import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SupportTicket {
    id: string;
    titulo: string;
    descricao: string;
    categoria: string;
    prioridade: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface UseSupportTicketsProps {
    tenantId?: string;
    page?: number;
    pageSize?: number;
}

export const useSupportTickets = ({
    tenantId,
    page = 1,
    pageSize = 10
}: UseSupportTicketsProps = {}) => {
    return useQuery({
        queryKey: ["support_tickets", tenantId, page, pageSize],
        enabled: !!tenantId,
        queryFn: async () => {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, error, count } = await (supabase
                .from("support_tickets" as any)
                .select(`
          id,
          titulo,
          descricao,
          categoria,
          prioridade,
          status,
          created_at,
          updated_at
        `, { count: "exact" })
                .eq("tenant_id", tenantId)
                .order("created_at", { ascending: false })
                .range(from, to) as any);

            if (error) throw error;

            return {
                data: (data as unknown[]) as SupportTicket[],
                totalCount: count || 0,
            };
        },
    });
};
