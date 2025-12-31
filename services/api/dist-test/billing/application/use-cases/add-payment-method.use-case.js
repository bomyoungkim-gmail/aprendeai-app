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
exports.AddPaymentMethodUseCase = void 0;
const common_1 = require("@nestjs/common");
const payment_method_repository_interface_1 = require("../../domain/interfaces/payment-method.repository.interface");
const stripe_service_1 = require("../../infrastructure/stripe/stripe.service");
const payment_method_entity_1 = require("../../domain/entities/payment-method.entity");
let AddPaymentMethodUseCase = class AddPaymentMethodUseCase {
    constructor(paymentMethodRepo, stripeService) {
        this.paymentMethodRepo = paymentMethodRepo;
        this.stripeService = stripeService;
    }
    async execute(userId, stripePaymentMethodId) {
        const stripeCustomer = await this.stripeService.attachPaymentMethod('cus_placeholder', stripePaymentMethodId);
        const method = new payment_method_entity_1.PaymentMethod(crypto.randomUUID(), userId, 'stripe', '4242', 12, 2030, false, 'encrypted_stripe_id', {});
        return this.paymentMethodRepo.create(method);
    }
};
exports.AddPaymentMethodUseCase = AddPaymentMethodUseCase;
exports.AddPaymentMethodUseCase = AddPaymentMethodUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(payment_method_repository_interface_1.IPaymentMethodRepository)),
    __metadata("design:paramtypes", [Object, stripe_service_1.StripeService])
], AddPaymentMethodUseCase);
//# sourceMappingURL=add-payment-method.use-case.js.map