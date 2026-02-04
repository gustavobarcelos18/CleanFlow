import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { BillingEngine } from "../_shared/billing/engine.ts";

console.log("Billing Ops Function Up!");

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { action, tenantId, ...params } = await req.json();
        const engine = new BillingEngine(supabaseClient, 'none'); // Using 'none' provider for now

        let result;

        switch (action) {
            case 'start_subscription':
                result = await engine.startSubscription(
                    tenantId,
                    params.planCode,
                    params.edition,
                    params.extraSeats,
                    params.couponCode
                );
                break;

            case 'change_plan':
                result = await engine.changePlan(
                    params.subscriptionId,
                    params.newPlanCode,
                    params.effective
                );
                break;

            case 'change_seats':
                result = await engine.changeSeats(
                    params.subscriptionId,
                    params.type,
                    params.newQuantity
                );
                break;

            case 'preview_change':
                result = await engine.previewChange(
                    params.subscriptionId,
                    params.newPlanCode,
                    params.newSeats,
                    params.effective
                );
                break;

            case 'close_cycle':
                result = await engine.closeCycle(
                    params.subscriptionId
                );
                break;

            default:
                throw new Error(`Unknown action: ${action}`);
        }

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
