import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ error: 'Missing or invalid API Key' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const apiKey = authHeader.split(' ')[1];

        // Hash the incoming key to compare with stored hash
        // Assuming key format: sk_live_RANDOMSTRING
        // We store hash of the full key
        const encoder = new TextEncoder();
        const data = encoder.encode(apiKey);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Initialize Supabase Admin Client (to bypass RLS for auth check)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Validate Key
        const { data: keyData, error: keyError } = await supabaseAdmin
            .from('api_keys')
            .select('tenant_id, ativo')
            .eq('chave_hash', hashHex)
            .single();

        if (keyError || !keyData || !keyData.ativo) {
            return new Response(JSON.stringify({ error: 'Invalid or inactive API Key' }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const tenantId = keyData.tenant_id;
        const url = new URL(req.url);
        const path = url.pathname.replace('/api-gateway', ''); // Remove function name prefix if needed

        // Update last_used_at (async, fire and forget)
        supabaseAdmin.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('chave_hash', hashHex).then();

        // Route handling
        if (req.method === 'GET' && path.endsWith('/appointments')) {
            return await handleGetAppointments(supabaseAdmin, tenantId, url.searchParams);
        }

        if (req.method === 'POST' && path.endsWith('/appointments')) {
            const body = await req.json();
            return await handleCreateAppointment(supabaseAdmin, tenantId, body);
        }

        if (req.method === 'GET' && path.endsWith('/customers')) {
            return await handleGetCustomers(supabaseAdmin, tenantId, url.searchParams);
        }

        return new Response(JSON.stringify({ error: 'Not Found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});

async function handleGetAppointments(supabase: any, tenantId: string, params: URLSearchParams) {
    const page = parseInt(params.get('page') || '1');
    const limit = Math.min(parseInt(params.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
        .from('agenda')
        .select('*, pacientes(nome, telefone), profiles(nome)', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .range(offset, offset + limit - 1)
        .order('inicio', { ascending: false });

    if (error) throw error;

    return new Response(JSON.stringify({ data, meta: { page, limit, total: count } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleGetCustomers(supabase: any, tenantId: string, params: URLSearchParams) {
    const page = parseInt(params.get('page') || '1');
    const limit = Math.min(parseInt(params.get('limit') || '20'), 100);
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
        .from('pacientes')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)
        .range(offset, offset + limit - 1)
        .order('nome');

    if (error) throw error;

    return new Response(JSON.stringify({ data, meta: { page, limit, total: count } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}

async function handleCreateAppointment(supabase: any, tenantId: string, body: any) {
    // Basic validation
    if (!body.paciente_id || !body.profissional_id || !body.inicio || !body.servico_id) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Ensure tenant isolation
    // Check if patient belongs to tenant
    const { data: patient } = await supabase.from('pacientes').select('id').eq('id', body.paciente_id).eq('tenant_id', tenantId).single();
    if (!patient) return new Response(JSON.stringify({ error: 'Invalid patient' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data, error } = await supabase
        .from('agenda')
        .insert({
            ...body,
            tenant_id: tenantId,
            origem: 'api',
            status: 'agendado'
        })
        .select()
        .single();

    if (error) throw error;

    return new Response(JSON.stringify({ data }), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
}
