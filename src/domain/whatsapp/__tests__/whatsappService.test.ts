import { describe, it, expect, vi, beforeEach } from 'vitest';
import { whatsappService } from '../whatsappService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(),
        functions: {
            invoke: vi.fn(),
        },
    },
}));

describe('whatsappService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('enfileirarMensagemOperacional', () => {
        it('deve enfileirar mensagem com status queued', async () => {
            const tenantId = 'tenant-123';
            const dados = { telefone: '5511999999999', conteudo: 'Olá' };

            const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>;
            const insertMock = vi.fn().mockReturnThis();
            const selectMock = vi.fn().mockReturnThis();
            const singleMock = vi.fn().mockResolvedValue({ data: { id: 'msg-1' }, error: null });
            const updateMock = vi.fn().mockReturnThis();
            const eqMock = vi.fn().mockReturnThis();

            fromMock.mockReturnValue({
                insert: insertMock,
                select: selectMock,
                single: singleMock,
                update: updateMock,
                eq: eqMock
            });

            // Mock da edge function para envio imediato (sucesso)
            (supabase.functions.invoke as any).mockResolvedValue({ error: null });

            const result = await whatsappService.enfileirarMensagemOperacional(tenantId, dados);

            expect(result.id).toBe('msg-1');
            expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
                tenant_id: tenantId,
                phone_number: dados.telefone,
                status: 'queued',
                message_type: 'operacional'
            }));
        });
    });

    describe('enfileirarMensagemMarketing', () => {
        it('deve verificar consentimento antes de enviar', async () => {
            const tenantId = 'tenant-123';
            const dados = { telefone: '5511999999999', conteudo: 'Promoção' };

            // Mock consentimento = false
            vi.spyOn(whatsappService, '_verificarConsentimento').mockResolvedValue(false);

            await expect(whatsappService.enfileirarMensagemMarketing(tenantId, dados))
                .rejects
                .toThrow("Cliente não deu consentimento");

            const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>;
            expect(fromMock).not.toHaveBeenCalled();
        });

        it('deve enviar se tiver consentimento', async () => {
            const tenantId = 'tenant-123';
            const dados = { telefone: '5511999999999', conteudo: 'Promoção' };

            vi.spyOn(whatsappService, '_verificarConsentimento').mockResolvedValue(true);

            const fromMock = supabase.from as unknown as ReturnType<typeof vi.fn>;
            const insertMock = vi.fn().mockReturnThis();
            const selectMock = vi.fn().mockReturnThis();
            const singleMock = vi.fn().mockResolvedValue({ data: { id: 'msg-2' }, error: null });
            const updateMock = vi.fn().mockReturnThis();
            const eqMock = vi.fn().mockReturnThis();

            fromMock.mockReturnValue({
                insert: insertMock,
                select: selectMock,
                single: singleMock,
                update: updateMock,
                eq: eqMock
            });

            (supabase.functions.invoke as any).mockResolvedValue({ error: null });

            const result = await whatsappService.enfileirarMensagemMarketing(tenantId, dados);

            expect(result.id).toBe('msg-2');
            expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
                message_type: 'marketing'
            }));
        });
    });
});
