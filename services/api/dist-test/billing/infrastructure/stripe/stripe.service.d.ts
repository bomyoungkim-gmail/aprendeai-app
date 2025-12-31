import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
export declare class StripeService {
    private configService;
    private stripe;
    private readonly logger;
    constructor(configService: ConfigService);
    createSubscription(customerId: string, priceId: string): Promise<Stripe.Response<Stripe.Subscription>>;
    cancelSubscription(subscriptionId: string): Promise<Stripe.Response<Stripe.Subscription>>;
    createInvoice(subscriptionId: string): Promise<Stripe.Response<Stripe.Invoice>>;
    attachPaymentMethod(customerId: string, paymentMethodId: string): Promise<Stripe.Response<Stripe.Customer>>;
    createCustomer(email: string, name?: string): Promise<Stripe.Response<Stripe.Customer>>;
    getSubscription(id: string): Promise<Stripe.Response<Stripe.Subscription>>;
}
