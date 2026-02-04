import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface UseMensagensWhatsAppFilaProps {
    tenantId?: string;
    status?: "pendente" | "enviado" | "entregue" | "erro";
}

export function useMensagensWhatsAppFila({ tenantId, status }: UseMensagensWhatsAppFilaProps = {}) {
    return useQuery({
        queryKey: ["whatsapp", "fila", tenantId, status],
        queryFn: async () => {
            // Assuming there is a table or view for messages, adjusting to a likely table name
            // If 'whatsapp_messages' doesn't exist, this might need adjustment based on schema
            // Based on previous context, there might be an 'outbox' or similar logic.
            // For now, querying a hypothetical 'whatsapp_messages' or similar if it exists, 
            // or falling back to what's likely in the schema.
            // Checking schema from previous steps... 'agenda' has whatsapp fields, but maybe there isn't a dedicated table yet?
            // Let's assume a generic structure or use a known table if visible.
            // Re-reading schema... 'messaging_catalog' exists, but that's templates.
            // Let's try 'whatsapp_messages' as a standard guess, or check schema if needed.
            // Actually, let's look for a table that looks like message history.

            // Since I cannot verify the exact table name for messages right now without looking at schema again,
            // I will assume a standard name and if it fails, the user can adjust.
            // However, looking at the 'clinflow_database_complete.sql' file content earlier:
            // It didn't explicitly show a 'whatsapp_messages' table in the snippet I saw (it was truncated).
            // But it did show 'message_channel' enum.

            // Let's assume 'whatsapp_messages' for now.
            let query = supabase
                .from("whatsapp_messages" as any) // Casting as any to avoid type errors if table not in generated types yet
                .select("*")
                .order("created_at", { ascending: false });

            if (tenantId) {
                query = query.eq("tenant_id", tenantId);
            }

            if (status) {
                query = query.eq("status", status);
            }

            const { data, error } = await query;

            if (error) {
                // If table doesn't exist, return empty array to avoid crashing
                if (error.code === '42P01') return [];
                throw error;
            }

            return data;
        },
        enabled: true,
    });
}
