import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('progress')
  getProgress(@Request() req: any) {
    return this.analyticsService.getStudentProgress(req.user.id);
  }

  @Get('vocabulary')
  getVocabulary(@Request() req: any) {
    return this.analyticsService.getVocabularyList(req.user.id);
  }
}
