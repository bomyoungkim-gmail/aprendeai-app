import { Controller, Get, Post, Put, Param, Body, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReadingSessionsService } from './reading-sessions.service';
import { PrePhaseDto, RecordEventDto, AdvancePhaseDto } from './dto/reading-sessions.dto';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class ReadingSessionsController {
  constructor(private sessionService: ReadingSessionsService) {}

  @Post('contents/:contentId/reading-sessions')
  async startSession(@Param('contentId') contentId: string, @Request() req) {
    return this.sessionService.startSession(req.user.id, contentId);
  }

  @Get('reading-sessions/:id')
  async getSession(@Param('id') id: string, @Request() req) {
    return this.sessionService.getSession(id, req.user.id);
  }

  @Put('reading-sessions/:id/pre')
  async updatePrePhase(
    @Param('id') id: string,
    @Body() dto: PrePhaseDto,
    @Request() req,
  ) {
    return this.sessionService.updatePrePhase(id, req.user.id, dto);
  }

  @Post('reading-sessions/:id/events')
  async recordEvent(@Param('id') id: string, @Body() dto: RecordEventDto) {
    return this.sessionService.recordEvent(id, dto.eventType, dto.payload);
  }

  @Post('reading-sessions/:id/advance')
  async advancePhase(
    @Param('id') id: string,
    @Body() dto: AdvancePhaseDto,
    @Request() req,
  ) {
    return this.sessionService.advancePhase(id, req.user.id, dto.toPhase);
  }
}
