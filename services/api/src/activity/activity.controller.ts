import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

class TrackActivityDto {
  type: 'study' | 'annotation' | 'read' | 'session';
  minutes?: number;
}

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post('track')
  async trackActivity(
    @CurrentUser('sub') userId: string,
    @Body() dto: TrackActivityDto,
  ) {
    await this.activityService.trackActivity(
      userId,
      dto.type,
      dto.minutes,
    );
    return { success: true };
  }

  @Get('heatmap')
  async getHeatmap(
    @CurrentUser('sub') userId: string,
    @Query('days') days?: string,
  ) {
    const daysNum = days ? parseInt(days, 10) : 365;
    return this.activityService.getActivityHeatmap(userId, daysNum);
  }

  @Get('stats')
  async getStats(@CurrentUser('sub') userId: string) {
    return this.activityService.getActivityStats(userId);
  }
}
