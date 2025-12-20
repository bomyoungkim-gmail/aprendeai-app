import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { RecommendationService } from './recommendation.service';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  /**
   * Get personalized recommendations
   */
  @Get()
  async getRecommendations(@CurrentUser('sub') userId: string) {
    return this.recommendationService.getRecommendations(userId);
  }
}
