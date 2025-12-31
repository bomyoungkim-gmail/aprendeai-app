export class Invoice {
  constructor(
    public readonly id: string,
    public readonly subscriptionId: string,
    public readonly amount: number,
    public readonly currency: string,
    public readonly periodStart: Date,
    public readonly periodEnd: Date,
    public readonly status: 'DRAFT' | 'OPEN' | 'PAID' | 'VOID' | 'UNCOLLECTIBLE',
    public readonly stripeInvoiceId: string,
    public readonly metadata?: Record<string, any>,
  ) {}
}
