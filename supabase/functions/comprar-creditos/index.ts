import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { EdgeLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw userError;

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', userData.user.id)
      .single();

    if (!profile?.tenant_id) throw new Error('Tenant não encontrado');

    const { package_id } = await req.json();

    logger.info('Iniciando compra de créditos', 'credits', {
      tenant_id: profile.tenant_id,
      package_id,
      user_id: userData.user.id
    });

    // Verificar se o pacote existe
    const { data: creditPackage } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('id', package_id)
      .eq('ativo', true)
      .single();

    if (!creditPackage) {
      return new Response(
        JSON.stringify({ erro: 'Pacote não encontrado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Aqui você integraria com sistema de pagamento (Stripe, PagSeguro, etc)
    // Por enquanto, vamos simular aprovação imediata para demonstração
    
    // Creditar os créditos
    const { data: creditResult, error: creditError } = await supabase.rpc('creditar_whatsapp', {
      p_tenant_id: profile.tenant_id,
      p_package_id: package_id,
      p_created_by: userData.user.id
    });

    if (creditError) {
      logger.error('Erro ao creditar', 'credits', { error: creditError });
      throw creditError;
    }

    // Log de auditoria
    await supabase.from('auditoria_admin').insert({
      usuario_id: userData.user.id,
      tipo_evento: 'compra_creditos',
      descricao: `Compra de ${creditPackage.quantidade_creditos} créditos - ${creditPackage.nome}`,
      metadata: {
        package_id,
        valor: creditPackage.preco_venda,
        transaction_id: creditResult.transaction_id
      }
    });

    logger.info('Créditos comprados com sucesso', 'credits', {
      transaction_id: creditResult.transaction_id,
      saldo_novo: creditResult.saldo_novo
    });

    return new Response(
      JSON.stringify({
        sucesso: true,
        saldo_novo: creditResult.saldo_novo,
        creditos_adicionados: creditResult.creditos_adicionados,
        transaction_id: creditResult.transaction_id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Erro na compra de créditos', 'credits', { error: errorMessage });
    return new Response(
      JSON.stringify({ erro: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});