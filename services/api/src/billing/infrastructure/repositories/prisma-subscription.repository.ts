import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ISubscriptionRepository } from '../../domain/interfaces/subscription.repository.interface';
import { Subscription } from '../../domain/entities/subscription.entity';
import { Plan } from '../../domain/entities/plan.entity';
import { SubscriptionStatus, ScopeType } from '@prisma/client';

@Injectable()
export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  constructor(private prisma: PrismaService) {}

  async create(subscription: Subscription): Promise<Subscription> {
    const created = await this.prisma.subscriptions.create({
      data: {
        id: subscription.id,
        user_id: subscription.userId,
        scope_type: subscription.scopeType as ScopeType,
        scope_id: subscription.scopeId,
        plan_id: subscription.planId,
        status: subscription.status as SubscriptionStatus,
        source: 'INTERNAL',
        current_period_start: subscription.startDate,
        provider_subscription_id: subscription.stripeSubscriptionId,
        metadata: subscription.metadata as any,
        updated_at: new Date(),
      },
    });

    return this.mapToEntity(created);
  }

  async findById(id: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { id },
      include: { plans: true },
    });

    if (!subscription) return null;
    return this.mapToEntity(subscription);
  }

  async findActiveByScope(scopeType: string, scopeId: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscriptions.findFirst({
      where: {
        scope_type: scopeType as ScopeType,
        scope_id: scopeId,
        status: { in: ['ACTIVE', 'TRIALING', 'GRACE_PERIOD'] },
      },
      include: { plans: true },
      orderBy: { created_at: 'desc' },
    });

    return subscription ? this.mapToEntity(subscription) : null;
  }

  async hasActiveSubscription(scopeType: string, scopeId: string): Promise<boolean> {
    const count = await this.prisma.subscriptions.count({
      where: {
        scope_type: scopeType as ScopeType,
        scope_id: scopeId,
        status: { in: ['ACTIVE', 'TRIALING', 'GRACE_PERIOD'] },
      },
    });
    return count > 0;
  }

  async findMany(params: any): Promise<Subscription[]> {
      const found = await this.prisma.subscriptions.findMany({
          ...params,
          include: { plans: true },
      });
      return found.map(s => this.mapToEntity(s));
  }

  async update(id: string, updates: Partial<Subscription>): Promise<Subscription> {
    const data: any = {};
    if (updates.status) data.status = updates.status as SubscriptionStatus;
    if (updates.planId) data.plan_id = updates.planId;
    if (updates.endDate) data.current_period_end = updates.endDate;
    if (updates.metadata) data.metadata = updates.metadata;
    data.updated_at = new Date();

    const updated = await this.prisma.subscriptions.update({
      where: { id },
      data,
      include: { plans: true },
    });

    return this.mapToEntity(updated);
  }

  async cancel(id: string): Promise<void> {
    await this.prisma.subscriptions.update({
      where: { id },
      data: { status: 'CANCELED', updated_at: new Date() },
    });
  }

  private mapToEntity(model: any): Subscription {
    let planEntity = undefined;
    if (model.plans) {
        planEntity = new Plan({
            id: model.plans.id,
            code: model.plans.code,
            name: model.plans.name,
            monthlyPrice: model.plans.monthly_price ? Number(model.plans.monthly_price) : undefined,
             // Map other fields as needed
        });
    }

    return new Subscription(
      model.id,
      model.user_id,
      model.scope_type,
      model.scope_id,
      model.plan_id,
      model.status,
      model.current_period_start,
      model.provider_subscription_id || '',
      model.current_period_end,
      model.metadata as Record<string, any>,
      planEntity
    );
  }
}
