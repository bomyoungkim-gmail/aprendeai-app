import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecisionService } from '../../decision/application/decision.service';
import { SrsService } from '../../srs/srs.service';
import { AssessmentService } from '../../assessment/assessment.service';
import { ReadingSessionsService } from '../../sessions/reading-sessions.service';
import { NextActionDto } from '../dto/next-action.dto';

/**
 * Learning Orchestrator Service
 * 
 * Aggregates learning actions from multiple sources:
 * - Decision Engine (interventions)
 * - SRS System (vocabulary reviews)
 * - Assessment System (checkpoints)
 * 
 * Returns a prioritized list of "next actions" for the user.
 */
@Injectable()
export class LearningOrchestratorService {
  private readonly logger = new Logger(LearningOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly decisionService: DecisionService,
    private readonly srsService: SrsService,
    private readonly assessmentService: AssessmentService,
    private readonly sessionsService: ReadingSessionsService,
  ) {}

  /**
   * Get next actions for a session
   * Returns top 3 prioritized actions
   */
  async getNextActions(sessionId: string, userId: string): Promise<NextActionDto[]> {
    this.logger.debug(`Getting next actions for session ${sessionId}`);

    // Fetch session context
    const session = await this.prisma.reading_sessions.findUnique({
      where: { id: sessionId },
      include: {
        contents: {
          select: {
            id: true,
            mode: true,
            title: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // Aggregate candidates from all sources
    const candidates: NextActionDto[] = [];

    // 1. Get SRS reviews
    const srsActions = await this.getSrsActions(userId);
    candidates.push(...srsActions);

    // 2. Get interventions from Decision Engine
    const interventionActions = await this.getInterventionActions(
      sessionId,
      userId,
      session.contents.id,
    );
    candidates.push(...interventionActions);

    // 3. Get pending checkpoints (if any)
    const checkpointActions = await this.getCheckpointActions(
      sessionId,
      userId,
      session.contents.id,
    );
    candidates.push(...checkpointActions);

    // 4. Add default navigation if no other actions
    if (candidates.length === 0) {
      candidates.push(this.getDefaultNavigationAction());
    }

    // Sort by priority (descending) and return top 3
    const sorted = candidates.sort((a, b) => b.priority - a.priority);
    const topActions = sorted.slice(0, 3);

    this.logger.debug(
      `Returning ${topActions.length} actions (from ${candidates.length} candidates)`,
    );

    return topActions;
  }

  /**
   * Get SRS review actions
   */
  private async getSrsActions(userId: string): Promise<NextActionDto[]> {
    try {
      const dueItems = await this.srsService.getDueItems(userId, 5);

      return dueItems.map((item) => {
        const isOverdue = item.due_at < new Date();
        const priority = isOverdue ? 80 : 50;

        return {
          id: `srs_${item.id}`,
          type: 'SRS_REVIEW' as const,
          priority,
          title: `Revisar: ${item.word}`,
          description: `Revisão agendada para ${item.srs_stage}`,
          reasonCode: isOverdue ? 'SRS_OVERDUE' : 'SRS_DUE',
          payload: {
            vocabId: item.id,
            word: item.word,
            stage: item.srs_stage,
            dueAt: item.due_at,
          },
          icon: '📚',
          actionLabel: 'Revisar Agora',
          isBlocking: false,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to get SRS actions: ${error.message}`);
      return [];
    }
  }

  /**
   * Get intervention actions from Decision Engine
   */
  private async getInterventionActions(
    sessionId: string,
    userId: string,
    contentId: string,
  ): Promise<NextActionDto[]> {
    try {
      // Get recent session stats for signal enrichment
      const stats = await this.sessionsService.getRecentSessionStats(sessionId, 15);

      // Call Decision Engine with enriched signals
      const decision = await this.decisionService.makeDecision({
        userId,
        sessionId,
        contentId,
        uiPolicyVersion: '1.0.0',
        signals: {
          doubtsInWindow: stats.doubtsCount,
          flowState: stats.doubtsCount > 3 ? 'LOW_FLOW' : 'FLOW',
          explicitUserAction: undefined,
          checkpointFailures: 0,
          summaryQuality: undefined,
        },
      });

      // If decision is NO_OP, return empty
      if (decision.action === 'NO_OP') {
        return [];
      }

      // Map decision to NextAction
      const priority = this.getInterventionPriority(decision.reason);

      return [
        {
          id: `intervention_${Date.now()}`,
          type: 'INTERVENTION' as const,
          priority,
          title: this.getInterventionTitle(decision.action),
          description: this.getInterventionDescription(decision.reason),
          reasonCode: decision.reason,
          payload: {
            action: decision.action,
            channel: decision.channel,
            ...decision.payload,
          },
          icon: '💡',
          actionLabel: 'Ver Sugestão',
          isBlocking: false,
        },
      ];
    } catch (error) {
      this.logger.error(`Failed to get intervention actions: ${error.message}`);
      return [];
    }
  }

  /**
   * Get checkpoint actions
   */
  private async getCheckpointActions(
    sessionId: string,
    userId: string,
    contentId: string,
  ): Promise<NextActionDto[]> {
    try {
      const pendingCheckpoints = await this.assessmentService.getPendingCheckpoints(
        userId,
        contentId,
      );

      return pendingCheckpoints.map((checkpoint: any) => ({
        id: `checkpoint_${checkpoint.id}`,
        type: 'CHECKPOINT' as const,
        priority: 90, // BLOCKER
        title: 'Checkpoint Pendente',
        description: `Avaliação obrigatória para ${checkpoint.schooling_level_target}`,
        reasonCode: 'CHECKPOINT_REQUIRED',
        payload: {
          assessmentId: checkpoint.id,
          contentId: checkpoint.content_id,
        },
        icon: '✅',
        actionLabel: 'Iniciar Checkpoint',
        isBlocking: true,
      }));
    } catch (error) {
      this.logger.error(`Failed to get checkpoint actions: ${error.message}`);
      return [];
    }
  }

  /**
   * Get default navigation action
   */
  private getDefaultNavigationAction(): NextActionDto {
    return {
      id: 'nav_default',
      type: 'CONTENT_NAV' as const,
      priority: 10,
      title: 'Continuar Leitura',
      description: 'Avançar para a próxima seção',
      reasonCode: 'DEFAULT_NAV',
      payload: {},
      icon: '➡️',
      actionLabel: 'Continuar',
      isBlocking: false,
    };
  }

  /**
   * Map decision reason to priority
   */
  private getInterventionPriority(reason: string): number {
    switch (reason) {
      case 'DOUBT_SPIKE':
      case 'CHECKPOINT_FAIL':
        return 75; // URGENT
      case 'LOW_MASTERY':
        return 70; // URGENT
      case 'POST_SUMMARY':
        return 50; // NORMAL
      default:
        return 40; // NORMAL
    }
  }

  /**
   * Get intervention title
   */
  private getInterventionTitle(action: string): string {
    switch (action) {
      case 'ASK_PROMPT':
        return 'Sugestão de Reflexão';
      case 'ASSIGN_MISSION':
        return 'Missão Disponível';
      case 'GUIDED_SYNTHESIS':
        return 'Síntese Guiada';
      default:
        return 'Intervenção Sugerida';
    }
  }

  /**
   * Get intervention description
   */
  private getInterventionDescription(reason: string): string {
    switch (reason) {
      case 'DOUBT_SPIKE':
        return 'Detectamos dificuldade. Que tal uma dica?';
      case 'CHECKPOINT_FAIL':
        return 'Vamos reforçar esse conceito';
      case 'LOW_MASTERY':
        return 'Prática adicional recomendada';
      case 'POST_SUMMARY':
        return 'Hora de consolidar o aprendizado';
      default:
        return 'Ação recomendada pelo sistema';
    }
  }

  /**
   * Submit checkpoint answer
   * Delegates to AssessmentService
   */
  async submitCheckpointAnswer(
    userId: string,
    assessmentId: string,
    dto: { answers: any[]; sessionId?: string },
  ) {
    return this.assessmentService.submitAssessment(userId, assessmentId, dto);
  }
}
