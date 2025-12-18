import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingService } from './billing.service';
import { SubscriptionService } from './subscription.service';
import { EntitlementsService } from './entitlements.service';
import { EnforcementService } from './enforcement.service';
import { UsageTrackingService } from './usage-tracking.service';
import { PlanLimitsService } from './plan-limits.service';
import { BillingController } from './billing.controller';
import { UserBillingController } from './user-billing.controller';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [BillingController, UserBillingController],
  providers: [
    BillingService,
    SubscriptionService,
    EntitlementsService,
    EnforcementService,
    UsageTrackingService,
    PlanLimitsService,
  ],
  exports: [
    BillingService,
    SubscriptionService,
    EntitlementsService,
    EnforcementService,
    UsageTrackingService,
    PlanLimitsService,
  ],
})
export class BillingModule {}
