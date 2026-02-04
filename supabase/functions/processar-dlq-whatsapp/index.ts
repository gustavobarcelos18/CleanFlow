import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Backoff exponencial: 1min, 5min, 15min, 1h, 6h
function calculateNextRetry(attemptCount: number): Date {
  const delays = [60, 300, 900, 3600, 21600]; // em segundos
  const delay = delays[Math.min(attemptCount, delays.length - 1)] || 21600;
  return new Date(Date.now() + delay * 1000);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing DLQ messages...');

    // Buscar mensagens pendentes para retry
    const { data: dlqMessages, error: fetchError } = await supabase
      .from('whatsapp_dlq')
      .select('*')
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
      .lt('attempt_count', 5)
      .limit(100);

    if (fetchError) {
      throw fetchError;
    }

    if (!dlqMessages || dlqMessages.length === 0) {
      console.log('No messages to retry');
      return new Response(JSON.stringify({
        success: true,
        message: 'No messages to retry'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${dlqMessages.length} messages to retry`);

    const results = {
      success: 0,
      failed: 0,
      permanent_failures: 0,
    };

    for (const message of dlqMessages) {
      const newAttemptCount = message.attempt_count + 1;

      try {
        // Atualizar status para retrying
        await supabase
          .from('whatsapp_dlq')
          .update({ status: 'retrying', last_attempt_at: new Date().toISOString() })
          .eq('id', message.id);

        // Tentar reenviar a mensagem
        console.log(`Retrying message ${message.id}, attempt ${newAttemptCount}`);

        // Invocar enviar-whatsapp
        // Assumindo que o payload original está em metadata ou message_data
        const payload = message.metadata || {};

        const { data: retryResult, error: retryError } = await supabase.functions.invoke('enviar-whatsapp', {
          body: {
            to: payload.to,
            message: payload.message,
            tipo: payload.tipo || 'text',
            tenant_id: message.tenant_id
          }
        });

        const retrySuccess = !retryError && (retryResult?.success || retryResult?.messageId);

        if (retrySuccess) {
          // Sucesso - marcar como resolvido
          await supabase
            .from('whatsapp_dlq')
            .update({
              status: 'resolved',
              resolved_at: new Date().toISOString()
            })
            .eq('id', message.id);

          results.success++;
          console.log(`Message ${message.id} resolved successfully`);

        } else {
          // Falhou novamente
          if (newAttemptCount >= message.max_attempts) {
            // Falha permanente
            await supabase
              .from('whatsapp_dlq')
              .update({
                status: 'failed',
                is_permanent_failure: true,
                attempt_count: newAttemptCount
              })
              .eq('id', message.id);

            results.permanent_failures++;
            console.log(`Message ${message.id} marked as permanent failure`);

            // Criar incidente para falha permanente
            await supabase
              .from('whatsapp_incidents')
              .insert({
                tenant_id: message.tenant_id,
                severity: 'medium',
                type: 'permanent_message_failure',
                title: `Mensagem ${message.id} falhou permanentemente`,
                description: `Após ${newAttemptCount} tentativas, a mensagem não pôde ser entregue. Erro: ${message.error_message}`,
                affected_messages: 1,
              });

          } else {
            // Agendar próxima tentativa
            const nextRetry = calculateNextRetry(newAttemptCount);
            await supabase
              .from('whatsapp_dlq')
              .update({
                status: 'pending',
                attempt_count: newAttemptCount,
                next_retry_at: nextRetry.toISOString()
              })
              .eq('id', message.id);

            results.failed++;
            console.log(`Message ${message.id} rescheduled for ${nextRetry.toISOString()}`);
          }
        }

      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);

        // Em caso de erro, agendar próxima tentativa
        const nextRetry = calculateNextRetry(newAttemptCount);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await supabase
          .from('whatsapp_dlq')
          .update({
            status: 'pending',
            attempt_count: newAttemptCount,
            next_retry_at: nextRetry.toISOString(),
            error_details: {
              ...(message.error_details || {}),
              last_error: errorMessage
            }
          })
          .eq('id', message.id);

        results.failed++;
      }
    }

    console.log('DLQ processing complete:', results);

    return new Response(JSON.stringify({
      success: true,
      processed: dlqMessages.length,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing DLQ:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
