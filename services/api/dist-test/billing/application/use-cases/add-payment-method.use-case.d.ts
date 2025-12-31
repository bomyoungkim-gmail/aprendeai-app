import { IPaymentMethodRepository } from '../../domain/interfaces/payment-method.repository.interface';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { PaymentMethod } from '../../domain/entities/payment-method.entity';
export declare class AddPaymentMethodUseCase {
    private paymentMethodRepo;
    private stripeService;
    constructor(paymentMethodRepo: IPaymentMethodRepository, stripeService: StripeService);
    execute(userId: string, stripePaymentMethodId: string): Promise<PaymentMethod>;
}
