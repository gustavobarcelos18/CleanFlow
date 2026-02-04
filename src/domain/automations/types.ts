export type AutomationEventType =
    | 'onAppointmentCreated'
    | 'onAppointmentConfirmed'
    | 'onAppointmentNoShow'
    | 'onInvoiceDue'
    | 'onInvoicePaid';

export type NodeType = 'trigger' | 'condition' | 'action';

export type ActionType =
    | 'send_whatsapp'
    | 'send_email'
    | 'send_sms'
    | 'add_tag';

export type ConditionType =
    | 'check_risk_noshow'
    | 'check_unit'
    | 'check_service'
    | 'check_channel_allowed';

export interface AutomationFlow {
    id: string;
    tenant_id: string | null;
    nome: string;
    descricao?: string;
    ativo: boolean;
    is_global?: boolean;
    segmento?: string;
    created_at: string;
    updated_at: string;
}

export interface AutomationNode {
    id: string;
    flow_id: string;
    tipo: NodeType;
    config_json: any;
    ordem: number;
    created_at: string;
}

export interface AutomationEdge {
    id: string;
    flow_id: string;
    from_node_id: string;
    to_node_id: string;
    condicao_json?: any;
    created_at: string;
}

export interface AutomationContext {
    tenant_id: string;
    event_type: AutomationEventType;
    data: any; // Payload do evento (agendamento, fatura, etc)
}
