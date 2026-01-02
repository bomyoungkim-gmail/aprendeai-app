import { Module, Global } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AdminModule } from "../admin/admin.module";
import { ConfigModule } from "@nestjs/config";
import { BillingService } from "./billing.service";
import { SubscriptionService } from "./subscription.service";
import { EntitlementsService } from "./entitlements.service";
import { EnforcementService } from "./enforcement.service";
import { UsageTrackingService } from "./usage-tracking.service";
import { PlanLimitsService } from "./plan-limits.service";
import { BillingController } from "./billing.controller";
import { UserBillingController } from "./user-billing.controller";

// Infrastructure
import { PrismaSubscriptionRepository } from "./infrastructure/repositories/prisma-subscription.repository";
import { ISubscriptionRepository } from "./domain/interfaces/subscription.repository.interface";
import { IInvoiceRepository } from "./domain/interfaces/invoice.repository.interface";
import { IPaymentMethodRepository } from "./domain/interfaces/payment-method.repository.interface";
import { PrismaInvoiceRepository } from "./infrastructure/repositories/prisma-invoice.repository";
import { PrismaPaymentMethodRepository } from "./infrastructure/repositories/prisma-payment-method.repository";
import { IPlansRepository } from "./domain/interfaces/plans.repository.interface";
import { PrismaPlansRepository } from "./infrastructure/repositories/prisma-plans.repository";
import { StripeService } from "./infrastructure/stripe/stripe.service";

// Use Cases
import { CreateSubscriptionUseCase } from "./application/use-cases/create-subscription.use-case";
import { CancelSubscriptionUseCase } from "./application/use-cases/cancel-subscription.use-case";
import { AddPaymentMethodUseCase } from "./application/use-cases/add-payment-method.use-case";
import { SetDefaultPaymentMethodUseCase } from "./application/use-cases/set-default-payment-method.use-case";
import { GenerateInvoiceUseCase } from "./application/use-cases/generate-invoice.use-case";

import { ContentAccessModule } from "../cornell/content-access.module";

@Global()
@Module({
  imports: [PrismaModule, AdminModule, ConfigModule, ContentAccessModule],
  controllers: [BillingController, UserBillingController],
  providers: [
    BillingService,
    SubscriptionService,
    EntitlementsService,
    EnforcementService,
    UsageTrackingService,
    PlanLimitsService,
    StripeService,
    // Repositories
    {
      provide: ISubscriptionRepository,
      useClass: PrismaSubscriptionRepository,
    },
    { provide: IInvoiceRepository, useClass: PrismaInvoiceRepository },
    {
      provide: IPaymentMethodRepository,
      useClass: PrismaPaymentMethodRepository,
    },
    { provide: IPlansRepository, useClass: PrismaPlansRepository },
    // Use Cases
    CreateSubscriptionUseCase,
    CancelSubscriptionUseCase,
    AddPaymentMethodUseCase,
    SetDefaultPaymentMethodUseCase,
    GenerateInvoiceUseCase,
  ],
  exports: [
    BillingService,
    SubscriptionService,
    EntitlementsService,
    EnforcementService,
    UsageTrackingService,
    PlanLimitsService,
    ISubscriptionRepository,
    IInvoiceRepository,
    IPaymentMethodRepository,
    IPlansRepository,
  ],
})
export class BillingModule {}
