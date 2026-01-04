import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { GraphCuratorService } from './graph-curator.service';
import { BatchCurationDto, VoteEdgeDto } from './dto/curation.dto';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';

@Controller('graph/curate')
@UseGuards(JwtAuthGuard)
export class GraphCuratorController {
  constructor(private readonly graphCuratorService: GraphCuratorService) {}

  @Post('promote')
  @HttpCode(HttpStatus.OK)
  async processCuration(@Body() dto: BatchCurationDto) {
    return this.graphCuratorService.processCurationItems(dto);
  }

  @Post('vote')
  @HttpCode(HttpStatus.OK)
  async castVote(@Body() dto: VoteEdgeDto) {
    await this.graphCuratorService.castVote(dto.userId, dto.edgeId, dto.vote, dto.comment);
    return { success: true };
  }
}
