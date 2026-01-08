import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/infrastructure/jwt-auth.guard';
import { ContentModeAnalyticsService } from './content-mode-analytics.service';

/**
 * Content Mode Analytics Controller (Script 02 Enhancement)
 * Provides insights into content mode distribution and usage
 */
@Controller('analytics/content-modes')
@UseGuards(JwtAuthGuard)
export class ContentModeAnalyticsController {
  constructor(
    private readonly analyticsService: ContentModeAnalyticsService,
  ) {}

  /**
   * Get content mode distribution statistics
   * Returns count by mode and mode source
   */
  @Get('distribution')
  async getModeDistribution(@Request() req) {
    const userId = req.user.id;
    return this.analyticsService.getModeDistribution(userId);
  }

  /**
   * Get mode distribution for specific institution (admin only)
   */
  @Get('distribution/institution/:institutionId')
  async getInstitutionModeDistribution(
    @Request() req,
    // @Param('institutionId') institutionId: string,
  ) {
    // TODO: Add admin guard
    // return this.analyticsService.getInstitutionModeDistribution(institutionId);
    return { message: 'Not implemented yet' };
  }
}
