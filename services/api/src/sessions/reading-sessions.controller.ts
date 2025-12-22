import { Controller, Get, Post, Put, Param, Body, Request, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ReadingSessionsService } from './reading-sessions.service';
import { PrePhaseDto, RecordEventDto, AdvancePhaseDto } from './dto/reading-sessions.dto';
import { StartSessionDto, FinishSessionDto } from './dto/start-session.dto';
import { PromptMessageDto } from './dto/prompt-message.dto';
import { SessionsQueryDto } from './dto/sessions-query.dto';

@ApiTags('sessions')
@Controller()
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
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

  /**
   * GET /sessions
   * List user's reading sessions with pagination and filters
   */
  @Get('sessions')
  async getUserSessions(
    @Request() req,
    @Query() query: SessionsQueryDto,
  ) {
    return this.sessionService.getUserSessions(req.user.id, query);
  }

  /**
   * GET /sessions/export
   * Export user sessions to CSV or JSON (LGPD/compliance)
   */
  @ApiOperation({ summary: 'Export session history', description: 'Export all user sessions to CSV or JSON format for data portability (LGPD compliance)' })
  @ApiQuery({ name: 'format', required: false, enum: ['csv', 'json'], description: 'Export format (default: json)' })
  /**
   * GET /sessions/export
   * Export user sessions to CSV or JSON
   */
  @Get('sessions/export')
  async exportSessions(
    @Request() req,
    @Query('format') format: 'csv' | 'json' = 'json',
  ) {
    const result = await this.sessionService.exportSessions(req.user.id, format);
    
    if (format === 'csv') {
      return {
        data: result.csv,
        filename: `sessions_${new Date().toISOString().split('T')[0]}.csv`,
      };
    }
    
    return result;
  }

  /**
   * GET /sessions/analytics
   * Get activity analytics for charts
   */
  @ApiOperation({ summary: 'Get session analytics', description: 'Returns activity metrics and aggregations for visualization (heatmaps, phase distribution)' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
  /**
   * GET /sessions/analytics
   * Get activity analytics for charts
   */
  @Get('sessions/analytics')
  async getAnalytics(
    @Request() req,
    @Query('days') days: string = '30',
  ) {
    return this.sessionService.getActivityAnalytics(req.user.id, parseInt(days));
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
