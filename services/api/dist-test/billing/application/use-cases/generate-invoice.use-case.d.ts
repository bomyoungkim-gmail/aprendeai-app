import { ISubscriptionRepository } from '../../domain/interfaces/subscription.repository.interface';
import { IInvoiceRepository } from '../../domain/interfaces/invoice.repository.interface';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { Invoice } from '../../domain/entities/invoice.entity';
export declare class GenerateInvoiceUseCase {
    private subscriptionRepo;
    private invoiceRepo;
    private stripeService;
    constructor(subscriptionRepo: ISubscriptionRepository, invoiceRepo: IInvoiceRepository, stripeService: StripeService);
    execute(subscriptionId: string): Promise<Invoice>;
}
