import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ScopeType, Environment } from "@prisma/client";
import { EntitlementsService } from "./entitlements.service";

export class LimitExceededException extends HttpException {
  constructor(data: {
    metric: string;
    limit: number;
    current: number;
    upgradeHint?: boolean;
  }) {
    super(
      {
        statusCode: 429,
        error: "Too Many Requests",
        message: `Limit exceeded for ${data.metric}`,
        code: "LIMIT_EXCEEDED",
        ...data,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class FeatureDisabledException extends HttpException {
  constructor(feature: string) {
    super(
      {
        statusCode: 403,
        error: "Forbidden",
        message: `Feature '${feature}' is not enabled in your plan`,
        code: "FEATURE_DISABLED",
        feature,
        upgradeHint: true,
      },
      HttpStatus.FORBIDDEN,
    );
  }
}

@Injectable()
export class EnforcementService {
  constructor(
    private prisma: PrismaService,
    private entitlementsService: EntitlementsService,
  ) {}

  /**
   * Require feature (throws if disabled)
   */
  async requireFeature(
    scopeType: ScopeType,
    scopeId: string,
    featureKey: string,
    environment: Environment,
  ) {
    const entitlements = await this.entitlementsService.resolve(
      scopeType,
      scopeId,
      environment,
    );

    const enabled = entitlements.features[featureKey];

    if (!enabled) {
      throw new FeatureDisabledException(featureKey);
    }

    return true;
  }

  /**
   * Enforce limit (throws if exceeded)
   */
  async enforceLimit(
    scopeType: ScopeType,
    scopeId: string,
    metric: string,
    quantity: number,
    environment: Environment,
  ) {
    const entitlements = await this.entitlementsService.resolve(
      scopeType,
      scopeId,
      environment,
    );

    const limit = entitlements.limits[metric];

    if (limit === undefined) {
      // No limit defined - allow
      return;
    }

    if (limit === -1) {
      // Unlimited
      return;
    }

    // Get current usage (today for daily metrics, month for monthly)
    const current = await this.getCurrentUsage(
      scopeType,
      scopeId,
      metric,
      environment,
    );

    if (current + quantity > limit) {
      throw new LimitExceededException({
        metric,
        limit,
        current,
        upgradeHint: true,
      });
    }

    return true;
  }

  /**
   * Get current usage for metric
   */
  private async getCurrentUsage(
    scopeType: ScopeType,
    scopeId: string,
    metric: string,
    environment: Environment,
  ): Promise<number> {
    // Determine time range based on metric suffix
    let startDate: Date;

    if (metric.endsWith("_per_day")) {
      // Today
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
    } else if (metric.endsWith("_per_month")) {
      // This month
      startDate = new Date();
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // All time
      startDate = new Date(0);
    }

    const result = await this.prisma.usage_events.aggregate({
      where: {
        scope_type: scopeType,
        scope_id: scopeId,
        metric: metric.replace("_per_day", "").replace("_per_month", ""),
        environment,
        occurred_at: {
          gte: startDate,
        },
      },
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity || 0;
  }

  /**
   * Check if limit would be exceeded (without throwing)
   */
  async wouldExceedLimit(
    scopeType: ScopeType,
    scopeId: string,
    metric: string,
    quantity: number,
    environment: Environment,
  ): Promise<{ exceeded: boolean; current: number; limit: number }> {
    try {
      await this.enforceLimit(
        scopeType,
        scopeId,
        metric,
        quantity,
        environment,
      );
      const current = await this.getCurrentUsage(
        scopeType,
        scopeId,
        metric,
        environment,
      );
      const entitlements = await this.entitlementsService.resolve(
        scopeType,
        scopeId,
        environment,
      );
      return {
        exceeded: false,
        current,
        limit: entitlements.limits[metric] || -1,
      };
    } catch (error) {
      if (error instanceof LimitExceededException) {
        return {
          exceeded: true,
          current: (error.getResponse() as any).current,
          limit: (error.getResponse() as any).limit,
        };
      }
      throw error;
    }
  }

  /**
   * Enforce limit across hierarchy (returns effective scope)
   * Tries scopes in order. Returns the first one that has quota/permission.
   */
  async enforceHierarchy(
    hierarchy: { scopeType: ScopeType; scopeId: string }[],
    metric: string,
    quantity: number,
    environment: Environment,
  ): Promise<{ scopeType: ScopeType; scopeId: string }> {
    let lastError: any;

    for (const scope of hierarchy) {
      try {
        await this.enforceLimit(
          scope.scopeType,
          scope.scopeId,
          metric,
          quantity,
          environment,
        );
        return scope; // Success
      } catch (error) {
        // If limit exceeded or feature missing or subscription missing, try next
        lastError = error;
      }
    }

    // If we get here, all failed. Throw the last error (likely limit exceeded of the final fallback)
    throw (
      lastError || new LimitExceededException({ metric, limit: 0, current: 0 })
    );
  }

  /**
   * Require feature across hierarchy (returns effective scope)
   */
  async requireFeatureHierarchy(
    hierarchy: { scopeType: ScopeType; scopeId: string }[],
    featureKey: string,
    environment: Environment,
  ): Promise<{ scopeType: ScopeType; scopeId: string }> {
    let lastError: any;

    for (const scope of hierarchy) {
      try {
        await this.requireFeature(
          scope.scopeType,
          scope.scopeId,
          featureKey,
          environment,
        );
        return scope; // Found enabled
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new FeatureDisabledException(featureKey);
  }
}
