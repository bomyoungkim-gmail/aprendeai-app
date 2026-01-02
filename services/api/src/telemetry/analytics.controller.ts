import { Controller, Get, Param, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/infrastructure/jwt-auth.guard';
import { SessionMetricsDto, DailyEngagementDto, GlobalStatsDto } from './dto/analytics-response.dto';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class TelemetryAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: 'Get global analytics stats' })
  @ApiResponse({ status: 200, type: GlobalStatsDto })
  @Get('stats')
  async getGlobalStats(@Query('range') range: '7d' | '30d' | '90d'): Promise<GlobalStatsDto> {
    return this.analyticsService.getGlobalStats(range || '30d');
  }

  @ApiOperation({ summary: 'Get aggregated metrics for a specific content' })
  @ApiResponse({ status: 200, type: SessionMetricsDto })
  @Get('session/:contentId')
  async getSessionMetrics(
    @Param('contentId') contentId: string,
    @Req() req,
  ): Promise<SessionMetricsDto> {
    return this.analyticsService.getSessionMetrics(contentId, req.user.id);
  }

  @ApiOperation({ summary: 'Get daily engagement stats for current user' })
  @ApiResponse({ status: 200, type: DailyEngagementDto })
  @Get('daily')
  async getDailyStats(@Req() req): Promise<DailyEngagementDto> {
    return this.analyticsService.getDailyStats(req.user.id);
  }
}
