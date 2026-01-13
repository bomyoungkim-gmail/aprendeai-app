import {
  Controller,
  Get,
  UseGuards,
  Query,
  ForbiddenException,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { AuthGuard } from "@nestjs/passport";
import { JwtAuthGuard } from "../auth/infrastructure/jwt-auth.guard";
import { CurrentUser } from "../auth/presentation/decorators/current-user.decorator";
import { users } from "@prisma/client";
import { ProgressVisibilityService } from "../common/services/progress-visibility.service";

@ApiTags("Analytics")
@ApiBearerAuth()
@Controller("analytics")
@UseGuards(AuthGuard("jwt"))
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly visibilityService: ProgressVisibilityService,
  ) {}

  @Get("progress")
  @ApiOperation({ summary: "Get student progress (own or supervised)" })
  async getProgress(
    @CurrentUser() user: users,
    @Query("targetUserId") targetUserId?: string,
  ) {
    const userId = targetUserId || user.id;

    // Check visibility permission
    const canView = await this.visibilityService.canViewProgress(
      (user as any).id,
      userId,
      (user as any).institutionId,
      [(user as any).systemRole, (user as any).contextRole],
    );

    if (!canView) {
      throw new ForbiddenException(
        "You do not have permission to view this user's progress",
      );
    }

    return this.analyticsService.getStudentProgress(userId);
  }

  @Get("vocabulary")
  @ApiOperation({ summary: "Get vocabulary list (own or supervised)" })
  async getVocabulary(
    @CurrentUser() user: users,
    @Query("targetUserId") targetUserId?: string,
  ) {
    const userId = targetUserId || user.id;

    const canView = await this.visibilityService.canViewProgress(
      (user as any).id,
      userId,
      (user as any).institutionId,
      [(user as any).systemRole, (user as any).contextRole],
    );

    if (!canView) {
      throw new ForbiddenException(
        "You do not have permission to view this user's vocabulary",
      );
    }

    return this.analyticsService.getVocabularyList(userId);
  }

  @Get("hourly-performance")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get hourly study performance heatmap (own or supervised)",
  })
  async getHourlyPerformance(
    @CurrentUser() user: users,
    @Query("days") days?: string,
    @Query("targetUserId") targetUserId?: string,
  ) {
    const userId = targetUserId || user.id;
    const daysToAnalyze = days ? parseInt(days, 10) : 30;

    const canView = await this.visibilityService.canViewProgress(
      (user as any).id,
      userId,
      (user as any).institutionId,
      [(user as any).systemRole, (user as any).contextRole],
    );

    if (!canView) {
      throw new ForbiddenException(
        "You do not have permission to view this user's performance",
      );
    }

    return this.analyticsService.getHourlyPerformance(userId, daysToAnalyze);
  }

  @Get("quality-overview")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: "Get study quality overview (own or supervised)",
  })
  async getQualityOverview(
    @CurrentUser() user: users,
    @Query("period") period?: string,
    @Query("targetUserId") targetUserId?: string,
  ) {
    const userId = targetUserId || user.id;

    const canView = await this.visibilityService.canViewProgress(
      (user as any).id,
      userId,
      (user as any).institutionId,
      [(user as any).systemRole, (user as any).contextRole],
    );

    if (!canView) {
      throw new ForbiddenException(
        "You do not have permission to view this user's quality overview",
      );
    }

    return this.analyticsService.getQualityOverview(userId, period);
  }
}
