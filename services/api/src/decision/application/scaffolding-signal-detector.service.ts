import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContentMode } from '@prisma/client';
import {
  ScaffoldingSignal,
  ScaffoldingSignalType,
  ScaffoldingState,
} from '../domain/scaffolding.types';

/**
 * Detecta sinais de performance do aluno e recomenda ajustes de scaffolding.
 * 
 * SCRIPT 03 - Fase 2: Signal-Based Adjustment
 * 
 * Sinais detectados:
 * - Doubt spike (3+ DOUBTs em 5 min)
 * - Checkpoint quality (média de completion_quality)
 * - Quiz accuracy (últimos 3 quizzes)
 * - Deep reading index (via TelemetryAggregator)
 * - Rehighlight rate (GAP 3)
 * 
 * @see scaffolding_fading_plan.md - Fase 2.1
 */
@Injectable()
export class ScaffoldingSignalDetectorService {
  private readonly logger = new Logger(ScaffoldingSignalDetectorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Detecta sinal de ajuste de scaffolding baseado em eventos recentes.
   * 
   * GAP 5: Passa currentState para verificar consecutiveSuccesses.
   * 
   * @param userId - User ID
   * @param contentId - Content ID
   * @param mode - Content mode
   * @param currentState - Current scaffolding state (for GAP 5)
   * @returns Signal with recommended adjustment
   */
  async detectSignal(
    userId: string,
    contentId: string,
    mode: ContentMode,
    currentState: ScaffoldingState,
  ): Promise<ScaffoldingSignal> {
    // Buscar eventos recentes (últimos 10 min)
    const recentEvents = await this.getRecentEvents(userId, contentId);

    // Detectar sinais individuais
    const doubtSpike = this.detectDoubtSpike(recentEvents);
    const checkpointQuality = this.calculateCheckpointQuality(recentEvents);
    const quizAccuracy = await this.getRecentQuizAccuracy(userId);
    const deepReadingIndex = await this.getDeepReadingIndex(userId, contentId);
    const rehighlightRate = await this.getRehighlightRate(userId, contentId); // GAP 3

    this.logger.debug(
      `Signals detected for user ${userId}: doubtSpike=${doubtSpike}, ` +
      `checkpointQuality=${checkpointQuality.toFixed(2)}, ` +
      `quizAccuracy=${quizAccuracy.toFixed(2)}, ` +
      `deepReadingIndex=${deepReadingIndex.toFixed(2)}, ` +
      `rehighlightRate=${rehighlightRate.toFixed(2)}`
    );

    // Avaliar sinais e retornar recomendação
    return this.evaluateSignals(
      {
        doubtSpike,
        checkpointQuality,
        quizAccuracy,
        deepReadingIndex,
        rehighlightRate,
        mode,
      },
      currentState,
    );
  }

  /**
   * Busca eventos recentes (últimos 10 minutos).
   * 
   * @private
   */
  private async getRecentEvents(
    userId: string,
    contentId: string,
  ): Promise<any[]> {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    try {
      return await this.prisma.session_events.findMany({
        where: {
          reading_sessions: {
            user_id: userId,
            content_id: contentId,
          },
          created_at: { gte: tenMinutesAgo },
        },
        orderBy: { created_at: 'desc' },
        take: 100,
      });
    } catch (error) {
      this.logger.warn('Failed to fetch recent events:', error);
      return [];
    }
  }

  /**
   * Detecta spike de dúvidas (3+ DOUBTs em 5 min).
   * 
   * @private
   */
  private detectDoubtSpike(events: any[]): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const recentDoubts = events.filter(
      (e) =>
        e.event_type === 'DOUBT' &&
        new Date(e.created_at) >= fiveMinutesAgo,
    );

    return recentDoubts.length >= 3;
  }

  /**
   * Calcula qualidade média de checkpoints (completion_quality).
   * 
   * @private
   * @returns Quality score (0.0-1.0), defaults to 1.0 if no data
   */
  private calculateCheckpointQuality(events: any[]): number {
    const checkpoints = events.filter(
      (e) => e.event_type === 'CHECKPOINT_ANSWER' && (e.payload_json as any)?.completion_quality,
    );

    if (checkpoints.length === 0) return 1.0; // Sem dados = assume bom

    const totalQuality = checkpoints.reduce(
      (sum, e) => sum + ((e.payload_json as any).completion_quality || 0),
      0,
    );

    return totalQuality / checkpoints.length;
  }

  /**
   * Busca acurácia dos últimos 3 quizzes.
   * 
   * @private
   * @returns Accuracy (0.0-1.0), defaults to 1.0 if no data
   */
  private async getRecentQuizAccuracy(userId: string): Promise<number> {
    try {
      const recentQuizzes = await this.prisma.session_events.findMany({
        where: {
          reading_sessions: { user_id: userId },
          event_type: 'QUIZ_COMPLETE' as any,
        },
        orderBy: { created_at: 'desc' },
        take: 3,
      });

      if (recentQuizzes.length === 0) return 1.0; // Sem dados = assume bom

      const totalCorrect = recentQuizzes.reduce(
        (sum, e) => sum + ((e.payload_json as any)?.correct_count || 0),
        0,
      );
      const totalQuestions = recentQuizzes.reduce(
        (sum, e) => sum + ((e.payload_json as any)?.total_count || 1),
        0,
      );

      return totalCorrect / totalQuestions;
    } catch (error) {
      this.logger.warn('Failed to fetch quiz accuracy:', error);
      return 1.0;
    }
  }

