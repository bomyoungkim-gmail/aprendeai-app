import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ISubscriptionRepository } from '../../domain/interfaces/subscription.repository.interface';
import { IInvoiceRepository } from '../../domain/interfaces/invoice.repository.interface';
import { StripeService } from '../../infrastructure/stripe/stripe.service';
import { Invoice } from '../../domain/entities/invoice.entity';

@Injectable()
export class GenerateInvoiceUseCase {
  constructor(
    @Inject(ISubscriptionRepository) private subscriptionRepo: ISubscriptionRepository,
    @Inject(IInvoiceRepository) private invoiceRepo: IInvoiceRepository,
    private stripeService: StripeService,
  ) {}

  async execute(subscriptionId: string): Promise<Invoice> {
    const sub = await this.subscriptionRepo.findById(subscriptionId);
    if (!sub) throw new NotFoundException('Subscription not found');

    // 1. Create on Stripe
    const stripeInvoice = await this.stripeService.createInvoice(sub.stripeSubscriptionId);

    // 2. Persist in DB
    const invoice = new Invoice(
      crypto.randomUUID(),
      subscriptionId,
      (stripeInvoice as any).amount_due / 100, // example conversion
      (stripeInvoice as any).currency.toUpperCase(),
      new Date((stripeInvoice as any).period_start * 1000),
      new Date((stripeInvoice as any).period_end * 1000),
      'PAID', // Simplified for MVP
      stripeInvoice.id,
      {},
    );

    return this.invoiceRepo.create(invoice);
  }
}
