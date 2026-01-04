import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { GraphComparatorService } from './graph-comparator.service';
import { CompareGraphsDto } from './dto/compare-graphs.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';

@Controller('graph/diff')
@UseGuards(JwtAuthGuard)
export class GraphComparatorController {
  constructor(private readonly graphComparatorService: GraphComparatorService) {}

  @Post('run')
  @HttpCode(HttpStatus.OK)
  async compareGraphs(@Body() dto: CompareGraphsDto) {
    return this.graphComparatorService.compareGraphs(dto.userId, dto.contentId);
  }
}
