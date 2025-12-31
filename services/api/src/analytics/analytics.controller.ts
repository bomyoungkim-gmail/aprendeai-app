import { Controller, Get, UseGuards, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { AuthGuard } from "@nestjs/passport";
import { JwtAuthGuard } from "../auth/infrastructure/jwt-auth.guard";
import { CurrentUser } from "../auth/presentation/decorators/current-user.decorator";
import { users } from "@prisma/client";

@ApiTags("Analytics")
@ApiBearerAuth()
@Controller("analytics")
@UseGuards(AuthGuard("jwt"))
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("progress")
  getProgress(@CurrentUser() user: users) {
    return this.analyticsService.getStudentProgress(user.id);
  }

  @Get("vocabulary")
  getVocabulary(@CurrentUser() user: users) {
    return this.analyticsService.getVocabularyList(user.id);
  }

  @Get("hourly-performance")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get hourly study performance heatmap for user",
  })
  async getHourlyPerformance(
    @CurrentUser() user: users,
    @Query("days") days?: string,
  ) {
    const daysToAnalyze = days ? parseInt(days, 10) : 30;
    return this.analyticsService.getHourlyPerformance(user.id, daysToAnalyze);
  }

  @Get("quality-overview")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get study quality overview for user",
  })
  async getQualityOverview(
    @CurrentUser() user: users,
    @Query("period") period?: string,
  ) {
    return this.analyticsService.getQualityOverview(user.id, period);
  }
}
