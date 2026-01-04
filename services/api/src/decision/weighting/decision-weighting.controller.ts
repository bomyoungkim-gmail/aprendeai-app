import { Controller, Post, Body, UseGuards, Logger, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { DcsCalculatorService } from './dcs-calculator.service';
import { CurrentUser } from '../../auth/presentation/decorators/current-user.decorator';


@ApiTags('Decision Weighting')
@Controller('graphs/deterministic')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DecisionWeightingController {
  private readonly logger = new Logger(DecisionWeightingController.name);

  constructor(private readonly dcsService: DcsCalculatorService) {}

  @Post('recalc-dcs')
  @ApiOperation({ summary: 'Manually recalculate DCS for a content' })
  @ApiResponse({ status: 200, description: 'DCS recalculated successfully' })
  async recalcDcs(
    @Body('contentId') contentId: string,
    @CurrentUser() user: any,
  ) {
    this.logger.log(`Manual DCS recalc requested for ${contentId} by ${user.userId}`);
    
    // In production, might want to calculate for specific sections too
    // For now, calculating for the content root
    const result = await this.dcsService.calculateDcs(contentId, 'USER', user.userId);
    await this.dcsService.persistScore(contentId, 'USER', user.userId, result);

    return {
      message: 'DCS recalculation complete',
      result,
      timestamp: new Date(),
    };
  }
}
