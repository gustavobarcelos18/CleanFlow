import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const { action, professional_id, tenant_id, user_id } = await req.json();

        if (action === 'export_backup') {
            // 1. Fetch Professional Data
            const { data: professional, error: profError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', professional_id)
                .eq('tenant_id', tenant_id)
                .single();

            if (profError) throw profError;

            // 2. Fetch Related Data (Example: Agenda, OS, etc.)
            const { data: agenda } = await supabase
                .from('agenda')
                .select('*')
                .eq('profissional_id', professional_id)
                .eq('tenant_id', tenant_id);

            // 3. Construct Payload
            const payload = {
                professional,
                agenda: agenda || [],
                version: 'v1',
                exported_at: new Date().toISOString(),
                exported_by: user_id
            };

            const payloadJson = JSON.stringify(payload);

            // 4. Calculate Hash (Integrity)
            const msgUint8 = new TextEncoder().encode(payloadJson + tenant_id);
            const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // 5. Log Audit
            await supabase.from('system_logs').insert({
                level: 'info',
                message: `Backup CSV exportado para profissional ${professional.nome}`,
                service: 'backup',
                user_id: user_id,
                tenant_id: tenant_id,
                metadata: { professional_id, hash: hashHex }
            });

            // 6. Return CSV Content
            // Format: entity,payload_json,hash_integridade,version
            const csvContent = `entity,payload_json,hash_integridade,version\nprofessional,${JSON.stringify(payloadJson).replace(/"/g, '""')},${hashHex},v1`;

            return new Response(
                JSON.stringify({ csv: csvContent, filename: `backup_profissional_${professional.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv` }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (action === 'import_backup') {
            // Logic for import will be handled here or in a separate block
            // For now, let's focus on export as requested in step 2
            return new Response(JSON.stringify({ error: 'Not implemented yet' }), { status: 501, headers: corsHeaders });
        }

        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
