import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiQuery,
} from "@nestjs/swagger";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "./guards/roles.guard";
import { Roles } from "./decorators/roles.decorator";
import { SystemRole } from "@prisma/client";
import { TokenAnalyticsService } from "../analytics/token-analytics.service";

@ApiTags("admin-analytics")
@Controller("admin/ai")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class AiAnalyticsController {
  constructor(private readonly analyticsService: TokenAnalyticsService) {}

  @Get("overview")
  @Roles(SystemRole.ADMIN, SystemRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get aggregated AI usage metrics" })
  async getOverview(
    @Query("from") fromStr?: string,
    @Query("to") toStr?: string,
  ) {
    const { from, to } = this.parseDateRange(fromStr, toStr);
    return this.analyticsService.getAggregatedMetrics(from, to);
  }

  @Get("evolution")
  @Roles(SystemRole.ADMIN, SystemRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get AI usage evolution over time" })
  @ApiQuery({ name: "interval", enum: ["day", "hour"], required: false })
  async getEvolution(
    @Query("from") fromStr?: string,
    @Query("to") toStr?: string,
    @Query("interval") interval: "day" | "hour" = "day",
  ) {
    const { from, to } = this.parseDateRange(fromStr, toStr);
    return this.analyticsService.getEvolution(from, to, interval);
  }

  @Get("distribution")
  @Roles(SystemRole.ADMIN, SystemRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get AI usage distribution by dimension" })
  @ApiQuery({
    name: "dimension",
    enum: ["provider", "model", "feature", "operation"],
  })
  async getDistribution(
    @Query("dimension")
    dimension: "provider" | "model" | "feature" | "operation",
    @Query("from") fromStr?: string,
    @Query("to") toStr?: string,
  ) {
    const { from, to } = this.parseDateRange(fromStr, toStr);
    return this.analyticsService.getDistribution(dimension, from, to);
  }

  @Get("top-consumers")
  @Roles(SystemRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Identify top AI consumers" })
  @ApiQuery({ name: "entity", enum: ["user", "family", "institution"] })
  async getTopConsumers(
    @Query("entity") entity: "user" | "family" | "institution",
    @Query("limit") limit: number = 10,
    @Query("from") fromStr?: string,
    @Query("to") toStr?: string,
  ) {
    const { from, to } = this.parseDateRange(fromStr, toStr);
    return this.analyticsService.getTopConsumers(entity, from, to, limit);
  }

  private parseDateRange(fromStr?: string, toStr?: string) {
    const to = toStr ? new Date(toStr) : new Date();
    const from = fromStr
      ? new Date(fromStr)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
    return { from, to };
  }
}
