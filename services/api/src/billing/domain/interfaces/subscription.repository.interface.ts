import { Subscription } from "../entities/subscription.entity";

export interface ISubscriptionRepository {
  create(subscription: Subscription): Promise<Subscription>;
  findById(id: string): Promise<Subscription | null>;
  findActiveByScope(scopeType: string, scopeId: string): Promise<Subscription | null>;
  hasActiveSubscription(scopeType: string, scopeId: string): Promise<boolean>;
  findMany(params: any): Promise<Subscription[]>;
  update(id: string, updates: Partial<Subscription>): Promise<Subscription>;
  cancel(id: string): Promise<void>;
}

export const ISubscriptionRepository = Symbol("ISubscriptionRepository");
