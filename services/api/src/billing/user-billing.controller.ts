import { Controller, Get, Query, UseGuards, Request } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { SubscriptionService } from "./subscription.service";
import { EntitlementsService } from "./entitlements.service";
import { UsageTrackingService } from "./usage-tracking.service";
import { UsageRangeDto } from "./dto/billing.dto";

@ApiTags("user-billing")
@Controller("me")
@UseGuards(AuthGuard("jwt"))
export class UserBillingController {
  constructor(
    private subscriptionService: SubscriptionService,
    private entitlementsService: EntitlementsService,
    private usageTrackingService: UsageTrackingService,
  ) {}

  @Get("subscription")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my current subscription" })
  async getMySubscription(@Request() req) {
    return this.subscriptionService.getActiveSubscription(
      "USER",
      req.user.userId,
    );
  }

  @Get("entitlements")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my current entitlements" })
  async getMyEntitlements(@Request() req) {
    return this.entitlementsService.resolve(
      "USER",
      req.user.userId,
      (process.env.NODE_ENV as any) || "DEVELOPMENT",
    );
  }

  @Get("usage")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my usage stats" })
  async getMyUsage(@Request() req, @Query() dto: UsageRangeDto) {
    return this.usageTrackingService.getUsageStats(
      "USER",
      req.user.userId,
      dto.range || "today",
    );
  }
}
