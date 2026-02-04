
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

        if (userError || !user) throw new Error('Unauthorized');

        // Get requester's profile to find tenant_id
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('tenant_id, role')
            .eq('id', user.id)
            .single();

        if (!profile || !['admin', 'manager'].includes(profile.role)) {
            throw new Error('Permission denied');
        }

        const { email, role } = await req.json();

        // 1. Invite user via Supabase Auth (sends email)
        const { data: authData, error: authError } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
            data: {
                tenant_id: profile.tenant_id,
                role: role,
                invited_by: user.id
            }
        });

        if (authError) throw authError;

        // 2. Insert into team_invitations
        const { error: inviteError } = await supabaseClient
            .from('team_invitations')
            .insert({
                email,
                role,
                tenant_id: profile.tenant_id,
                invited_by: user.id,
                status: 'pending'
            });

        if (inviteError) throw inviteError;

        return new Response(
            JSON.stringify({ message: 'Invitation sent successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
