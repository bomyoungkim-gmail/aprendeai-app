import { Controller, Get, Post, Put, Param, Body, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReadingSessionsService } from './reading-sessions.service';
import { PrePhaseDto, RecordEventDto, AdvancePhaseDto } from './dto/reading-sessions.dto';
import { StartSessionDto, FinishSessionDto } from './dto/start-session.dto';
import { PromptMessageDto } from './dto/prompt-message.dto';

@Controller()
@UseGuards(AuthGuard('jwt'))
export class ReadingSessionsController {
  constructor(private sessionService: ReadingSessionsService) {}

  // ============================================
  // NEW: Prompt-Only Endpoints (Phase 1)
  // ============================================

  /**
   * POST /sessions/start
   * Creates a new reading session with initial prompt
   */
  @Post('sessions/start')
  async startSessionPromptOnly(
    @Body() dto: StartSessionDto,
    @Request() req,
  ) {
    return this.sessionService.startSessionPromptOnly(req.user.id, dto);
  }

  /**
   * POST /sessions/:id/prompt
   * Main prompt-only interaction endpoint
   * Parses quick commands, persists events, calls AI Service
   */
  @Post('sessions/:id/prompt')
  async sendPrompt(
    @Param('id') sessionId: string,
    @Body() dto: PromptMessageDto,
    @Request() req,
  ) {
    return this.sessionService.processPrompt(sessionId, dto, req.user.id);
  }

  /**
   * POST /sessions/:id/finish
   * Marks session as finished and triggers outcome computation
   */
  @Post('sessions/:id/finish')
  async finishSessionPromptOnly(
    @Param('id') sessionId: string,
    @Body() dto: FinishSessionDto,
    @Request() req,
  ) {
    return this.sessionService.finishSessionPromptOnly(sessionId, req.user.id, dto);
  }

  // ============================================
  // Existing Endpoints (Legacy - keep for now)
  // ============================================

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
