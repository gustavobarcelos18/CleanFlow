import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Professional {
    id: string;
    nome: string;
    email: string | null;
    telefone: string | null;
    cpf: string | null;
    conselho_profissional: string | null;
    numero_registro: string | null;
    uf_registro: string | null;
    role: string;
    especialidade_id: string | null;
    especialidades?: {
        nome: string;
    };
    created_at: string;
}

interface UseProfessionalsProps {
    searchTerm?: string;
    page?: number;
    pageSize?: number;
}

export const useProfessionals = ({
    searchTerm = "",
    page = 1,
    pageSize = 10
}: UseProfessionalsProps = {}) => {
    return useQuery({
        queryKey: ["professionals", searchTerm, page, pageSize],
        queryFn: async () => {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            let query = supabase
                .from("profiles")
                .select(`
          id,
          nome,
          email,
          telefone,
          cpf,
          conselho_profissional,
          numero_registro,
          uf_registro,
          role,
          especialidade_id,
          created_at,
          especialidades:especialidade_id(nome)
        `, { count: "exact" })
                .eq("role", "profissional")
                .order("nome");

            if (searchTerm) {
                query = query.or(`nome.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,numero_registro.ilike.%${searchTerm}%`);
            }

            const { data, error, count } = await query.range(from, to);

            if (error) throw error;

            return {
                data: (data as unknown) as Professional[],
                totalCount: count || 0,
            };
        },
    });
};
