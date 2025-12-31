import { Controller, Get, Post, Body, Query, UseGuards } from "@nestjs/common";
import { ActivityService } from "./activity.service";
import { JwtAuthGuard } from "../auth/infrastructure/jwt-auth.guard";
import { CurrentUser } from "../auth/presentation/decorators/current-user.decorator";
import { IsEnum, IsNumber, IsOptional } from "class-validator";

class TrackActivityDto {
  @IsEnum(["study", "annotation", "read", "session"])
  type: "study" | "annotation" | "read" | "session";

  @IsOptional()
  @IsNumber()
  minutes?: number;
}

@Controller("activity")
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post("track")
  async trackActivity(
    @CurrentUser("id") userId: string,
    @Body() dto: TrackActivityDto,
  ) {
    await this.activityService.trackActivity(userId, dto.type, dto.minutes);
    return { success: true };
  }

  @Get("heatmap")
  async getHeatmap(
    @CurrentUser("id") userId: string,
    @Query("days") days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 365;
    return this.activityService.getActivityHeatmap(userId, daysNum);
  }

  @Get("stats")
  async getStats(@CurrentUser("id") userId: string) {
    return this.activityService.getActivityStats(userId);
  }
}
