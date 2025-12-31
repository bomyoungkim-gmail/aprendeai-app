import { CreateSubscriptionUseCase } from "./application/use-cases/create-subscription.use-case";
import { CancelSubscriptionUseCase } from "./application/use-cases/cancel-subscription.use-case";
import { AddPaymentMethodUseCase } from "./application/use-cases/add-payment-method.use-case";
import { SetDefaultPaymentMethodUseCase } from "./application/use-cases/set-default-payment-method.use-case";
import { GenerateInvoiceUseCase } from "./application/use-cases/generate-invoice.use-case";
import { IPlansRepository } from "./domain/interfaces/plans.repository.interface";
import { Plan } from "./domain/entities/plan.entity";
export declare class BillingService {
    private readonly plansRepository;
    private createSubscriptionUseCase;
    private cancelSubscriptionUseCase;
    private addPaymentMethodUseCase;
    private setDefaultPaymentMethodUseCase;
    private generateInvoiceUseCase;
    constructor(plansRepository: IPlansRepository, createSubscriptionUseCase: CreateSubscriptionUseCase, cancelSubscriptionUseCase: CancelSubscriptionUseCase, addPaymentMethodUseCase: AddPaymentMethodUseCase, setDefaultPaymentMethodUseCase: SetDefaultPaymentMethodUseCase, generateInvoiceUseCase: GenerateInvoiceUseCase);
    createSubscription(userId: string, planId: string, stripePriceId: string): Promise<import("./domain/entities/subscription.entity").Subscription>;
    cancelSubscription(subscriptionId: string): Promise<void>;
    generateInvoice(subscriptionId: string): Promise<import("./domain/entities/invoice.entity").Invoice>;
    addPaymentMethod(userId: string, stripePaymentMethodId: string): Promise<import("./domain/entities/payment-method.entity").PaymentMethod>;
    setDefaultPaymentMethod(paymentMethodId: string): Promise<void>;
    getPlans(): Promise<Plan[]>;
    getPlanByCode(code: string): Promise<Plan>;
    getPlanById(id: string): Promise<Plan>;
    createPlan(data: {
        code: string;
        name: string;
        description?: string;
        entitlements: any;
        monthlyPrice?: number;
        yearlyPrice?: number;
    }): Promise<Plan>;
    updatePlan(id: string, data: {
        name?: string;
        description?: string;
        entitlements?: any;
        monthlyPrice?: number;
        yearlyPrice?: number;
        isActive?: boolean;
    }): Promise<Plan>;
    deletePlan(id: string): Promise<Plan>;
}
