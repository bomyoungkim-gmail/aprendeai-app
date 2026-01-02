export class Subscription {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly scopeType: string,
    public readonly scopeId: string,
    public readonly planId: string,
    public readonly status: "ACTIVE" | "CANCELED" | "PAST_DUE",
    public readonly startDate: Date,
    public readonly stripeSubscriptionId: string,
    public readonly endDate?: Date,
    public readonly metadata?: Record<string, any>,
    public readonly plan?: any,
  ) {}
}
