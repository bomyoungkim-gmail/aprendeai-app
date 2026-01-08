import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Flow State Detection (SCRIPT 03 - GAP 8)
 * 
 * Detects when a learner is in "flow state" - deeply engaged and productive.
 * When flow is detected, scaffolding adjustments are suppressed to avoid interruptions.
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

  // Thresholds for flow detection
  private readonly FLOW_THRESHOLD = 0.7;
  private readonly HIGH_VELOCITY_THRESHOLD = 200; // words/min
  private readonly MIN_SESSION_DURATION = 15; // minutes
  private readonly LOOKBACK_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Detect if user is in flow state
   */
  async detectFlowState(
    userId: string,
    contentId: string,
    sessionId: string,
  ): Promise<FlowState> {
    try {
      const signals = await this.gatherSignals(userId, contentId, sessionId);
      const score = this.calculateFlowScore(signals);

      const isInFlow = score >= this.FLOW_THRESHOLD;

      if (isInFlow) {
        this.logger.debug(
          `Flow detected for user ${userId} (score: ${score.toFixed(2)})`,
        );
      }

      return {
        isInFlow,
        confidence: score,
        signals,
        reason: this.getFlowReason(signals, score),
      };
    } catch (error) {
      this.logger.error(`Failed to detect flow state: ${error.message}`);
      // Default to no flow on error (safer to allow interruptions)
      return {
        isInFlow: false,
        confidence: 0,
        signals: {
          readingVelocity: 0,
          doubtCount: 0,
          rehighlightRate: 0,
          sessionDuration: 0,
        },
        reason: 'Error detecting flow',
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
    const now = new Date();
    const lookbackStart = new Date(now.getTime() - this.LOOKBACK_WINDOW_MS);

    // Get session start time
    const session = await this.prisma.reading_sessions.findUnique({
      where: { id: sessionId },
      select: { started_at: true },
    });

    const sessionDuration = session
      ? (now.getTime() - new Date(session.started_at).getTime()) / 60000
      : 0;

    // Get recent events
    const events = await this.prisma.telemetry_events.findMany({
      where: {
        user_id: userId,
        content_id: contentId,
        created_at: { gte: lookbackStart },
      },
      select: {
        event_type: true,
        data: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });

    // Calculate reading velocity (words per minute)
    const progressEvents = events.filter((e) => e.event_type === 'PROGRESS');
    let totalWords = 0;
    if (progressEvents.length > 0) {
      const firstProgress = progressEvents[0].data as any;
      const lastProgress = progressEvents[progressEvents.length - 1]
        .data as any;
      totalWords = (lastProgress?.wordsRead || 0) - (firstProgress?.wordsRead || 0);
    }
    const readingVelocity =
      sessionDuration > 0 ? totalWords / sessionDuration : 0;

    // Count doubts
    const doubtCount = events.filter((e) => e.event_type === 'DOUBT').length;

    // Calculate rehighlight rate
    const highlightEvents = events.filter((e) =>
      ['HIGHLIGHT_CREATED', 'HIGHLIGHT_UPDATED'].includes(e.event_type),
    );
    const updateCount = events.filter(
      (e) => e.event_type === 'HIGHLIGHT_UPDATED',
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
    // Weighted scoring
    const velocityScore = Math.min(
      signals.readingVelocity / this.HIGH_VELOCITY_THRESHOLD,
      1.0,
    );
    const doubtScore = signals.doubtCount === 0 ? 1.0 : 0.0;
    const rehighlightScore = 1.0 - signals.rehighlightRate;
    const durationScore = Math.min(
      signals.sessionDuration / this.MIN_SESSION_DURATION,
      1.0,
    );

    // Weights sum to 1.0
    const score =
      velocityScore * 0.3 +
      doubtScore * 0.3 +
      rehighlightScore * 0.2 +
      durationScore * 0.2;

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Get human-readable reason for flow state
   */
  private getFlowReason(signals: FlowSignals, score: number): string {
    if (score < this.FLOW_THRESHOLD) {
      return 'Not in flow state';
    }

    const reasons: string[] = [];

    if (signals.readingVelocity >= this.HIGH_VELOCITY_THRESHOLD) {
      reasons.push('high reading velocity');
    }
    if (signals.doubtCount === 0) {
      reasons.push('no doubts');
    }
    if (signals.rehighlightRate < 0.1) {
      reasons.push('minimal rehighlights');
    }
    if (signals.sessionDuration >= this.MIN_SESSION_DURATION) {
      reasons.push('sustained engagement');
    }

    return `Flow detected: ${reasons.join(', ')}`;
  }
}
