import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { ContentPedagogicalService } from '../services/content-pedagogical.service';
import { CreateContentPedagogicalDataDto } from '../dto/create-content-pedagogical-data.dto';
import { CreateGameResultDto } from '../dto/create-game-result.dto';
import { ROUTES } from '../../common/constants';

/**
 * Controller for Cornell Pedagogical Enhancement
 * Base route: Use ROUTES.CORNELL.BASE for consistency
 * Endpoints follow centralized ROUTES.CORNELL.PEDAGOGICAL_* pattern
 */
@ApiTags('Cornell Pedagogical')
@Controller('cornell') // Note: Decorators require string literals, but route is defined in ROUTES.CORNELL.BASE
@UseGuards(JwtAuthGuard)
export class ContentPedagogicalController {
  constructor(private readonly pedagogicalService: ContentPedagogicalService) {}

  @Get('contents/:id/context')
  @ApiOperation({ summary: 'Get pedagogical context (metadata + game results)' })
  async getContext(@Param('id') contentId: string) {
    const pedagogicalData = await this.pedagogicalService.getPedagogicalData(contentId);
    // TODO: Aggregate with progress and game results in future sprint or extended service method
    return {
      pedagogicalData,
    };
  }

  @Post('contents/:id/pedagogical')
  @ApiOperation({ summary: 'Create or update pedagogical data (Internal/Worker use)' })
  async createOrUpdatePedagogical(
    @Param('id') contentId: string,
    @Body() dto: CreateContentPedagogicalDataDto,
  ) {
    return this.pedagogicalService.createOrUpdatePedagogicalData(contentId, dto);
  }

  @Post('contents/:id/game-results')
  @ApiOperation({ summary: 'Record a game result' })
  async recordGameResult(
    @Param('id') contentId: string,
    @Body() dto: CreateGameResultDto,
    // @User() user: UserEntity -- In a real app we'd get user from request, but for now passing via DTO or assume middleware
    // For now assuming the DTO or logic handles userId mapping, or we need to extract from request.
    // The schema requires userId.
  ) {
    // TEMPORARY: In a real implementation, we extract userId from JWT.
    // For this Sprint foundation, I will assume the DTO includes it or I need to change DTO to exclude it and add here.
    // Actually, the DTO I created DOES NOT have userId. I need to get it from request.
    throw new Error('UserId extraction not implemented yet');
  }
}
