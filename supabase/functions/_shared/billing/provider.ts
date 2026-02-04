import { Subscription, BillingInvoice } from "./types.ts";

export interface IBillingProvider {
    createCustomer(tenantId: string, email: string, name: string): Promise<string>;
    createSubscription(subscription: Subscription, items: { priceId: string, quantity: number }[], couponId?: string): Promise<string>;
    updateSubscription(providerSubscriptionId: string, items: { priceId: string, quantity: number }[]): Promise<void>;
    cancelSubscription(providerSubscriptionId: string): Promise<void>;
    finalizeInvoice(invoice: BillingInvoice): Promise<string>; // Returns provider invoice ID
    retrieveInvoice(providerInvoiceId: string): Promise<any>;
}

export class NoneBillingProvider implements IBillingProvider {
    async createCustomer(tenantId: string, email: string, name: string): Promise<string> {
        console.log(`[NoneProvider] Creating customer for tenant ${tenantId} (${email})`);
        return `cus_sim_${tenantId.substring(0, 8)}`;
    }

    async createSubscription(subscription: Subscription, items: { priceId: string, quantity: number }[], couponId?: string): Promise<string> {
        console.log(`[NoneProvider] Creating subscription for tenant ${subscription.tenant_id} with coupon ${couponId}`, items);
        return `sub_sim_${crypto.randomUUID().substring(0, 8)}`;
    }

    async updateSubscription(providerSubscriptionId: string, items: { priceId: string, quantity: number }[]): Promise<void> {
        console.log(`[NoneProvider] Updating subscription ${providerSubscriptionId}`, items);
    }

    async cancelSubscription(providerSubscriptionId: string): Promise<void> {
        console.log(`[NoneProvider] Canceling subscription ${providerSubscriptionId}`);
    }

    async finalizeInvoice(invoice: BillingInvoice): Promise<string> {
        console.log(`[NoneProvider] Finalizing invoice for subscription ${invoice.assinatura_id} with total ${invoice.total}`);
        return `in_sim_${crypto.randomUUID().substring(0, 8)}`;
    }

    async retrieveInvoice(providerInvoiceId: string): Promise<any> {
        console.log(`[NoneProvider] Retrieving invoice ${providerInvoiceId}`);
        return { status: 'paid', total: 0 };
    }
}

export class BillingProviderFactory {
    static getProvider(type: 'stripe' | 'pagarme' | 'none'): IBillingProvider {
        switch (type) {
            case 'none':
                return new NoneBillingProvider();
            case 'stripe':
                throw new Error("Stripe provider not implemented yet");
            case 'pagarme':
                throw new Error("Pagar.me provider not implemented yet");
            default:
                throw new Error(`Unknown provider type: ${type}`);
        }
    }
}
