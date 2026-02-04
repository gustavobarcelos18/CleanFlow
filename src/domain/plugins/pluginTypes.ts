export interface PluginMetadata {
    name: string;
    description: string;
    version: string;
    author: string;
}

export type PluginHook =
    | 'onAppointmentCreated'
    | 'onAppointmentUpdated'
    | 'onInvoicePaid'
    | 'onCustomerCreated';

export interface PluginContext {
    tenantId: string;
    data: any; // Payload do evento
    config: any; // Configuração específica do plugin para este tenant
}

export interface IPlugin {
    metadata: PluginMetadata;
    hooks: PluginHook[];
    execute: (hook: PluginHook, context: PluginContext) => Promise<void>;
}
