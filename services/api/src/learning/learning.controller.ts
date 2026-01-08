import { Controller, Get, Post, Query, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/infrastructure/jwt-auth.guard';
import { CurrentUser } from '../auth/presentation/decorators/current-user.decorator';
import { LearningOrchestratorService } from './application/learning-orchestrator.service';
import { ReadingSessionsService } from '../sessions/reading-sessions.service';
import { NextActionsResponseDto } from './dto/next-action.dto';
import { CheckpointAnswerDto, InterventionActionDto } from './dto/learning-action.dto';

@ApiTags('learning')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('learning')
export class LearningController {
  private readonly logger = new Logger(LearningController.name);

  constructor(
    private readonly orchestrator: LearningOrchestratorService,
    private readonly sessionsService: ReadingSessionsService,
  ) {}

  @Get('next')
  @ApiOperation({ summary: 'Get next learning actions for a session' })
  @ApiResponse({ status: 200, description: 'Returns prioritized list of next actions' })
  async getNext(
    @Query('sessionId') sessionId: string,
    @CurrentUser() user: any,
  ): Promise<NextActionsResponseDto> {
    this.logger.log(`Getting next actions for session ${sessionId}`);

    const actions = await this.orchestrator.getNextActions(sessionId, user.id);

    return {
      actions,
      sessionId,
      timestamp: new Date(),
    };
  }

  @Post('checkpoint/answer')
  @ApiOperation({ summary: 'Submit checkpoint answer' })
  @ApiResponse({ status: 200, description: 'Answer submitted successfully' })
  async submitCheckpointAnswer(
    @Body() dto: CheckpointAnswerDto,
    @CurrentUser() user: any,
    @Query('sessionId') sessionId?: string,
  ) {
    this.logger.log(`Checkpoint answer submitted: ${dto.checkpointId}`);

    // Use sessionId from DTO or query param
    const effectiveSessionId = dto.sessionId || sessionId || 'unknown';

    // Submit to AssessmentService
    // Submit to AssessmentService (returns { attempt, missedSkills })
    // Note: Orchestrator might need type update if strict, but runtime is fine.
    // Casting to any to avoid strict type checks until Orchestrator interface is updated, or update orchestrator too.
    const result: any = await this.orchestrator.submitCheckpointAnswer(
      user.id,
      dto.checkpointId,
      {
        answers: dto.answers,
        sessionId: effectiveSessionId,
      },
    );

    // Support both legacy (Attempt) and new ({ attempt, missedSkills }) returns
    const attempt = result.attempt || result;
    const missedSkills = result.missedSkills || [];

    // Calculate status based on Mastery Learning principles
    // 90-100%: Mastery (Congratulations)
    // 0-89%: Growth Opportunity (Ask if satisfied)
    const score = attempt.scorePercent || 0;
    const isMastery = score >= 90;
    
    // We treat 'passed' as technically valid to proceed (soft floor), 
    // but the UI should encourage retry if not mastery.
    const passed = true; 

    let feedback = '';
    let recommendation: 'CONTINUE' | 'RETRY' = 'CONTINUE';

    if (isMastery) {
      feedback = 'Parabéns! Você demonstrou domínio total deste tópico.';
      recommendation = 'CONTINUE';
    } else {
      feedback = `Você atingiu ${Math.round(score)}%. Está satisfeito com esse resultado ou gostaria de tentar novamente para dominar o assunto?`;
       
      // Add Hints if available
      if (missedSkills && missedSkills.length > 0) {
        // Take top 3 missed skills/topics
        const topics = missedSkills.slice(0, 3).join(', ');
        feedback += ` Sugerimos revisar os seguintes conceitos: ${topics}.`;
      }

      recommendation = 'RETRY';
    }

    return {
      success: true,
      attemptId: attempt.id,
      score,
      scoreRaw: attempt.scoreRaw,
      passed, // Technical unlock
      recommendation, // UI hints: emphasize 'Retry' button if 'RETRY'
      feedback,
      checkpointId: dto.checkpointId,
    };
  }

  @Post('intervention/act')
  @ApiOperation({ summary: 'Record intervention action' })
  @ApiResponse({ status: 200, description: 'Action recorded successfully' })
  async recordInterventionAction(
    @Body() dto: InterventionActionDto,
    @CurrentUser() user: any,
    @Query('sessionId') sessionId: string,
  ) {
    this.logger.log(`Intervention action: ${dto.action} for ${dto.interventionId}`);

    // Record intervention response as session event
    await this.sessionsService.recordEvent(sessionId, 'INTERVENTION_RESPONSE', {
      interventionId: dto.interventionId,
      action: dto.action,
      outcome: dto.outcome,
      userId: user.id,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Intervention response recorded',
      interventionId: dto.interventionId,
      action: dto.action,
    };
  }
}
