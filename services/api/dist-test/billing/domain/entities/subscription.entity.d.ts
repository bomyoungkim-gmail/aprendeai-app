export declare class Subscription {
    readonly id: string;
    readonly userId: string;
    readonly scopeType: string;
    readonly scopeId: string;
    readonly planId: string;
    readonly status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE';
    readonly startDate: Date;
    readonly stripeSubscriptionId: string;
    readonly endDate?: Date;
    readonly metadata?: Record<string, any>;
    readonly plan?: any;
    constructor(id: string, userId: string, scopeType: string, scopeId: string, planId: string, status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE', startDate: Date, stripeSubscriptionId: string, endDate?: Date, metadata?: Record<string, any>, plan?: any);
}