  /**
   * Calcula deep reading index (tempo de leitura contínua).
   * 
   * TODO: Integrar com TelemetryAggregator quando disponível.
   * 
   * @private
   * @returns Deep reading index (0.0-1.0), currently returns 0.5 (placeholder)
   */
  private async getDeepReadingIndex(
    userId: string,
    contentId: string,
  ): Promise<number> {
    // Placeholder: retorna 0.5 (médio)
    // Future: usar TelemetryAggregator.getDeepReadingIndex()
    return 0.5;
  }

  /**
   * GAP 3: Calcula taxa de rehighlights (% de highlights que são re-highlights).
   * 
   * @private
   * @returns Rehighlight rate (0.0-1.0)
   */
  private async getRehighlightRate(
    userId: string,
    contentId: string,
  ): Promise<number> {
    try {
      const highlights = await this.prisma.session_events.findMany({
        where: {
          reading_sessions: {
            user_id: userId,
            content_id: contentId,
          },
          event_type: 'HIGHLIGHT' as any,
        },
        select: {
          payload_json: true,
        },
      });

      if (highlights.length === 0) return 0;

      const rehighlights = highlights.filter(
        (h) => (h.payload_json as any)?.isRehighlight === true,
      );

      return rehighlights.length / highlights.length;
    } catch (error) {
      this.logger.warn('Failed to fetch rehighlight rate:', error);
      return 0;
    }
  }

  /**
   * Avalia sinais e retorna recomendação de ajuste.
   * 
   * GAP 5: Verifica consecutiveSuccesses para fading.
   * GAP 8: Detecta flow state para NARRATIVE mode.
   * 
   * @private
   */
  private evaluateSignals(
    data: {
      doubtSpike: boolean;
      checkpointQuality: number;
      quizAccuracy: number;
      deepReadingIndex: number;
      rehighlightRate: number;
      mode: ContentMode;
    },
    currentState: ScaffoldingState,
  ): ScaffoldingSignal {
    // INCREASE: Sinais de dificuldade
    if (
      data.doubtSpike ||
      data.checkpointQuality < 0.5 ||
      data.quizAccuracy < 0.6 ||
      data.rehighlightRate > 0.3 // GAP 3: >30% de rehighlights
    ) {
      const reason = data.doubtSpike
        ? 'doubt_spike'
        : data.rehighlightRate > 0.3
        ? 'high_rehighlight_rate'
        : 'low_performance';

      this.logger.log(`Signal: INCREASE (${reason})`);

      return {
        type: 'INCREASE',
        reason,
        confidence: 0.8,
        evidence: data,
      };
    }

    // GAP 8: NARRATIVE Flow State Detection
    // When in NARRATIVE mode with high deep reading index and low interruptions,
    // recommend fading to L0 to preserve flow state
    if (data.mode === ContentMode.NARRATIVE) {
      // Flow indicators:
      // - High deep reading index (sustained reading)
      // - No doubts
      // - Low rehighlight rate
      const flowIndicators = {
        sustainedReading: data.deepReadingIndex > 0.6,
        noDoubtSpike: !data.doubtSpike,
        lowRehighlight: data.rehighlightRate < 0.2,
      };

      const flowScore = 
        (flowIndicators.sustainedReading ? 0.4 : 0) +
        (flowIndicators.noDoubtSpike ? 0.3 : 0) +
        (flowIndicators.lowRehighlight ? 0.3 : 0);

      // If flow score is high (>0.7), recommend fading even without 3+ sessions
      // This is NARRATIVE-specific: we prioritize not interrupting flow
      if (flowScore >= 0.7 && currentState.currentLevel > 0) {
        this.logger.log(
          `Signal: DECREASE (narrative_flow_state, score=${flowScore.toFixed(2)})`
        );

        return {
          type: 'DECREASE',
          reason: 'narrative_flow_state',
          confidence: flowScore,
          evidence: {
            ...data,
            flowScore,
            flowIndicators,
          },
        };
      }
    }

    // DECREASE (Fading): Alta performance consistente
    // GAP 5: Exigir 3+ sessões consecutivas
    if (
      data.checkpointQuality > 0.8 &&
      data.quizAccuracy > 0.85 &&
      data.deepReadingIndex > 0.7
    ) {
      const requiredSessions = 3;
      const consecutiveSuccesses = currentState.fadingMetrics.consecutiveSuccesses;

      if (consecutiveSuccesses >= requiredSessions) {
        this.logger.log(
          `Signal: DECREASE (consistent_mastery, ${consecutiveSuccesses} consecutive sessions)`
        );

        return {
          type: 'DECREASE',
          reason: 'consistent_mastery',
          confidence: 0.9,
          evidence: {
            ...data,
            consecutiveSessions: consecutiveSuccesses,
          },
        };
      } else {
        // Performance boa mas ainda não atingiu 3+ sessões
        this.logger.debug(
          `Signal: MAINTAIN (building_consistency, ${consecutiveSuccesses}/${requiredSessions} sessions)`
        );

        return {
          type: 'MAINTAIN',
          reason: 'building_consistency',
          confidence: 0.6,
          evidence: {
            ...data,
            consecutiveSessions: consecutiveSuccesses,
          },
        };
      }
    }

    // Default: MAINTAIN
    this.logger.debug('Signal: MAINTAIN (stable_performance)');

    return {
      type: 'MAINTAIN',
      reason: 'stable_performance',
      confidence: 0.5,
      evidence: data,
    };
  }
}
