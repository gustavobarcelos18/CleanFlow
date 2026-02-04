export type PlanCode = 'free_solo' | 'pro_solo' | 'company_base' | 'company_extra_seat' | 'pro_unit' | 'multi_org_discount';
export type SubscriptionEdition = 'solo' | 'company' | 'org';
export type SubscriptionStatus = 'draft' | 'active' | 'past_due' | 'canceled' | 'trialing';
export type ProviderType = 'stripe' | 'pagarme' | 'none';
export type SeatType = 'profissional' | 'secretaria' | 'unidade';
export type BillingItemType = 'plano' | 'seat_extra' | 'ajuste_prorata' | 'desconto';
export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export interface PlanPrice {
    id: string;
    codigo_plano: PlanCode;
    descricao: string;
    preco_mensal_brl: number;
    moeda: string;
    ativo: boolean;
}

export interface PlanLimits {
    id: string;
    codigo_plano: PlanCode;
    max_profissionais: number | null;
    max_secretarias: number | null;
    max_unidades: number | null;
    max_clientes: number | null;
    mensagens_incluidas: number | null;
    flags: Record<string, any>;
}

export interface Subscription {
    id: string;
    tenant_id: string;
    edition: SubscriptionEdition;
    codigo_plano: PlanCode;
    status: SubscriptionStatus;
    ciclo_inicio: string; // ISO date
    ciclo_fim: string; // ISO date
    proximo_cobranca: string; // ISO date
    provider: ProviderType;
    provider_subscription_id?: string;
    scheduled_change_plan_code?: PlanCode;
    scheduled_change_date?: string;
    created_at?: string;
    updated_at?: string;
}

export interface SubscriptionSeat {
    id: string;
    assinatura_id: string;
    tipo: SeatType;
    quantidade: number;
    quantidade_incluida: number;
    quantidade_cobrada: number;
    preco_unitario: number;
}

export interface BillingItem {
    id?: string;
    assinatura_id: string;
    tipo: BillingItemType;
    descricao: string;
    referencia_mes: string; // YYYY-MM-DD
    quantidade: number;
    valor_unitario: number;
    total: number;
    meta?: Record<string, any>;
}

export interface BillingInvoice {
    id?: string;
    assinatura_id: string;
    provider_invoice_id?: string;
    periodo_inicio: string;
    periodo_fim: string;
    total: number;
    status: InvoiceStatus;
}
