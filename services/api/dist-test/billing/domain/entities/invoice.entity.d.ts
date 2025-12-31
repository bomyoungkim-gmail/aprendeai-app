export declare class Invoice {
    readonly id: string;
    readonly subscriptionId: string;
    readonly amount: number;
    readonly currency: string;
    readonly periodStart: Date;
    readonly periodEnd: Date;
    readonly status: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE';
    readonly stripeInvoiceId: string;
    readonly metadata?: Record<string, any>;
    constructor(id: string, subscriptionId: string, amount: number, currency: string, periodStart: Date, periodEnd: Date, status: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE', stripeInvoiceId: string, metadata?: Record<string, any>);
}
