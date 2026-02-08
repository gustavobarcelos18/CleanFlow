import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Patient {
    id: string;
    nome: string;
    telefone: string;
    email: string | null;
    preferencia_contato: "whatsapp" | "sms" | "email";
    historico_faltas: number;
    risco_no_show: number;
    created_at: string;
}

interface UsePatientsProps {
    searchTerm?: string;
    page?: number;
    pageSize?: number;
}

export const usePatients = ({
    searchTerm = "",
    page = 1,
    pageSize = 10
}: UsePatientsProps = {}) => {
    return useQuery({
        queryKey: ["patients", searchTerm, page, pageSize],
        queryFn: async () => {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from("pacientes")
                .select(`
          id,
          nome,
          telefone,
          email,
          preferencia_contato,
          historico_faltas,
          risco_no_show,
          created_at
        `, { count: "exact" })
                .order("nome");

            if (searchTerm) {
                query = query.or(`nome.ilike.%${searchTerm}%,telefone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
            }

            const { data, error, count } = await query.range(from, to);

            if (error) throw error;

            return {
                data: (data as unknown[]) as Patient[],
                totalCount: count || 0,
            };
        },
    });
};
