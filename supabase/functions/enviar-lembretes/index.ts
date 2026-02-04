import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Iniciando envio de lembretes');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar lembretes pendentes que devem ser enviados agora
    const { data: lembretes, error: lembretesError } = await supabase
      .from('lembretes_agendados')
      .select('*')
      .eq('status', 'pendente')
      .lte('agendado_para', new Date().toISOString())
      .lt('tentativas', 3);

    if (lembretesError) throw lembretesError;

    console.log(`Encontrados ${lembretes?.length || 0} lembretes para enviar`);

    let lembretesEnviados = 0;
    let lembretesFalhados = 0;

    for (const lembrete of lembretes || []) {
      try {
        // Aqui integraria com serviços de envio (email/SMS/WhatsApp)
        // Por enquanto, simula envio bem-sucedido
        
        await supabase
          .from('lembretes_agendados')
          .update({
            status: 'enviado',
            enviado_em: new Date().toISOString()
          })
          .eq('id', lembrete.id);

        // Registrar no log de mensagens
        await supabase.from('log_mensagens').insert({
          tenant_id: lembrete.tenant_id,
          destinatario: lembrete.destinatario,
          canal: lembrete.canal,
          template_usado: lembrete.tipo,
          status: 'enviado'
        });

        lembretesEnviados++;
      } catch (error) {
        // Atualizar tentativas e erro
        await supabase
          .from('lembretes_agendados')
          .update({
            status: 'falha',
            erro_mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
            tentativas: lembrete.tentativas + 1
          })
          .eq('id', lembrete.id);

        lembretesFalhados++;
      }
    }

    console.log(`Enviados: ${lembretesEnviados}, Falhas: ${lembretesFalhados}`);

    return new Response(
      JSON.stringify({
        success: true,
        lembretes_enviados: lembretesEnviados,
        lembretes_falhados: lembretesFalhados
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
