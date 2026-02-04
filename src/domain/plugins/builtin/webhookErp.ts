import { IPlugin, PluginContext, PluginHook } from "../pluginTypes";

export const webhookErpPlugin: IPlugin = {
    metadata: {
        name: "Integração ERP",
        description: "Envia dados de agendamento para um ERP externo via Webhook.",
        version: "1.0.0",
        author: "ClinFlow System"
    },
    hooks: ['onAppointmentCreated'],
    execute: async (hook: PluginHook, context: PluginContext) => {
        if (hook !== 'onAppointmentCreated') return;

        const erpUrl = context.config.erp_url;
        const apiKey = context.config.api_key;

        if (!erpUrl) {
            console.warn(`[Plugin: Integração ERP] URL não configurada para tenant ${context.tenantId}`);
            return;
        }

        console.log(`[Plugin: Integração ERP] Enviando agendamento ${context.data.id} para ${erpUrl}`);

        try {
            // Simulação de fetch
            // await fetch(erpUrl, {
            //   method: 'POST',
            //   headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            //   body: JSON.stringify(context.data)
            // });
        } catch (error) {
            console.error(`[Plugin: Integração ERP] Erro ao enviar:`, error);
        }
    }
};
