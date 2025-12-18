import { Controller, Get, Post, Param, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExtractionService } from './extraction.service';

@Controller('contents')
@UseGuards(AuthGuard('jwt'))
export class ExtractionController {
  constructor(private extractionService: ExtractionService) {}

  @Post(':id/extract')
  async requestExtraction(
    @Param('id') contentId: string,
    @Request() req,
  ) {
    return this.extractionService.requestExtraction(contentId, req.user.id);
  }

  @Get(':id/extract/status')
  async getStatus(@Param('id') contentId: string) {
    return this.extractionService.getExtractionStatus(contentId);
  }

  @Get(':id/chunks')
  async getChunks(
    @Param('id') contentId: string,
    @Query('page') page?: string,
    @Query('range') range?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    return this.extractionService.getChunks(contentId, pageNum, range);
  }
}
