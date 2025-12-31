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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SubscriptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionService = void 0;
const common_1 = require("@nestjs/common");
const billing_service_1 = require("./billing.service");
const subscription_repository_interface_1 = require("./domain/interfaces/subscription.repository.interface");
const plans_repository_interface_1 = require("./domain/interfaces/plans.repository.interface");
const subscription_entity_1 = require("./domain/entities/subscription.entity");
const plan_entity_1 = require("./domain/entities/plan.entity");
const uuid_1 = require("uuid");
let SubscriptionService = SubscriptionService_1 = class SubscriptionService {
    constructor(subscriptionRepository, plansRepository, billingService) {
        this.subscriptionRepository = subscriptionRepository;
        this.plansRepository = plansRepository;
        this.billingService = billingService;
        this.logger = new common_1.Logger(SubscriptionService_1.name);
    }
    async createFreeSubscription(userId) {
        let freePlan = await this.plansRepository.findByCode("FREE");
        if (!freePlan) {
            this.logger.warn("FREE plan not found, seeding...");
            const newPlan = new plan_entity_1.Plan({
                id: (0, uuid_1.v4)(),
                code: "FREE",
                name: "Free Plan",
                entitlements: {
                    limits: { storageMb: 100, projects: 1, collaborators: 0 },
                    features: { canExport: false },
                },
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            freePlan = await this.plansRepository.create(newPlan);
        }
        const existing = await this.subscriptionRepository.findActiveByScope("USER", userId);
        if (existing)
            return existing;
        const newSub = new subscription_entity_1.Subscription((0, uuid_1.v4)(), userId, "USER", userId, freePlan.id, "ACTIVE", new Date(), "", undefined, undefined, freePlan);
        return this.subscriptionRepository.create(newSub);
    }
    async createInitialSubscription(scopeType, scopeId) {
        if (scopeType === "USER")
            return this.createFreeSubscription(scopeId);
        return null;
    }
    async hasActiveSubscription(scopeType, scopeId) {
        return this.subscriptionRepository.hasActiveSubscription(scopeType, scopeId);
    }
    async assignPlan(scopeType, scopeId, planCode, adminUserId, reason) {
        return {
            status: "implemented_soon",
            subscription: { id: "mock-subscription-id" },
            before: null,
            after: null,
        };
    }
    async getSubscriptions(filters) {
        return this.subscriptionRepository.findMany(filters);
    }
    async getActiveSubscription(scopeType, scopeId) {
        const subscription = await this.subscriptionRepository.findActiveByScope(scopeType, scopeId);
        if (!subscription) {
            throw new common_1.InternalServerErrorException({
                code: "SUBSCRIPTION_MISSING",
                message: `No active subscription found for ${scopeType}:${scopeId}`,
            });
        }
        return subscription;
    }
    async getSubscriptionById(id) {
        const subscription = await this.subscriptionRepository.findById(id);
        if (!subscription) {
            throw new common_1.NotFoundException("Subscription not found");
        }
        return subscription;
    }
    async cancelSubscription(subscriptionId, immediate = false, reason) {
        return { status: "canceled", effectiveDate: new Date() };
    }
};
exports.SubscriptionService = SubscriptionService;
exports.SubscriptionService = SubscriptionService = SubscriptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(subscription_repository_interface_1.ISubscriptionRepository)),
    __param(1, (0, common_1.Inject)(plans_repository_interface_1.IPlansRepository)),
    __metadata("design:paramtypes", [Object, Object, billing_service_1.BillingService])
], SubscriptionService);
//# sourceMappingURL=subscription.service.js.map