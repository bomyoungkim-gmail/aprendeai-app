"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaSubscriptionRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const subscription_entity_1 = require("../../domain/entities/subscription.entity");
const plan_entity_1 = require("../../domain/entities/plan.entity");
let PrismaSubscriptionRepository = class PrismaSubscriptionRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(subscription) {
        const created = await this.prisma.subscriptions.create({
            data: {
                id: subscription.id,
                user_id: subscription.userId,
                scope_type: subscription.scopeType,
                scope_id: subscription.scopeId,
                plan_id: subscription.planId,
                status: subscription.status,
                source: 'INTERNAL',
                current_period_start: subscription.startDate,
                provider_subscription_id: subscription.stripeSubscriptionId,
                metadata: subscription.metadata,
                updated_at: new Date(),
            },
        });
        return this.mapToEntity(created);
    }
    async findById(id) {
        const subscription = await this.prisma.subscriptions.findUnique({
            where: { id },
            include: { plans: true },
        });
        if (!subscription)
            return null;
        return this.mapToEntity(subscription);
    }
    async findActiveByScope(scopeType, scopeId) {
        const subscription = await this.prisma.subscriptions.findFirst({
            where: {
                scope_type: scopeType,
                scope_id: scopeId,
                status: { in: ['ACTIVE', 'TRIALING', 'GRACE_PERIOD'] },
            },
            include: { plans: true },
            orderBy: { created_at: 'desc' },
        });
        return subscription ? this.mapToEntity(subscription) : null;
    }
    async hasActiveSubscription(scopeType, scopeId) {
        const count = await this.prisma.subscriptions.count({
            where: {
                scope_type: scopeType,
                scope_id: scopeId,
                status: { in: ['ACTIVE', 'TRIALING', 'GRACE_PERIOD'] },
            },
        });
        return count > 0;
    }
    async findMany(params) {
        const found = await this.prisma.subscriptions.findMany(Object.assign(Object.assign({}, params), { include: { plans: true } }));
        return found.map(s => this.mapToEntity(s));
    }
    async update(id, updates) {
        const data = {};
        if (updates.status)
            data.status = updates.status;
        if (updates.planId)
            data.plan_id = updates.planId;
        if (updates.endDate)
            data.current_period_end = updates.endDate;
        if (updates.metadata)
            data.metadata = updates.metadata;
        data.updated_at = new Date();
        const updated = await this.prisma.subscriptions.update({
            where: { id },
            data,
            include: { plans: true },
        });
        return this.mapToEntity(updated);
    }
    async cancel(id) {
        await this.prisma.subscriptions.update({
            where: { id },
            data: { status: 'CANCELED', updated_at: new Date() },
        });
    }
    mapToEntity(model) {
        let planEntity = undefined;
        if (model.plans) {
            planEntity = new plan_entity_1.Plan({
                id: model.plans.id,
                code: model.plans.code,
                name: model.plans.name,
                monthlyPrice: model.plans.monthly_price ? Number(model.plans.monthly_price) : undefined,
            });
        }
        return new subscription_entity_1.Subscription(model.id, model.user_id, model.scope_type, model.scope_id, model.plan_id, model.status, model.current_period_start, model.provider_subscription_id || '', model.current_period_end, model.metadata, planEntity);
    }
};
exports.PrismaSubscriptionRepository = PrismaSubscriptionRepository;
exports.PrismaSubscriptionRepository = PrismaSubscriptionRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaSubscriptionRepository);
//# sourceMappingURL=prisma-subscription.repository.js.map