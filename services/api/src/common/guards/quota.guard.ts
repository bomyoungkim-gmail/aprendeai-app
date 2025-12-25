import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PlanLimitsService } from "../../billing/plan-limits.service";

@Injectable()
export class QuotaGuard implements CanActivate {
  constructor(
    private planLimits: PlanLimitsService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const metric = this.reflector.get<string>(
      "quota_metric",
      context.getHandler(),
    );

    // No quota check configured
    if (!metric) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    // User not authenticated (should be caught by AuthGuard first)
    if (!userId) return false;

    const hasQuota = await this.planLimits.checkQuota(userId, metric);

    if (!hasQuota) {
      const remaining = await this.planLimits.getRemainingQuota(userId, metric);
      const limits = await this.planLimits.getUserLimits(userId);

      throw new ForbiddenException({
        statusCode: 403,
        message: `Monthly quota exceeded for ${metric}`,
        error: "QUOTA_EXCEEDED",
        metric,
        remaining,
        limit: limits[`${metric}PerMonth`],
        upgradeUrl: "/pricing",
      });
    }

    return true;
  }
}
