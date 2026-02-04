import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OutboxMessage {
  id: string;
  tenant_id: string;
  phone_number_id: string | null;
  to_phone: string;
  template_name: string | null;
  template_params: Record<string, unknown>;
  message_body: string | null;
  message_type: string;
  consent_type: string;
  consent_verified: boolean;
  retries: number;
  metadata: Record<string, unknown>;
}

interface TenantConfig {
  tenant_id: string;
  max_messages_per_minute: number;
  batch_size: number;
}

interface TenantRateState {
  count: number;
  windowStart: number;
}

// In-memory rate limit tracking per tenant
const tenantRateLimits = new Map<string, TenantRateState>();

function checkRateLimit(tenantId: string, maxPerMinute: number): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  
  let state = tenantRateLimits.get(tenantId);
  
  if (!state || (now - state.windowStart) > windowMs) {
    // Start new window
    state = { count: 0, windowStart: now };
    tenantRateLimits.set(tenantId, state);
  }
  
  if (state.count >= maxPerMinute) {
    return false; // Rate limited
  }
  
  state.count++;
  return true;
}

async function sendWhatsAppMessage(
  message: OutboxMessage,
  accessToken: string,
  phoneNumberId: string
): Promise<{ success: boolean; messageId?: string; error?: string; errorCode?: string }> {
  const startTime = Date.now();
  
  try {
    const whatsappUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    
    let messageBody: Record<string, unknown>;
    
    if (message.message_type === 'template' && message.template_name) {
      messageBody = {
        messaging_product: "whatsapp",
        to: message.to_phone,
        type: "template",
        template: {
          name: message.template_name,
          language: { code: "pt_BR" },
          components: message.template_params ? [
            {
              type: "body",
              parameters: Array.isArray(message.template_params) 
                ? message.template_params 
                : Object.values(message.template_params)
            }
          ] : []
        }
      };
    } else {
      messageBody = {
        messaging_product: "whatsapp",
        to: message.to_phone,
        type: "text",
        text: { body: message.message_body || '' }
      };
    }

    const response = await fetch(whatsappUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageBody)
    });

    const result = await response.json();
    const latency = Date.now() - startTime;

    if (!response.ok) {
      return {
        success: false,
        error: result.error?.message || 'WhatsApp API error',
        errorCode: result.error?.code?.toString() || response.status.toString()
      };
    }

    return {
      success: true,
      messageId: result.messages?.[0]?.id
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorCode: 'NETWORK_ERROR'
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  console.log(`[${requestId}] Starting WhatsApp batch processing`);

  try {
    // Parse request body for optional tenant filter
    let tenantFilter: string | null = null;
    let batchSizeOverride: number | null = null;

    if (req.method === 'POST') {
      try {
        const body = await req.json();
        tenantFilter = body.tenant_id || null;
        batchSizeOverride = body.batch_size || null;
      } catch {
        // No body or invalid JSON, use defaults
      }
    }

    const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
    if (!WHATSAPP_ACCESS_TOKEN) {
      throw new Error('WHATSAPP_ACCESS_TOKEN not configured');
    }

    // Get batch of messages to process
    const batchSize = batchSizeOverride || 20;
    const { data: messages, error: fetchError } = await supabase.rpc(
      'get_whatsapp_outbox_batch',
      { 
        p_tenant_id: tenantFilter,
        p_batch_size: batchSize 
      }
    );

    if (fetchError) {
      console.error(`[${requestId}] Error fetching batch:`, fetchError);
      throw fetchError;
    }

    if (!messages || messages.length === 0) {
      console.log(`[${requestId}] No messages to process`);
      return new Response(
        JSON.stringify({ 
          processed: 0, 
          success: 0, 
          failed: 0,
          skipped: 0,
          message: 'No messages in queue' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${requestId}] Processing ${messages.length} messages`);

    // Group messages by tenant for rate limiting
    const messagesByTenant = new Map<string, OutboxMessage[]>();
    for (const msg of messages as OutboxMessage[]) {
      const existing = messagesByTenant.get(msg.tenant_id) || [];
      existing.push(msg);
      messagesByTenant.set(msg.tenant_id, existing);
    }

    // Load tenant configs
    const tenantIds = Array.from(messagesByTenant.keys());
    const { data: configs } = await supabase
      .from('tenant_whatsapp_config')
      .select('tenant_id, max_messages_per_minute, batch_size')
      .in('tenant_id', tenantIds);

    const configMap = new Map<string, TenantConfig>();
    for (const config of (configs || [])) {
      configMap.set(config.tenant_id, config);
    }

    // Load tenant WhatsApp settings
    const { data: tenants } = await supabase
      .from('tenants')
      .select('id, whatsapp_phone_number_id, whatsapp_configurado')
      .in('id', tenantIds);

    const tenantPhoneMap = new Map<string, string>();
    for (const tenant of (tenants || [])) {
      if (tenant.whatsapp_configurado && tenant.whatsapp_phone_number_id) {
        tenantPhoneMap.set(tenant.id, tenant.whatsapp_phone_number_id);
      }
    }

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Process each message
    for (const [tenantId, tenantMessages] of messagesByTenant) {
      const config = configMap.get(tenantId) || { 
        tenant_id: tenantId, 
        max_messages_per_minute: 30,
        batch_size: 10
      };
      
      const phoneNumberId = tenantPhoneMap.get(tenantId);
      
      if (!phoneNumberId) {
        // Skip messages for tenants without WhatsApp configured
        for (const msg of tenantMessages) {
          await supabase.rpc('mark_whatsapp_error', {
            p_outbox_id: msg.id,
            p_error_code: 'NO_WHATSAPP_CONFIG',
            p_error_message: 'WhatsApp não configurado para este tenant'
          });
          skippedCount++;
        }
        continue;
      }

      for (const msg of tenantMessages) {
        // Check consent
        if (!msg.consent_verified && msg.consent_type === 'marketing') {
          await supabase.rpc('mark_whatsapp_error', {
            p_outbox_id: msg.id,
            p_error_code: 'NO_CONSENT',
            p_error_message: 'Consentimento de marketing não verificado'
          });
          skippedCount++;
          continue;
        }

        // Check rate limit
        if (!checkRateLimit(tenantId, config.max_messages_per_minute)) {
          // Requeue for later
          await supabase
            .from('whatsapp_outbox')
            .update({ 
              status: 'queued', 
              updated_at: new Date().toISOString() 
            })
            .eq('id', msg.id);
          skippedCount++;
          console.log(`[${requestId}] Rate limited tenant ${tenantId}, requeued message ${msg.id}`);
          continue;
        }

        // Send message
        const sendResult = await sendWhatsAppMessage(msg, WHATSAPP_ACCESS_TOKEN, phoneNumberId);

        if (sendResult.success) {
          await supabase.rpc('mark_whatsapp_sent', {
            p_outbox_id: msg.id,
            p_external_message_id: sendResult.messageId,
            p_response_data: { messageId: sendResult.messageId },
            p_latency_ms: null
          });

          // Debit credit
          await supabase.rpc('debitar_credito_whatsapp', {
            p_tenant_id: tenantId,
            p_quantidade: 1,
            p_motivo: `Batch send to ${msg.to_phone}`,
            p_metadata: { 
              outbox_id: msg.id,
              message_id: sendResult.messageId 
            }
          });

          successCount++;
          console.log(`[${requestId}] Sent message ${msg.id} to ${msg.to_phone}`);
        } else {
          await supabase.rpc('mark_whatsapp_error', {
            p_outbox_id: msg.id,
            p_error_code: sendResult.errorCode || 'UNKNOWN',
            p_error_message: sendResult.error || 'Unknown error'
          });
          failedCount++;
          console.error(`[${requestId}] Failed to send message ${msg.id}:`, sendResult.error);
        }

        // Small delay between messages to avoid hitting API too fast
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Batch processing complete in ${duration}ms: ${successCount} sent, ${failedCount} failed, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({
        processed: messages.length,
        success: successCount,
        failed: failedCount,
        skipped: skippedCount,
        duration_ms: duration
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${requestId}] Batch processing error:`, errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
