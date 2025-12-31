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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateSubscriptionUseCase = void 0;
const common_1 = require("@nestjs/common");
const subscription_repository_interface_1 = require("../../domain/interfaces/subscription.repository.interface");
const stripe_service_1 = require("../../infrastructure/stripe/stripe.service");
const subscription_entity_1 = require("../../domain/entities/subscription.entity");
let CreateSubscriptionUseCase = class CreateSubscriptionUseCase {
    constructor(subscriptionRepo, stripeService) {
        this.subscriptionRepo = subscriptionRepo;
        this.stripeService = stripeService;
    }
    async execute(userId, planId, stripePriceId) {
        const stripeSub = await this.stripeService.createSubscription('cus_placeholder', stripePriceId);
        const subscription = new subscription_entity_1.Subscription(crypto.randomUUID(), userId, 'USER', userId, planId, 'ACTIVE', new Date(), stripeSub.id, undefined, {});
        return this.subscriptionRepo.create(subscription);
    }
};
exports.CreateSubscriptionUseCase = CreateSubscriptionUseCase;
exports.CreateSubscriptionUseCase = CreateSubscriptionUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(subscription_repository_interface_1.ISubscriptionRepository)),
    __metadata("design:paramtypes", [Object, stripe_service_1.StripeService])
], CreateSubscriptionUseCase);
//# sourceMappingURL=create-subscription.use-case.js.map