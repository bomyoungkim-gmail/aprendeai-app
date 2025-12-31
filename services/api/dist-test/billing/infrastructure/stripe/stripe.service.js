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
var StripeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = require("stripe");
let StripeService = StripeService_1 = class StripeService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(StripeService_1.name);
        const secretKey = this.configService.get('STRIPE_SECRET_KEY');
        if (!secretKey) {
            this.logger.warn('STRIPE_SECRET_KEY not found in environment. Stripe operations will fail.');
            return;
        }
        this.stripe = new stripe_1.default(secretKey, {
            apiVersion: '2023-10-16',
        });
    }
    async createSubscription(customerId, priceId) {
        return this.stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
        });
    }
    async cancelSubscription(subscriptionId) {
        return this.stripe.subscriptions.cancel(subscriptionId);
    }
    async createInvoice(subscriptionId) {
        return this.stripe.invoices.create({
            subscription: subscriptionId,
        });
    }
    async attachPaymentMethod(customerId, paymentMethodId) {
        await this.stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });
        return this.stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });
    }
    async createCustomer(email, name) {
        return this.stripe.customers.create({
            email,
            name,
        });
    }
    async getSubscription(id) {
        return this.stripe.subscriptions.retrieve(id);
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = StripeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeService);
//# sourceMappingURL=stripe.service.js.map