import { PrismaService } from '../../../prisma/prisma.service';
import { ISubscriptionRepository } from '../../domain/interfaces/subscription.repository.interface';
import { Subscription } from '../../domain/entities/subscription.entity';
export declare class PrismaSubscriptionRepository implements ISubscriptionRepository {
    private prisma;
    constructor(prisma: PrismaService);
    create(subscription: Subscription): Promise<Subscription>;
    findById(id: string): Promise<Subscription | null>;
    findActiveByScope(scopeType: string, scopeId: string): Promise<Subscription | null>;
    hasActiveSubscription(scopeType: string, scopeId: string): Promise<boolean>;
    findMany(params: any): Promise<Subscription[]>;
    update(id: string, updates: Partial<Subscription>): Promise<Subscription>;
    cancel(id: string): Promise<void>;
    private mapToEntity;
}
