export declare class PaymentMethod {
    readonly id: string;
    readonly userId: string;
    readonly provider: string;
    readonly last4: string;
    readonly expMonth: number;
    readonly expYear: number;
    readonly isDefault: boolean;
    readonly encryptedDetails: string;
    readonly metadata?: Record<string, any>;
    constructor(id: string, userId: string, provider: string, last4: string, expMonth: number, expYear: number, isDefault: boolean, encryptedDetails: string, metadata?: Record<string, any>);
}
