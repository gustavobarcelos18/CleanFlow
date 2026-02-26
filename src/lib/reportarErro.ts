import { supabase } from "@/integrations/supabase/client";

interface ReportErroOptions {
    user_id?: string | null;
    tenant_id?: string | null;
    organization_id?: string | null;
    organization_unit_id?: string | null;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    metadata?: any;
}

// Cache simples para deduplicação (hash do erro -> timestamp)
const reportedErrorsCache = new Map<string, number>();
const REPORTE_LIMIT_SECONDS = 60;

/**
 * Sanitiza mensagens de erro removendo possíveis dados sensíveis e truncando strings longas.
 */
function sanitize(text: string | undefined): string {
    if (!text) return "";

    // Exemplo básico de sanitização: remover padrões de e-mail e tokens
    const cleanText = text
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]")
        .replace(/eyJ[a-zA-Z0-9._-]{10,}/g, "[TOKEN]");

    // Truncar para evitar falhas no insert se o stack for enorme
    return cleanText.slice(0, 10000);
}

/**
 * Gera um hash simples para identificar erros únicos
 */
function getErrorHash(message: string, stack: string, url: string): string {
    return `${message}|${stack.slice(0, 100)}|${url}`;
}

/**
 * Reporta um erro para a tabela support_tickets no Supabase.
 * Inclui lógica de rate limit e deduplicação.
 */
export async function reportarErro(error: Error | any, options: ReportErroOptions = {}) {
    try {
        const errorMsg = error?.message || String(error);
        const errorStack = error?.stack || "";
        const pageUrl = window.location.href;

        // 1. Deduplicação e Anti-spam
        const hash = getErrorHash(errorMsg, errorStack, pageUrl);
        const lastReported = reportedErrorsCache.get(hash);
        const now = Date.now();

        if (lastReported && (now - lastReported) < REPORTE_LIMIT_SECONDS * 1000) {
            console.log("[reportarErro] Ignorando erro duplicado ou em rate limit.");
            return;
        }

        // Salvar no cache de memória e localStorage (para persistir entre reloads se necessário)
        reportedErrorsCache.set(hash, now);
        try {
            localStorage.setItem(`last_error_${hash.slice(0, 20)}`, now.toString());
        } catch (e) { /* ignore */ }

        // 2. Montar Payload
        const payload = {
            user_id: options.user_id,
            tenant_id: options.tenant_id,
            organization_id: options.organization_id,
            organization_unit_id: options.organization_unit_id,
            page_url: pageUrl,
            user_agent: sanitize(navigator.userAgent.slice(0, 500)),
            error_name: sanitize(error?.name || 'Error'),
            error_message: sanitize(errorMsg),
            error_stack: sanitize(errorStack),
            severity: options.severity || 'critical',
            metadata: options.metadata || {},
        };

        // 3. Enviar para o Supabase (Apenas se o usuário estiver logado ou conforme política de segurança)
        // Nota: A política do Supabase permite inserção apenas por usuários autenticados.
        const { error: insertError } = await supabase
            .from('support_tickets' as any)
            .insert([payload]);

        if (insertError) {
            // Se falhar o envio (ex: rede offline ou permissão), apenas logamos.
            console.error("[reportarErro] Falha ao enviar ticket de suporte:", insertError);
        } else {
            console.log("[reportarErro] Erro crítico reportado com sucesso.");
        }
    } catch (fatal) {
        // Garantimos que o próprio sistema de reporte nunca cause um crash secundário
        console.error("[reportarErro] Erro fatal no sistema de captura:", fatal);
    }
}
