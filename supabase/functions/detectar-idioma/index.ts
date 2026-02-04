import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EdgeLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mapa de DDDs para idiomas
const DDD_IDIOMA_MAP: Record<string, string> = {
  // Internacional - EN
  '1': 'en',  // EUA/Canadá
  '44': 'en', // Reino Unido
  
  // Internacional - ES
  '34': 'es', // Espanha
  '52': 'es', // México
  '54': 'es', // Argentina
  '56': 'es', // Chile
  '57': 'es', // Colômbia
  
  // Brasil - PT (default)
  '55': 'pt',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = new EdgeLogger();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { paciente_id, tenant_id, telefone } = await req.json();

    logger.info('Detectando idioma', 'i18n', { paciente_id });

    // Verificar se já existe preferência
    const { data: existente } = await supabase
      .from('paciente_preferencias_idioma' as any)
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('paciente_id', paciente_id)
      .single();

    if (existente && existente.confirmado_pelo_paciente) {
      return new Response(
        JSON.stringify({ idioma: existente.idioma, metodo: 'confirmado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Detectar por DDD
    let idiomaDetectado = 'pt';
    let metodoDeteccao = 'default';
    
    if (telefone) {
      const ddd = telefone.replace(/\D/g, '').substring(0, 2);
      
      for (const [codigo, idioma] of Object.entries(DDD_IDIOMA_MAP)) {
        if (telefone.startsWith('+' + codigo) || ddd === codigo) {
          idiomaDetectado = idioma;
          metodoDeteccao = 'ddd';
          break;
        }
      }
    }

    // Salvar/atualizar preferência
    const { error: upsertError } = await supabase
      .from('paciente_preferencias_idioma' as any)
      .upsert({
        tenant_id,
        paciente_id,
        idioma: idiomaDetectado,
        metodo_deteccao: metodoDeteccao,
        deteccao_automatica: true
      }, {
        onConflict: 'tenant_id,paciente_id'
      });

    if (upsertError) throw upsertError;

    logger.info('Idioma detectado', 'i18n', { idioma: idiomaDetectado, metodo: metodoDeteccao });

    return new Response(
      JSON.stringify({ idioma: idiomaDetectado, metodo: metodoDeteccao }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Erro ao detectar idioma', 'i18n', { error: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
