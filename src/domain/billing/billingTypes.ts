export interface Plan {
    id: string;
    name: string;
    description?: string;
    price: number;
    interval: 'month' | 'year';
    active: boolean;
    limits?: {
        seats?: number;
        storage?: number;
        whatsapp_credits?: number;
    };
    stripe_price_id?: string;
}

export interface Subscription {
    id: string;
    tenant_id: string;
    plan_id: string;
    status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' | 'unpaid';
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean | null;
    billing_cycle: string;
    trial_end: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;

    // Campos calculados/join
    plan?: Plan;
}

export interface SeatUsage {
    total_seats_included: number;
    active_users: number;
    extra_seats: number;
    extra_seats_cost: number;
}

export interface BillingOverview {
    subscription: Subscription | null;
    seatUsage: SeatUsage;
    nextInvoiceEstimate?: number;
}
