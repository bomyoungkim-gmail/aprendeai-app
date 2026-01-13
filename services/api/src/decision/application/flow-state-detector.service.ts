import { Injectable, Logger, Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { PrismaService } from "../../prisma/prisma.service";
import { TelemetryService } from "../../telemetry/telemetry.service";
import { TelemetryEventType } from "../../telemetry/domain/telemetry.constants";
import {
  FLOW_THRESHOLDS,
  READING_VELOCITY_THRESHOLDS,
  SESSION_DURATION_THRESHOLDS,
  LOOKBACK_WINDOWS,
  FLOW_SCORE_WEIGHTS,
  CACHE_TTL,
  REHIGHLIGHT_THRESHOLDS,
} from "../domain/decision.constants";

/**
 * Flow State Detection (SCRIPT 03 - GAP 8)
 *
 * Detects when a learner is in "flow state" - deeply engaged and productive.
 * When flow is detected, scaffolding adjustments are suppressed to avoid interruptions.
 *
 * TODO (P2): A supressão em estados de alta performance (FLOW) é uma otimização futura.
 * Considerar ajustes mode-specific nos thresholds e emissão de eventos FLOW_STATE_CHANGE
 * para telemetria e análise de impacto no aprendizado.
 *
 * TODO (P3): Otimizações Futuras
 * - Mode-specific thresholds: Ajustar thresholds de flow por ContentMode
 *   (ex: NARRATIVE pode ter threshold mais baixo, DIDACTIC mais alto)
 * - Telemetria de flow: Emitir eventos FLOW_STATE_CHANGE para análise
 *   (track transitions, duration in flow, correlation with learning outcomes)
 * - Dashboard de flow: Visualizar métricas de flow no analytics
 *   (flow frequency, average duration, impact on completion rates)
 * - A/B testing: Comparar aprendizado com/sem HIGH_FLOW suppression
 *   (measure retention, engagement, and learning outcomes)
 */

export interface FlowSignals {
  readingVelocity: number; // words per minute
  doubtCount: number; // doubts in last 10 minutes
  rehighlightRate: number; // percentage of rehighlights
  sessionDuration: number; // minutes of continuous reading
}

export interface FlowState {
  isInFlow: boolean;
  confidence: number; // 0.0-1.0
  signals: FlowSignals;
  reason?: string;
}

@Injectable()
export class FlowStateDetectorService {
  private readonly logger = new Logger(FlowStateDetectorService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly telemetryService: TelemetryService,
  ) {}

  /**
   * Detect if user is in flow state (Cached)
   *
   * @param userId - User UUID
   * @param contentId - Content UUID
   * @param sessionId - Session UUID
   * @param requestId - Optional correlation ID for logging
   */
  async detectFlowState(
    userId: string,
    contentId: string,
    sessionId: string,
    requestId?: string,
  ): Promise<FlowState> {
    // P1: Validate UUIDs
    if (!this.isValidUUID(userId) || !this.isValidUUID(sessionId)) {
      this.logger.warn(
        `Invalid UUID provided: userId=${userId}, sessionId=${sessionId}`,
        { requestId, userId, sessionId },
      );
      return this.getDefaultFlowState();
    }
    const cacheKey = `flow_state:${userId}:${sessionId}`;
    const cached = await this.cacheManager.get<FlowState>(cacheKey);

    if (cached) {
      this.logger.debug(`Flow state cached for ${userId}`);
      return cached;
    }

    try {
      const signals = await this.gatherSignals(userId, contentId, sessionId);
      const score = this.calculateFlowScore(signals);

      const isInFlow = score >= FLOW_THRESHOLDS.HIGH_FLOW;

      if (isInFlow) {
        this.logger.debug(
          `Flow detected for user ${userId} (score: ${score.toFixed(2)})`,
          { requestId, userId, sessionId, score, signals },
        );

        // P1: Emit flow state metrics
        await this.emitFlowMetrics(
          userId,
          sessionId,
          contentId,
          score,
          signals,
        );
      }

      const flowState = {
        isInFlow,
        confidence: score,
        signals,
        reason: this.getFlowReason(signals, score),
      };

      // Cache the result
      await this.cacheManager.set(cacheKey, flowState, CACHE_TTL.FLOW_STATE);

      return flowState;
    } catch (error) {
      this.logger.error(`Failed to detect flow state: ${error.message}`);
      // Default to no flow on error
      return {
        isInFlow: false,
        confidence: 0,
        signals: {
          readingVelocity: 0,
          doubtCount: 0,
          rehighlightRate: 0,
          sessionDuration: 0,
        },
        reason: "Error detecting flow",
      };
    }
  }

  /**
   * Gather flow signals from telemetry
   */
  private async gatherSignals(
    userId: string,
    contentId: string,
    sessionId: string,
  ): Promise<FlowSignals> {
    const now = Date.now();
    const lookbackStart = now - LOOKBACK_WINDOWS.FLOW_DETECTION;

    // Get session start time
    const session = await this.prisma.reading_sessions.findUnique({
      where: { id: sessionId },
      select: { started_at: true },
    });

    const sessionDuration = session
      ? (now - new Date(session.started_at).getTime()) / 60000
      : 0;

    // Get recent events
    const events = await this.prisma.telemetry_events.findMany({
      where: {
        user_id: userId,
        content_id: contentId,
        created_at: { gte: new Date(lookbackStart) },
      },
      select: {
        event_type: true,
        data: true,
        created_at: true,
      },
      orderBy: { created_at: "asc" },
    });

    // Calculate reading velocity (words per minute)
    const progressEvents = events.filter((e) => e.event_type === "PROGRESS");
    let totalWords = 0;
    if (progressEvents.length > 0) {
      const firstProgress = progressEvents[0].data as any;
      const lastProgress = progressEvents[progressEvents.length - 1]
        .data as any;
      totalWords =
        (lastProgress?.wordsRead || 0) - (firstProgress?.wordsRead || 0);
    }
    const readingVelocity =
      sessionDuration > 0 ? totalWords / sessionDuration : 0;

    // Count doubts
    const doubtCount = events.filter((e) => e.event_type === "DOUBT").length;

    // Calculate rehighlight rate
    const highlightEvents = events.filter((e) =>
      ["HIGHLIGHT_CREATED", "HIGHLIGHT_UPDATED"].includes(e.event_type),
    );
    const updateCount = events.filter(
      (e) => e.event_type === "HIGHLIGHT_UPDATED",
    ).length;
    const rehighlightRate =
      highlightEvents.length > 0 ? updateCount / highlightEvents.length : 0;

    return {
      readingVelocity,
      doubtCount,
      rehighlightRate,
      sessionDuration,
    };
  }

  /**
   * Calculate flow score from signals (0.0-1.0)
   */
  private calculateFlowScore(signals: FlowSignals): number {
    // 1. Reading Velocity (30%)
    const velocityScore =
      Math.min(
        signals.readingVelocity / READING_VELOCITY_THRESHOLDS.DEFAULT,
        1.0,
      ) * FLOW_SCORE_WEIGHTS.VELOCITY;

    // 2. Absence of Doubts (30%)
    const doubtScore = signals.doubtCount === 0 ? FLOW_SCORE_WEIGHTS.DOUBTS : 0;

    // 3. Low Rehighlight Rate (20%)
    const rehighlightScore =
      signals.rehighlightRate < REHIGHLIGHT_THRESHOLDS.LOW
        ? FLOW_SCORE_WEIGHTS.REHIGHLIGHT
        : 0;

    // 4. Session Duration (20%)
    const durationScore =
      Math.min(
        signals.sessionDuration / SESSION_DURATION_THRESHOLDS.MIN_FOR_FLOW,
        1.0,
      ) * FLOW_SCORE_WEIGHTS.DURATION;

    // Weights sum to 1.0
    const score = velocityScore + doubtScore + rehighlightScore + durationScore;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get human-readable reason for flow state
   */
  private getFlowReason(signals: FlowSignals, score: number): string {
    const indicators: string[] = [];

    if (score < FLOW_THRESHOLDS.HIGH_FLOW) {
      return "Not in flow state";
    }

    // High reading velocity
    if (signals.readingVelocity > READING_VELOCITY_THRESHOLDS.DEFAULT) {
      indicators.push("high reading velocity");
    }
    if (signals.doubtCount === 0) {
      indicators.push("no doubts");
    }
    // Low rehighlight rate
    if (signals.rehighlightRate < REHIGHLIGHT_THRESHOLDS.LOW) {
      indicators.push("minimal rehighlights");
    }
    // Sustained engagement
    if (signals.sessionDuration > SESSION_DURATION_THRESHOLDS.MIN_FOR_FLOW) {
      indicators.push("sustained engagement");
    }

    return `Flow detected: ${indicators.join(", ")}`;
  }

  /**
   * P1: Validate if string is a valid UUID
   */
  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * P1: Get default flow state for error cases
   */
  private getDefaultFlowState(): FlowState {
    return {
      isInFlow: false,
      confidence: 0,
      signals: {
        readingVelocity: 0,
        doubtCount: 0,
        rehighlightRate: 0,
        sessionDuration: 0,
      },
      reason: "Invalid input or error",
    };
  }

  /**
   * P1: Emit flow state metrics for observability
   */
  private async emitFlowMetrics(
    userId: string,
    sessionId: string,
    contentId: string,
    confidence: number,
    signals: FlowSignals,
  ): Promise<void> {
    try {
      await this.telemetryService.track(
        {
          eventType: TelemetryEventType.FLOW_STATE_DETECTED,
          eventVersion: "1.0.0",
          contentId,
          sessionId,
          data: {
            confidence,
            readingVelocity: signals.readingVelocity,
            doubtCount: signals.doubtCount,
            rehighlightRate: signals.rehighlightRate,
            sessionDuration: signals.sessionDuration,
          },
        },
        userId,
      );
    } catch (error) {
      // Don't fail flow detection if telemetry fails
      this.logger.warn(`Failed to emit flow metrics: ${error.message}`, {
        userId,
        sessionId,
        error,
      });
    }
  }
}
