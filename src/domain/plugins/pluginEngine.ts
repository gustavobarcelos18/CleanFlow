import { supabase } from "@/integrations/supabase/client";
import { IPlugin, PluginHook } from "./pluginTypes";
import { emailContadorPlugin } from "./builtin/emailContador";
import { webhookErpPlugin } from "./builtin/webhookErp";

// Registro estático de plugins disponíveis no sistema (hardcoded por segurança nesta versão)
const AVAILABLE_PLUGINS: Record<string, IPlugin> = {
    'email-contador': emailContadorPlugin,
    'webhook-erp': webhookErpPlugin
};

export const pluginEngine = {
    async executarPlugins(hook: PluginHook, tenantId: string, data: any) {
        console.log(`[PluginEngine] Buscando plugins para hook: ${hook} (Tenant: ${tenantId})`);

        try {
            // 1. Buscar plugins ativos para este tenant no banco
            // A tabela plugins_registry mapeia quais plugins (pelo nome/chave) estão ativos e sua config
            const { data: activePlugins, error } = await supabase
                .from('plugins_registry')
                .select('*')
                .eq('tenant_id', tenantId)
                .eq('ativo', true)
                .contains('hooks', [hook]); // Verifica se o plugin suporta este hook

            if (error) {
                console.error('[PluginEngine] Erro ao buscar plugins:', error);
                return;
            }

            if (!activePlugins || activePlugins.length === 0) {
                return;
            }

            // 2. Executar cada plugin encontrado
            for (const registry of activePlugins) {
                const pluginImplementation = AVAILABLE_PLUGINS[registry.nome]; // O nome no banco deve bater com a chave aqui

                if (pluginImplementation) {
                    console.log(`[PluginEngine] Executando plugin: ${registry.nome}`);
                    try {
                        await pluginImplementation.execute(hook, {
                            tenantId,
                            data,
                            config: registry.config_json
                        });
                    } catch (pluginError) {
                        console.error(`[PluginEngine] Erro na execução do plugin ${registry.nome}:`, pluginError);
                        // Não relançar erro para não parar o fluxo principal
                    }
                } else {
                    console.warn(`[PluginEngine] Implementação não encontrada para plugin registrado: ${registry.nome}`);
                }
            }

        } catch (err) {
            console.error('[PluginEngine] Erro crítico:', err);
        }
    }
};
