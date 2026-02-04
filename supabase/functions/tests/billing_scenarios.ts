import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BillingEngine } from "../_shared/billing/engine.ts";

// Config
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "http://127.0.0.1:54321";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "your-service-key";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const engine = new BillingEngine(supabase, 'none');

async function runTests() {
    console.log("Starting Billing Scenarios Tests...");

    try {
        // Helper to create tenant
        const createTenant = async () => {
            const id = crypto.randomUUID();
            // Try inserting into 'tenants'
            const { data, error } = await supabase.from('tenants').insert({
                id: id,
                name: 'Test Tenant ' + id,
                slug: 'test-' + id
            }).select().single();

            if (error) {
                // Fallback: maybe table is organizations? But FK is to tenants.
                // If FK is to tenants, we must insert into tenants.
                // Maybe 'tenants' has different columns?
                // Let's try minimal insert
                const { data: data2, error: error2 } = await supabase.from('tenants').insert({ id: id }).select().single();
                if (error2) throw error2;
                return data2.id;
            }
            return data.id;
        };

        // Scenario 1: Free -> Pro Solo (mid-cycle)
        console.log("\n--- Scenario 1: Free -> Pro Solo ---");
        const tenantId1 = await createTenant();
        const sub1 = await engine.startSubscription(tenantId1, 'free_solo', 'solo');
        console.log("Started Free Solo:", sub1.id);

        // Change to Pro Solo (Immediate)
        await engine.changePlan(sub1.id, 'pro_solo', 'immediate');
        console.log("Changed to Pro Solo");

        // Verify Prorata Item
        const { data: items1 } = await supabase.from('billing_itens').select('*').eq('assinatura_id', sub1.id).eq('tipo', 'ajuste_prorata');
        if (items1 && items1.length > 0) {
            console.log("PASS: Prorata item created:", items1[0].total);
        } else {
            console.error("FAIL: No prorata item found");
        }

        // Verify Flags (WhatsApp)
        const { data: limits1 } = await supabase.from('planos_limites').select('flags').eq('codigo_plano', 'pro_solo').single();
        if (limits1?.flags?.whatsapp_automation) {
            console.log("PASS: WhatsApp enabled for Pro Solo");
        } else {
            console.error("FAIL: WhatsApp not enabled");
        }


        // Scenario 2: Company: 5 -> 8 professionals
        console.log("\n--- Scenario 2: Company Seat Upgrade ---");
        const tenantId2 = await createTenant();
        const sub2 = await engine.startSubscription(tenantId2, 'company_base', 'company');
        console.log("Started Company Base:", sub2.id);

        // Change seats
        await engine.changeSeats(sub2.id, 'profissional', 8);
        console.log("Changed seats to 8");

        // Verify Extra Seat Item
        const { data: items2 } = await supabase.from('billing_itens').select('*').eq('assinatura_id', sub2.id).eq('tipo', 'seat_extra');
        if (items2 && items2.length > 0) {
            console.log("PASS: Extra seat item created:", items2[0].total);
        } else {
            console.error("FAIL: No extra seat item found");
        }


        // Scenario 4: Downgrade Pro Solo -> Free (Next Cycle)
        console.log("\n--- Scenario 4: Downgrade Scheduling ---");
        const tenantId4 = await createTenant();
        const sub4 = await engine.startSubscription(tenantId4, 'pro_solo', 'solo');

        await engine.changePlan(sub4.id, 'free_solo', 'next_cycle');

        const { data: sub4Updated } = await supabase.from('assinaturas').select('*').eq('id', sub4.id).single();
        if (sub4Updated.scheduled_change_plan_code === 'free_solo') {
            console.log("PASS: Downgrade scheduled");
        } else {
            console.error("FAIL: Downgrade not scheduled");
        }

        // Close Cycle
        await engine.closeCycle(sub4.id);
        const { data: sub4Final } = await supabase.from('assinaturas').select('*').eq('id', sub4.id).single();
        if (sub4Final.codigo_plano === 'free_solo' && !sub4Final.scheduled_change_plan_code) {
            console.log("PASS: Plan changed after cycle close");
        } else {
            console.error("FAIL: Plan did not change after cycle close. Current:", sub4Final.codigo_plano);
        }


        // Scenario 5: Multi-units Discount
        console.log("\n--- Scenario 5: Multi-unit Discount ---");
        const tenantId5 = await createTenant();
        // Note: extraSeats has 'unidade'
        const sub5 = await engine.startSubscription(tenantId5, 'pro_unit', 'org', { unidade: 3 });

        const { data: seats5 } = await supabase.from('assinatura_seats').select('*').eq('assinatura_id', sub5.id).eq('tipo', 'unidade').single();

        // Expected price: 199.90 * 0.9 = 179.91
        if (seats5 && Math.abs(seats5.preco_unitario - 179.91) < 0.1) {
            console.log("PASS: Discount applied. Price:", seats5.preco_unitario);
        } else {
            console.error("FAIL: Discount not applied. Price:", seats5?.preco_unitario);
        }

    } catch (e) {
        console.error("Test Error:", e);
    }
}

runTests();
