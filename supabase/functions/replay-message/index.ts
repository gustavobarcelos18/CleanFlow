import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { EdgeLogger } from '../_shared/logger.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const logger = new EdgeLogger();
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar autenticação e permissão master
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autenticado');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Verificar se é master
    const { data: supportUser } = await supabase
      .from('usuarios_suporte')
      .select('funcoes')
      .eq('auth_user_id', user.id)
      .single();

    if (!supportUser || !supportUser.funcoes?.includes('master')) {
      throw new Error('Acesso negado. Apenas usuários master podem replay mensagens.');
    }

    const { message_id } = await req.json();

    if (!message_id) {
      throw new Error('message_id é obrigatório');
    }

    // Buscar auditoria da mensagem
    const { data: audit, error: auditError } = await supabase
      .from('message_audit')
      .select(`
        *,
        log_mensagens(*)
      `)
      .eq('message_id', message_id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (auditError || !audit) {
      throw new Error('Mensagem não encontrada na auditoria');
    }

    await logger.info(
      'Message replay requested',
      'replay',
      {
        message_id,
        requested_by: user.id,
        original_timestamp: audit.timestamp
      }
    );

    // Registrar acesso ao replay
    await supabase.rpc('log_admin_auth_event', {
      p_usuario_id: user.id,
      p_tipo_evento: 'message_replay',
      p_descricao: `Replay de mensagem ${message_id}`,
      p_metadata: { message_id, audit_id: audit.id }
    });

    return new Response(
      JSON.stringify({
        success: true,
        audit,
        message: 'Replay recuperado com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    await logger.error(
      error instanceof Error ? error.message : 'Erro desconhecido',
      'replay',
      { error }
    );

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
