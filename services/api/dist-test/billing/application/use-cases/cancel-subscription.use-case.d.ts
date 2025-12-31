import { ISubscriptionRepository } from '../../domain/interfaces/subscription.repository.interface';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
export declare class CancelSubscriptionUseCase {
    private subscriptionRepo;
    private stripeService;
    constructor(subscriptionRepo: ISubscriptionRepository, stripeService: StripeService);
    execute(subscriptionId: string): Promise<void>;
}
