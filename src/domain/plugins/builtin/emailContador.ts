import { IPlugin, PluginContext, PluginHook } from "../pluginTypes";

export const emailContadorPlugin: IPlugin = {
    metadata: {
        name: "Notificar Contador",
        description: "Envia um e-mail para o contador quando uma fatura é paga.",
        version: "1.0.0",
        author: "ClinFlow System"
    },
    hooks: ['onInvoicePaid'],
    execute: async (hook: PluginHook, context: PluginContext) => {
        if (hook !== 'onInvoicePaid') return;

        const emailContador = context.config.email_contador;
        if (!emailContador) {
            console.warn(`[Plugin: Notificar Contador] Email não configurado para tenant ${context.tenantId}`);
            return;
        }

        console.log(`[Plugin: Notificar Contador] Enviando email para ${emailContador} sobre fatura ${context.data.invoice_id}`);
        // Aqui entraria a chamada real de envio de email
    }
};
