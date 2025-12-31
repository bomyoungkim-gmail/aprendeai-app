import { Injectable, Inject } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/interfaces/subscription.repository.interface';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { Subscription } from '../../domain/entities/subscription.entity';

@Injectable()
export class CreateSubscriptionUseCase {
  constructor(
    @Inject(ISubscriptionRepository) private subscriptionRepo: ISubscriptionRepository,
    private stripeService: StripeService,
  ) {}

  async execute(userId: string, planId: string, stripePriceId: string): Promise<Subscription> {
    // 1. Create on Stripe (assuming customer already exists or we create one)
    // For MVP, we'll assume we need to get or create stripe customer
    // This could be another use case, but let's simplify for now
    const stripeSub = await this.stripeService.createSubscription('cus_placeholder', stripePriceId);

    // 2. Persist in DB
    const subscription = new Subscription(
      crypto.randomUUID(),
      userId,
      'USER', // Default scopeType
      userId, // Default scopeId
      planId,
      'ACTIVE',
      new Date(),
      stripeSub.id,
      undefined,
      {},
    );

    return this.subscriptionRepo.create(subscription);
  }
}
