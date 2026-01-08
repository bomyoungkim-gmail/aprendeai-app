import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { ISubscriptionRepository } from "../../domain/interfaces/subscription.repository.interface";
import { StripeService } from "../../infrastructure/stripe/stripe.service";

@Injectable()
export class CancelSubscriptionUseCase {
  constructor(
    @Inject(ISubscriptionRepository)
    private subscriptionRepo: ISubscriptionRepository,
    private stripeService: StripeService,
  ) {}

  async execute(
    subscriptionId: string,
    immediate: boolean = false,
  ): Promise<void> {
    const sub = await this.subscriptionRepo.findById(subscriptionId);
    if (!sub) throw new NotFoundException("Subscription not found");

    // 1. Cancel on Stripe (default: keep access until period end)
    await this.stripeService.cancelSubscription(
      sub.stripeSubscriptionId,
      !immediate, // cancelAtPeriodEnd = !immediate
    );

    // 2. Update DB
    await this.subscriptionRepo.cancel(subscriptionId);
  }
}
