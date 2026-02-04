import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { applyPolicies } from "./logic.ts";

Deno.test("applyPolicies deve aplicar politicas corretamente", async () => {
    // Mock logger
    const mockLogger = {
        info: () => Promise.resolve(),
        error: () => Promise.resolve(),
    };

    // Mock Supabase
    const mockSupabase = {
        from: (table: string) => {
            if (table === 'retention_policies_detailed') {
                return {
                    select: () => ({
                        eq: () => Promise.resolve({
                            data: [{
                                id: 'policy-1',
                                retention_months: 6,
                                target_table: 'log_mensagens',
                                policy_name: 'Teste',
                                active: true
                            }],
                            error: null
                        })
                    }),
                    update: () => ({
                        eq: () => Promise.resolve({ error: null })
                    })
                };
            }
            if (table === 'log_mensagens') {
                return {
                    delete: () => ({
                        lt: () => ({
                            in: () => Promise.resolve({ count: 10, error: null })
                        })
                    })
                };
            }
            return { select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) };
        }
    } as any;

    const results = await applyPolicies(mockSupabase, mockLogger);

    assertEquals(results.length, 1);
    assertEquals(results[0].deleted, 10);
    assertEquals(results[0].table, 'log_mensagens');
});
