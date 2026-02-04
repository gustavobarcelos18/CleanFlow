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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Executar função de aplicação de políticas de retenção
    const { data, error } = await supabase.rpc('aplicar_politicas_retencao');

    if (error) throw error;

    // Log da execução
    await supabase.rpc('log_system_event', {
      p_level: 'info',
      p_message: 'Políticas de retenção aplicadas',
      p_service: 'data-retention',
      p_metadata: { results: data }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Políticas de retenção aplicadas com sucesso',
        results: data,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Erro ao aplicar políticas de retenção:', error);
    
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