import { Controller, Get, Put, Query, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "./guards/roles.guard";
import { Roles } from "./decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { MetricsService } from "../observability/metrics.service";
import { ErrorTrackingService } from "../observability/error-tracking.service";
import { ProviderUsageService } from "../observability/provider-usage.service";
import {
  MetricsQueryDto,
  ErrorQueryDto,
  UsageQueryDto,
  OverviewQueryDto,
} from "./dto/dashboard.dto";

@ApiTags("admin-dashboard")
@Controller("admin/dashboard")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class DashboardController {
  constructor(
    private metricsService: MetricsService,
    private errorService: ErrorTrackingService,
    private usageService: ProviderUsageService,
  ) {}

  // ========================================
  // Overview (Main Dashboard)
  // ========================================

  @Get("overview")
  @Roles(UserRole.ADMIN, UserRole.OPS, UserRole.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get dashboard overview (last 24h by default)" })
  async getOverview(@Query() query: OverviewQueryDto) {
    const hours = query.hours || 24;
    const from = new Date(Date.now() - hours * 60 * 60 * 1000);
    const to = new Date();

    const [requestStats, errorStats, usageStats, recentErrors] =
      await Promise.all([
        this.metricsService.getStats("api_request", from, to),
        this.metricsService.getStats("api_latency", from, to),
        this.usageService.getUsageStats({ from, to }),
        this.errorService.getErrors({ from, to, resolved: false, limit: 10 }),
      ]);

    return {
      period: { from, to, hours },
      requests: {
        total: requestStats._sum.value || 0,
        count: requestStats._count || 0,
      },
      latency: {
        avg: Math.round(errorStats._avg.value || 0),
        max: Math.round(errorStats._max.value || 0),
        min: Math.round(errorStats._min.value || 0),
      },
      usage: usageStats,
      errors: {
        total: recentErrors.length,
        unresolved: recentErrors.filter((e) => !e.resolved).length,
        recent: recentErrors.slice(0, 5),
      },
    };
  }

  // ========================================
  // Metrics
  // ========================================

  @Get("metrics")
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get time-series metrics" })
  async getMetrics(@Query() query: MetricsQueryDto) {
    const from = new Date(query.from);
    const to = new Date(query.to);

    return this.metricsService.getMetrics({
      metric: query.metric,
      from,
      to,
      bucket: query.bucket,
    });
  }

  @Get("metrics/stats")
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get aggregated metric stats" })
  async getMetricStats(
    @Query("metric") metric: string,
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    return this.metricsService.getStats(metric, new Date(from), new Date(to));
  }

  // ========================================
  // Errors
  // ========================================

  @Get("errors")
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get error logs" })
  async getErrors(@Query() query: ErrorQueryDto) {
    const filters: any = {};

    if (query.from) filters.from = new Date(query.from);
    if (query.to) filters.to = new Date(query.to);
    if (query.resolved !== undefined) filters.resolved = query.resolved;
    if (query.endpoint) filters.endpoint = query.endpoint;
    if (query.limit) filters.limit = query.limit;

    return this.errorService.getErrors(filters);
  }

  @Get("errors/:id")
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get error details" })
  async getErrorDetails(@Param("id") id: string) {
    return this.errorService.getErrorDetails(id);
  }

  @Get("errors/by-endpoint")
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get errors grouped by endpoint" })
  async getErrorsByEndpoint(
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    return this.errorService.getErrorsByEndpoint(new Date(from), new Date(to));
  }

  @Put("errors/:id/resolve")
  @Roles(UserRole.ADMIN, UserRole.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Mark error as resolved" })
  async markErrorResolved(@Param("id") id: string) {
    return this.errorService.markResolved(id);
  }

  // ========================================
  // Provider Usage
  // ========================================

  @Get("usage")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get provider usage stats" })
  async getUsage(@Query() query: UsageQueryDto) {
    return this.usageService.getUsageStats({
      provider: query.provider,
      from: new Date(query.from),
      to: new Date(query.to),
    });
  }

  @Get("usage/by-provider")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get usage breakdown by provider" })
  async getUsageByProvider(
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    return this.usageService.getUsageByProvider(new Date(from), new Date(to));
  }

  @Get("usage/recent")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get recent provider calls" })
  async getRecentCalls(
    @Query("provider") provider?: string,
    @Query("limit") limit?: number,
  ) {
    return this.usageService.getRecentCalls(
      provider,
      limit ? Number(limit) : 50,
    );
  }
}
