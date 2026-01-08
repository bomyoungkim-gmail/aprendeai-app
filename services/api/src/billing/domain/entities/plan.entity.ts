export class Plan {
  id: string;
  code: string;
  name: string;
  description?: string;
  entitlements: any;
  monthlyPrice?: number;
  yearlyPrice?: number;
  stripePriceId?: string; // Stripe Price ID for subscription updates
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Plan>) {
    Object.assign(this, partial);
  }
}
