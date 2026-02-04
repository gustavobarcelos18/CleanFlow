import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { crypto } from "https://deno.land/std@0.177.0/crypto/mod.ts";

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
    // This function is triggered by Database Webhooks or Cron
    // It processes the webhook_outbox table

    try {
        // 1. Fetch pending webhooks (limit 50 to avoid timeout)
        const { data: events, error } = await supabase
            .from('webhook_outbox')
            .select('*, webhook_subscriptions(url, segredo)')
            .eq('status', 'pending')
            .lt('next_attempt_at', new Date().toISOString())
            .limit(50);

        if (error) throw error;
        if (!events || events.length === 0) {
            return new Response(JSON.stringify({ message: 'No pending webhooks' }), { headers: { 'Content-Type': 'application/json' } });
        }

        console.log(`Processing ${events.length} webhooks...`);

        const results = await Promise.allSettled(events.map(async (event) => {
            try {
                // Update status to sending
                await supabase.from('webhook_outbox').update({ status: 'sending' }).eq('id', event.id);

                const payload = JSON.stringify({
                    id: event.id,
                    event: event.event_type,
                    created_at: event.created_at,
                    data: event.payload
                });

                // Sign payload
                const signature = await generateSignature(payload, event.webhook_subscriptions.segredo);

                // Send request
                const response = await fetch(event.webhook_subscriptions.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-ClinFlow-Signature': signature,
                        'X-ClinFlow-Event': event.event_type
                    },
                    body: payload
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                }

                // Success
                await supabase.from('webhook_outbox').update({ status: 'sent' }).eq('id', event.id);
                return { id: event.id, status: 'sent' };

            } catch (err) {
                console.error(`Webhook ${event.id} failed:`, err);

                // Retry logic (exponential backoff)
                const attempts = event.attempts + 1;
                const nextAttempt = new Date();
                nextAttempt.setMinutes(nextAttempt.getMinutes() + Math.pow(2, attempts)); // 2, 4, 8, 16 min...

                const status = attempts >= 5 ? 'failed' : 'pending';

                await supabase.from('webhook_outbox').update({
                    status,
                    attempts,
                    next_attempt_at: nextAttempt.toISOString(),
                    last_error: err.message
                }).eq('id', event.id);

                return { id: event.id, status: 'error', error: err.message };
            }
        }));

        return new Response(JSON.stringify({ results }), { headers: { 'Content-Type': 'application/json' } });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
});

async function generateSignature(payload: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payload)
    );
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
