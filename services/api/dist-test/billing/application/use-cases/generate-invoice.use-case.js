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
exports.GenerateInvoiceUseCase = void 0;
const common_1 = require("@nestjs/common");
const subscription_repository_interface_1 = require("../../domain/interfaces/subscription.repository.interface");
const invoice_repository_interface_1 = require("../../domain/interfaces/invoice.repository.interface");
const stripe_service_1 = require("../../infrastructure/stripe/stripe.service");
const invoice_entity_1 = require("../../domain/entities/invoice.entity");
let GenerateInvoiceUseCase = class GenerateInvoiceUseCase {
    constructor(subscriptionRepo, invoiceRepo, stripeService) {
        this.subscriptionRepo = subscriptionRepo;
        this.invoiceRepo = invoiceRepo;
        this.stripeService = stripeService;
    }
    async execute(subscriptionId) {
        const sub = await this.subscriptionRepo.findById(subscriptionId);
        if (!sub)
            throw new common_1.NotFoundException('Subscription not found');
        const stripeInvoice = await this.stripeService.createInvoice(sub.stripeSubscriptionId);
        const invoice = new invoice_entity_1.Invoice(crypto.randomUUID(), subscriptionId, stripeInvoice.amount_due / 100, stripeInvoice.currency.toUpperCase(), new Date(stripeInvoice.period_start * 1000), new Date(stripeInvoice.period_end * 1000), 'PAID', stripeInvoice.id, {});
        return this.invoiceRepo.create(invoice);
    }
};
exports.GenerateInvoiceUseCase = GenerateInvoiceUseCase;
exports.GenerateInvoiceUseCase = GenerateInvoiceUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(subscription_repository_interface_1.ISubscriptionRepository)),
    __param(1, (0, common_1.Inject)(invoice_repository_interface_1.IInvoiceRepository)),
    __metadata("design:paramtypes", [Object, Object, stripe_service_1.StripeService])
], GenerateInvoiceUseCase);
//# sourceMappingURL=generate-invoice.use-case.js.map