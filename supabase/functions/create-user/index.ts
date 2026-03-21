// @ts-expect-error - Deno specific module
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-expect-error - Deno specific module
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_DEV_ORIGINS = ['http://localhost:8081', 'http://localhost:8080'];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  // @ts-expect-error - Deno global
  const allowedOriginsEnv = Deno.env.get('ALLOWED_ORIGINS') ?? '';
  const allowedOrigins = allowedOriginsEnv.split(',').map((o: string) => o.trim()).filter(Boolean);
  const isAllowed = ALLOWED_DEV_ORIGINS.includes(origin) || allowedOrigins.includes(origin);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };

  if (isAllowed) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else {
    const productionOrigin = allowedOrigins[0] ?? '*';
    headers['Access-Control-Allow-Origin'] = productionOrigin;
  }

  return headers;
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const callerToken = authHeader.replace('Bearer ', '').trim();

    if (!callerToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized: missing token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // @ts-expect-error - Deno global
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    // @ts-expect-error - Deno global
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    // @ts-expect-error - Deno global
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

    // Verify caller JWT
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${callerToken}` } },
    });
    const { data: { user: callerUser }, error: authError } = await callerClient.auth.getUser();
    if (authError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized: invalid token' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Use admin client for all privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Derive tenant_id from caller's profile (server-side truth)
    const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id')
      .eq('id', callerUser.id)
      .maybeSingle();

    if (callerProfileError || !callerProfile?.tenant_id) {
      return new Response(JSON.stringify({ error: 'Caller profile or tenant not found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    const tenantId = callerProfile.tenant_id;

    // Parse request body
    const { email, password, userData } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    let userId: string;

    // Try to create user in auth
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: userData,
    });

    if (createError) {
      // Idempotency: if user already exists, retrieve their ID
      if (
        createError.message?.includes('already been registered') ||
        createError.message?.includes('already registered') ||
        createError.message?.includes('already exists')
      ) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = listData?.users?.find((u: { email?: string }) => u.email === email);
        if (!existingUser) {
          return new Response(JSON.stringify({ error: 'User exists in auth but could not be retrieved' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409,
          });
        }
        userId = existingUser.id;
      } else {
        return new Response(JSON.stringify({ error: createError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }
    } else {
      userId = createData.user.id;
    }

    // Build profile data with all fields from userData
    const profileData: Record<string, unknown> = {
      id: userId,
      tenant_id: tenantId,
      nome: userData?.nome ?? email,
      email: email,
      telefone: userData?.telefone ?? null,
      role: 'profissional',
      updated_at: new Date().toISOString(),
    };

    // Include optional fields if provided
    if (userData?.tipo_profissional_id) {
      profileData.tipo_profissional_id = userData.tipo_profissional_id;
    }
    if (userData?.data_nascimento) {
      profileData.data_nascimento = userData.data_nascimento;
    }

    // UPSERT profile — critical step that prevents FK violation on profissional_especialidades
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (profileError) {
      return new Response(JSON.stringify({ error: `Profile upsert failed: ${profileError.message}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ user: { id: userId } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
