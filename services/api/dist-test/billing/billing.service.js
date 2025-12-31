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
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const create_subscription_use_case_1 = require("./application/use-cases/create-subscription.use-case");
const cancel_subscription_use_case_1 = require("./application/use-cases/cancel-subscription.use-case");
const add_payment_method_use_case_1 = require("./application/use-cases/add-payment-method.use-case");
const set_default_payment_method_use_case_1 = require("./application/use-cases/set-default-payment-method.use-case");
const generate_invoice_use_case_1 = require("./application/use-cases/generate-invoice.use-case");
const plans_repository_interface_1 = require("./domain/interfaces/plans.repository.interface");
const plan_entity_1 = require("./domain/entities/plan.entity");
const uuid_1 = require("uuid");
let BillingService = class BillingService {
    constructor(plansRepository, createSubscriptionUseCase, cancelSubscriptionUseCase, addPaymentMethodUseCase, setDefaultPaymentMethodUseCase, generateInvoiceUseCase) {
        this.plansRepository = plansRepository;
        this.createSubscriptionUseCase = createSubscriptionUseCase;
        this.cancelSubscriptionUseCase = cancelSubscriptionUseCase;
        this.addPaymentMethodUseCase = addPaymentMethodUseCase;
        this.setDefaultPaymentMethodUseCase = setDefaultPaymentMethodUseCase;
        this.generateInvoiceUseCase = generateInvoiceUseCase;
    }
    async createSubscription(userId, planId, stripePriceId) {
        return this.createSubscriptionUseCase.execute(userId, planId, stripePriceId);
    }
    async cancelSubscription(subscriptionId) {
        return this.cancelSubscriptionUseCase.execute(subscriptionId);
    }
    async generateInvoice(subscriptionId) {
        return this.generateInvoiceUseCase.execute(subscriptionId);
    }
    async addPaymentMethod(userId, stripePaymentMethodId) {
        return this.addPaymentMethodUseCase.execute(userId, stripePaymentMethodId);
    }
    async setDefaultPaymentMethod(paymentMethodId) {
        return this.setDefaultPaymentMethodUseCase.execute(paymentMethodId);
    }
    async getPlans() {
        return this.plansRepository.findActive();
    }
    async getPlanByCode(code) {
        const plan = await this.plansRepository.findByCode(code);
        if (!plan) {
            throw new common_1.NotFoundException(`Plan ${code} not found`);
        }
        return plan;
    }
    async getPlanById(id) {
        const plan = await this.plansRepository.findById(id);
        if (!plan) {
            throw new common_1.NotFoundException("Plan not found");
        }
        return plan;
    }
    async createPlan(data) {
        const plan = new plan_entity_1.Plan({
            id: (0, uuid_1.v4)(),
            code: data.code,
            name: data.name,
            description: data.description,
            entitlements: data.entitlements,
            monthlyPrice: data.monthlyPrice,
            yearlyPrice: data.yearlyPrice,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        return this.plansRepository.create(plan);
    }
    async updatePlan(id, data) {
        await this.getPlanById(id);
        return this.plansRepository.update(id, {
            name: data.name,
            description: data.description,
            entitlements: data.entitlements,
            monthlyPrice: data.monthlyPrice,
            yearlyPrice: data.yearlyPrice,
            isActive: data.isActive,
        });
    }
    async deletePlan(id) {
        return this.updatePlan(id, { isActive: false });
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(plans_repository_interface_1.IPlansRepository)),
    __metadata("design:paramtypes", [Object, create_subscription_use_case_1.CreateSubscriptionUseCase,
        cancel_subscription_use_case_1.CancelSubscriptionUseCase,
        add_payment_method_use_case_1.AddPaymentMethodUseCase,
        set_default_payment_method_use_case_1.SetDefaultPaymentMethodUseCase,
        generate_invoice_use_case_1.GenerateInvoiceUseCase])
], BillingService);
//# sourceMappingURL=billing.service.js.map