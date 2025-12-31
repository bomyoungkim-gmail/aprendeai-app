"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const admin_module_1 = require("../admin/admin.module");
const config_1 = require("@nestjs/config");
const billing_service_1 = require("./billing.service");
const subscription_service_1 = require("./subscription.service");
const entitlements_service_1 = require("./entitlements.service");
const enforcement_service_1 = require("./enforcement.service");
const usage_tracking_service_1 = require("./usage-tracking.service");
const plan_limits_service_1 = require("./plan-limits.service");
const billing_controller_1 = require("./billing.controller");
const user_billing_controller_1 = require("./user-billing.controller");
const prisma_subscription_repository_1 = require("./infrastructure/repositories/prisma-subscription.repository");
const subscription_repository_interface_1 = require("./domain/interfaces/subscription.repository.interface");
const invoice_repository_interface_1 = require("./domain/interfaces/invoice.repository.interface");
const payment_method_repository_interface_1 = require("./domain/interfaces/payment-method.repository.interface");
const prisma_invoice_repository_1 = require("./infrastructure/repositories/prisma-invoice.repository");
const prisma_payment_method_repository_1 = require("./infrastructure/repositories/prisma-payment-method.repository");
const plans_repository_interface_1 = require("./domain/interfaces/plans.repository.interface");
const prisma_plans_repository_1 = require("./infrastructure/repositories/prisma-plans.repository");
const stripe_service_1 = require("./infrastructure/stripe/stripe.service");
const create_subscription_use_case_1 = require("./application/use-cases/create-subscription.use-case");
const cancel_subscription_use_case_1 = require("./application/use-cases/cancel-subscription.use-case");
const add_payment_method_use_case_1 = require("./application/use-cases/add-payment-method.use-case");
const set_default_payment_method_use_case_1 = require("./application/use-cases/set-default-payment-method.use-case");
const generate_invoice_use_case_1 = require("./application/use-cases/generate-invoice.use-case");
let BillingModule = class BillingModule {
};
exports.BillingModule = BillingModule;
exports.BillingModule = BillingModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, admin_module_1.AdminModule, config_1.ConfigModule],
        controllers: [billing_controller_1.BillingController, user_billing_controller_1.UserBillingController],
        providers: [
            billing_service_1.BillingService,
            subscription_service_1.SubscriptionService,
            entitlements_service_1.EntitlementsService,
            enforcement_service_1.EnforcementService,
            usage_tracking_service_1.UsageTrackingService,
            plan_limits_service_1.PlanLimitsService,
            stripe_service_1.StripeService,
            { provide: subscription_repository_interface_1.ISubscriptionRepository, useClass: prisma_subscription_repository_1.PrismaSubscriptionRepository },
            { provide: invoice_repository_interface_1.IInvoiceRepository, useClass: prisma_invoice_repository_1.PrismaInvoiceRepository },
            { provide: payment_method_repository_interface_1.IPaymentMethodRepository, useClass: prisma_payment_method_repository_1.PrismaPaymentMethodRepository },
            { provide: plans_repository_interface_1.IPlansRepository, useClass: prisma_plans_repository_1.PrismaPlansRepository },
            create_subscription_use_case_1.CreateSubscriptionUseCase,
            cancel_subscription_use_case_1.CancelSubscriptionUseCase,
            add_payment_method_use_case_1.AddPaymentMethodUseCase,
            set_default_payment_method_use_case_1.SetDefaultPaymentMethodUseCase,
            generate_invoice_use_case_1.GenerateInvoiceUseCase,
        ],
        exports: [
            billing_service_1.BillingService,
            subscription_service_1.SubscriptionService,
            entitlements_service_1.EntitlementsService,
            enforcement_service_1.EnforcementService,
            usage_tracking_service_1.UsageTrackingService,
            plan_limits_service_1.PlanLimitsService,
            subscription_repository_interface_1.ISubscriptionRepository,
            invoice_repository_interface_1.IInvoiceRepository,
            payment_method_repository_interface_1.IPaymentMethodRepository,
            plans_repository_interface_1.IPlansRepository,
        ],
    })
], BillingModule);
//# sourceMappingURL=billing.module.js.map