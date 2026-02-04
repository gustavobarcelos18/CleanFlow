import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return new Response(
        JSON.stringify({ error: 'userId e email são obrigatórios' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Gerar código 2FA
    const { data: code, error: codeError } = await supabase.rpc('generate_2fa_code', {
      p_user_id: userId
    });

    if (codeError) throw codeError;

    // TODO: Aqui você integraria com um serviço de email real (SendGrid, AWS SES, etc)
    // Por enquanto, vamos apenas logar o código para desenvolvimento
    console.log(`Código 2FA para ${email}: ${code}`);

    // Log do evento
    await supabase.rpc('log_system_event', {
      p_level: 'info',
      p_message: 'Código 2FA gerado e enviado',
      p_service: '2fa',
      p_user_id: userId,
      p_metadata: { email, code_sent: true }
    });

    // Em produção, NUNCA retorne o código na resposta!
    // Ele deve ser enviado apenas por email/SMS
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código enviado para seu email',
        // APENAS PARA DESENVOLVIMENTO - REMOVA EM PRODUÇÃO
        debug_code: code
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Erro ao enviar código 2FA:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});