import { ISubscriptionRepository } from '../../domain/interfaces/subscription.repository.interface';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { Subscription } from '../../domain/entities/subscription.entity';
export declare class CreateSubscriptionUseCase {
    private subscriptionRepo;
    private stripeService;
    constructor(subscriptionRepo: ISubscriptionRepository, stripeService: StripeService);
    execute(userId: string, planId: string, stripePriceId: string): Promise<Subscription>;
}
