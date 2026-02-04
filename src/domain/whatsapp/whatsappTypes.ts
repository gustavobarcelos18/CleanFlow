export type MessageStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageChannel = 'whatsapp' | 'email' | 'sms';
export type MessageType = 'operacional' | 'marketing';

export interface WhatsappMessage {
    id?: string;
    tenant_id: string;
    phone_number: string;
    content: string; // ou template_name + parameters
    status: MessageStatus;
    channel: MessageChannel;
    type: MessageType;
    metadata?: Record<string, any>;
    created_at?: string;
    scheduled_for?: string;
}

export interface WhatsappOutboxEntry {
    tenant_id: string;
    phone_number: string;
    message_content: string;
    status: MessageStatus;
    message_type: MessageType; // mapeado para uma coluna de categoria ou metadados
    metadata?: any;
}
