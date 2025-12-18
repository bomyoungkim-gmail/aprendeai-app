import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BillingService } from './billing.service';
import { SubscriptionService } from './subscription.service';
import { EntitlementsService } from './entitlements.service';
import { EnforcementService } from './enforcement.service';
import { UsageTrackingService } from './usage-tracking.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    BillingService,
    SubscriptionService,
    EntitlementsService,
    EnforcementService,
    UsageTrackingService,
  ],
  exports: [
    BillingService,
    SubscriptionService,
    EntitlementsService,
    EnforcementService,
    UsageTrackingService,
  ],
})
export class BillingModule {}
