import { Injectable, Inject } from '@nestjs/common';
import { IPaymentMethodRepository } from '../../domain/interfaces/payment-method.repository.interface';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { PaymentMethod } from '../../domain/entities/payment-method.entity';

@Injectable()
export class AddPaymentMethodUseCase {
  constructor(
    @Inject(IPaymentMethodRepository) private paymentMethodRepo: IPaymentMethodRepository,
    private stripeService: StripeService,
  ) {}

  async execute(userId: string, stripePaymentMethodId: string): Promise<PaymentMethod> {
    // 1. Attach to Stripe customer
    // Assuming we fetch user's stripe customer id here
    const stripeCustomer = await this.stripeService.attachPaymentMethod('cus_placeholder', stripePaymentMethodId);

    // 2. Persist in DB
    const method = new PaymentMethod(
      crypto.randomUUID(),
      userId,
      'stripe',
      '4242', // Last 4 digits - would come from stripe response
      12, // Exp month
      2030, // Exp year
      false, // Default
      'encrypted_stripe_id', // Simplified
      {},
    );

    return this.paymentMethodRepo.create(method);
  }
}
