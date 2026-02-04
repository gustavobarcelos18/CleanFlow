import { describe, it, expect, vi, beforeEach } from 'vitest';
import { billingService } from '../billingService';
import { supabase } from '@/integrations/supabase/client';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(),
        functions: {
            invoke: vi.fn(),
        },
    },
}));

describe('billingService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('carregarAssinaturaAtual', () => {
        it('deve carregar assinatura e calcular seats corretamente', async () => {
            const tenantId = 'tenant-123';

            // Mock da resposta de subscriptions
            const mockSubscription = {
                id: 'sub-1',
                tenant_id: tenantId,
                status: 'active',
                plan: {
                    id: 'plan-clinica',
                    name: 'Clínica',
                    price: 699,
                    limits: {
                        seats: 5
                    }
                }
            };

            // Mock da resposta de profiles (contagem)
            const mockProfilesCount = 8; // 8 usuários ativos

            // Configurando os mocks
            const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>;

            // Mock para subscriptions
            fromMock.mockImplementation((table: string) => {
                if (table === 'subscriptions') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue({ data: mockSubscription, error: null })
                    };
                }
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockResolvedValue({ count: mockProfilesCount, error: null })
                    };
                }
                return { select: vi.fn() };
            });

            const result = await billingService.carregarAssinaturaAtual(tenantId);

            expect(result.subscription).toBeDefined();
            expect(result.subscription?.plan?.name).toBe('Clínica');
            expect(result.seatUsage.active_users).toBe(8);
            expect(result.seatUsage.total_seats_included).toBe(5);
            expect(result.seatUsage.extra_seats).toBe(3); // 8 - 5 = 3
        });

        it('deve retornar 0 seats extras se dentro do limite', async () => {
            const tenantId = 'tenant-123';

            const mockSubscription = {
                id: 'sub-1',
                tenant_id: tenantId,
                status: 'active',
                plan: {
                    limits: { seats: 5 }
                }
            };

            const mockProfilesCount = 3; // 3 usuários ativos

            const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>;
            fromMock.mockImplementation((table: string) => {
                if (table === 'subscriptions') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        maybeSingle: vi.fn().mockResolvedValue({ data: mockSubscription, error: null })
                    };
                }
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockResolvedValue({ count: mockProfilesCount, error: null })
                    };
                }
                return { select: vi.fn() };
            });

            const result = await billingService.carregarAssinaturaAtual(tenantId);
            expect(result.seatUsage.extra_seats).toBe(0);
        });
    });

    describe('agendarDowngradePlano', () => {
        it('deve chamar a edge function corretamente', async () => {
            const tenantId = 'tenant-123';
            const novoPlanoId = 'plan-basic';

            const invokeMock = supabase.functions.invoke as unknown as ReturnType<typeof vi.fn>;
            invokeMock.mockResolvedValue({ data: { success: true }, error: null });

            await billingService.agendarDowngradePlano(tenantId, novoPlanoId);

            expect(invokeMock).toHaveBeenCalledWith('billing-ops', {
                body: {
                    action: 'schedule_downgrade',
                    tenant_id: tenantId,
                    new_plan_id: novoPlanoId
                }
            });
        });
    });
});
