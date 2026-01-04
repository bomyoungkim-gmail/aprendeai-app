import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TelemetryEventType } from '../domain/telemetry.constants';
import { ContentMode } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

/**
 * Telemetry Aggregator Service
 * 
 * Processes raw telemetry_events into high-level KPIs for learning optimization.
 * Implements formulas for Deep Reading Index, UI Load Index, Completion Quality, and Transfer Index.
 */
// ... (interfaces remain same)

export interface SessionAnalytics {
  deep_reading_index: number;
  ui_load_index: number;
  completion_quality: number;
  transfer_index?: number;
  metadata?: {
    total_events: number;
    session_duration_minutes: number;
    mode?: string;
  };
}

export interface ContentAnalytics {
  transfer_index: number;
  total_missions_assigned: number;
  total_missions_completed: number;
  avg_completion_score: number;
}

@Injectable()
export class TelemetryAggregatorService {
  private readonly logger = new Logger(TelemetryAggregatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Scheduled job to aggregate metrics for recently finished sessions
   * Runs every 10 minutes
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCronAggregation() {
    this.logger.log('Starting scheduled telemetry aggregation...');
    
    // Simple robust query: Find sessions finished in the last 24h that haven't been aggregated yet
    // We assume once aggregated, it doesn't need re-aggregation for now.
    const targetSessions = await this.prisma.reading_sessions.findMany({
      where: {
        finished_at: {
          not: null, // Session is finished
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24h
        },
        aggregated_at: null, // Not yet aggregated
      },
      orderBy: { finished_at: 'desc' },
      take: 20,
    });

    this.logger.log(`Found ${targetSessions.length} sessions to aggregate.`);

    for (const session of targetSessions) {
      try {
        await this.aggregateSessionMetrics(session.id);
      } catch (error) {
        this.logger.error(`Failed to aggregate session ${session.id}`, error);
      }
    }
  }

  /**
   * Aggregate metrics for a specific session
   */
  async aggregateSessionMetrics(sessionId: string): Promise<SessionAnalytics> {
    this.logger.debug(`Aggregating metrics for session: ${sessionId}`);

    // Fetch all events for this session
    const events = await this.prisma.telemetry_events.findMany({
      where: { session_id: sessionId },
      orderBy: { created_at: 'asc' },
    });

    if (events.length === 0) {
      this.logger.warn(`No events found for session: ${sessionId}`);
      return this.getDefaultAnalytics();
    }

    // Get session info for mode-specific thresholds
    const session = await this.prisma.reading_sessions.findFirst({
      where: { id: sessionId },
      include: { contents: { select: { mode: true } } },
    });

    const mode = session?.contents?.mode;
    const userId = session?.user_id;
    const sessionDurationMs = session?.finished_at
      ? session.finished_at.getTime() - session.started_at.getTime()
      : Date.now() - session.started_at.getTime();
    const sessionDurationMinutes = sessionDurationMs / (1000 * 60);

    // Get thresholds (with policy overrides if available)
    const thresholds = userId ? await this.getThresholds(userId, mode) : this.getDefaultThresholds(mode);

    // Calculate individual indices
    const deepReadingIndex = this.calculateDeepReadingIndex(events, mode, thresholds);
    const uiLoadIndex = this.calculateUILoadIndex(events, sessionDurationMinutes, thresholds);
    const completionQuality = this.calculateCompletionQuality(events);

    const analytics: SessionAnalytics = {
      deep_reading_index: deepReadingIndex,
      ui_load_index: uiLoadIndex,
      completion_quality: completionQuality,
      metadata: {
        total_events: events.length,
        session_duration_minutes: sessionDurationMinutes,
        mode: mode || undefined,
      },
    };

    // Persist to database
    if (session) {
      await this.prisma.reading_sessions.update({
        where: { id: sessionId },
        data: {
          analytics_json: analytics as any,
          aggregated_at: new Date(),
        },
      });
    }

    return analytics;
  }

  /**
   * Aggregate metrics for a specific content
   */
  async aggregateContentMetrics(contentId: string): Promise<ContentAnalytics> {
    this.logger.debug(`Aggregating metrics for content: ${contentId}`);

    // Get all mission assignments for this content
    const missions = await this.prisma.transfer_attempts.findMany({
      where: { content_id: contentId },
      include: { transfer_missions: true },
    });

    const totalAssigned = missions.length;
    // Map status 'COMPLETED' to completion concept
    const completed = missions.filter((m) => m.status === 'COMPLETED');
    const totalCompleted = completed.length;

    // Calculate average score (using 'score' column directly)
    const scoresSum = completed.reduce((sum, m) => {
      const score = m.score || 0;
      return sum + score;
    }, 0);
    const avgScore = totalCompleted > 0 ? scoresSum / totalCompleted : 0;

    // Transfer index: weighted by completion rate and quality
    const completionRate = totalAssigned > 0 ? totalCompleted / totalAssigned : 0;
    const transferIndex = completionRate * (avgScore / 100) * 100;

    return {
      transfer_index: transferIndex,
      total_missions_assigned: totalAssigned,
      total_missions_completed: totalCompleted,
      avg_completion_score: avgScore,
    };
  }

  /**
   * Get aggregation thresholds with policy overrides
   * 
   * Merges default thresholds with institutional overrides from decision_policy_json
   */
  private async getThresholds(userId: string, mode?: ContentMode | null) {
    // 1. Get default thresholds
    const defaults = this.getDefaultThresholds(mode);

    try {
      // 2. Fetch policy overrides
      const policy = await this.prisma.family_policies.findFirst({
        where: {
          learner_user_id: userId
        },
        select: { decision_policy_json: true }
      });

      const overrides = (policy?.decision_policy_json as any)?.telemetry_thresholds?.[mode || 'DIDACTIC'];

      // 3. Deep merge
      if (overrides) {
        this.logger.debug(`Applying policy overrides for mode ${mode}`);
        return {
          deep_reading: { ...defaults.deep_reading, ...overrides.deep_reading },
          ui_load: { ...defaults.ui_load, ...overrides.ui_load },
          completion: { ...defaults.completion, ...overrides.completion },
        };
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch policy overrides: ${error.message}`);
    }

    return defaults;
  }

  /**
   * Get default thresholds based on content mode
   */
  private getDefaultThresholds(mode?: ContentMode | null) {
    const isTechnical = mode === 'TECHNICAL' || mode === 'SCIENTIFIC';

    return {
      deep_reading: {
        backtrack_tolerance: isTechnical ? 2.0 : 1.0,
        switch_tolerance: isTechnical ? 0.3 : 0.15,
      },
      ui_load: {
        max_toolbox_opens: 5,
        max_context_switches: 3,
      },
      completion: {
        min_cornell_notes: 2,
        min_micro_checks: 3,
      },
    };
  }

  /**
   * Calculate Deep Reading Index
   * 
   * Formula: Composite of dwell stability (low variance), backtrack rate (low), and context switch rate (low)
   * Higher score = better deep reading
   */
  private calculateDeepReadingIndex(
    events: any[],
    mode?: ContentMode | null,
    thresholds?: any,
  ): number {
    const sectionViewed = events.filter(
      (e) => e.event_type === TelemetryEventType.SECTION_VIEWED,
    );
    const scrollPattern = events.filter(
      (e) => e.event_type === TelemetryEventType.SCROLL_PATTERN,
    );
    const contextSwitch = events.filter(
      (e) => e.event_type === TelemetryEventType.CONTEXT_SWITCH,
    );

    if (sectionViewed.length === 0) return 0;

    // 1. Dwell stability (lower variance = better)
    const dwellTimes = sectionViewed.map((e) => (e.data as any).dwellMs || 0);
    const avgDwell = dwellTimes.reduce((a, b) => a + b, 0) / dwellTimes.length;
    const variance =
      dwellTimes.reduce((sum, val) => sum + Math.pow(val - avgDwell, 2), 0) /
      dwellTimes.length;
    const dwellStability = Math.max(0, 100 - Math.sqrt(variance) / 100);

    // 2. Backtrack rate (lower = better)
    const totalBacktracks = scrollPattern.reduce(
      (sum, e) => sum + ((e.data as any).backtrackCount || 0),
      0,
    );
    const backtrackRate = sectionViewed.length > 0 ? totalBacktracks / sectionViewed.length : 0;
    
    // Use policy-overridable threshold
    const backtrackTolerance = thresholds?.deep_reading?.backtrack_tolerance || (mode === 'TECHNICAL' || mode === 'SCIENTIFIC' ? 2.0 : 1.0);
    const backtrackScore = Math.max(0, 100 - (backtrackRate / backtrackTolerance) * 50);

    // 3. Context switch rate (lower = better)
    const totalSwitches = contextSwitch.reduce(
      (sum, e) => sum + ((e.data as any).count || 0),
      0,
    );
    const switchRate = events.length > 0 ? totalSwitches / events.length : 0;
    const switchTolerance = thresholds?.deep_reading?.switch_tolerance || (mode === 'TECHNICAL' ? 0.3 : 0.15);
    const switchScore = Math.max(0, 100 - (switchRate / switchTolerance) * 100);

    // Composite score (weighted average)
    const deepReadingIndex = (dwellStability * 0.4 + backtrackScore * 0.3 + switchScore * 0.3);

    return Math.round(deepReadingIndex);
  }

  /**
   * Calculate UI Load Index
   * 
   * Formula: (menu_opened + toolbox_opened + undo_redo_used) / session_duration_minutes
   * Lower score = better (less UI friction)
   */
  private calculateUILoadIndex(events: any[], sessionDurationMinutes: number, thresholds?: any): number {
    const menuOpened = events.filter(
      (e) => e.event_type === TelemetryEventType.MENU_OPENED,
    ).length;
    const toolboxOpened = events.filter(
      (e) => e.event_type === TelemetryEventType.TOOLBOX_OPENED,
    ).length;
    const undoRedo = events.filter(
      (e) => e.event_type === TelemetryEventType.UNDO_REDO_USED,
    ).length;

    // Use policy-overridable threshold for toolbox opens
    const maxToolboxOpens = thresholds?.ui_load?.max_toolbox_opens || 5;
    const toolboxScore = Math.max(0, 100 - (toolboxOpened / maxToolboxOpens) * 100);

    const totalUIActions = menuOpened + toolboxOpened + undoRedo;
    const uiLoadIndex =
      sessionDurationMinutes > 0 ? totalUIActions / sessionDurationMinutes : 0;

    // Normalize to 0-100 scale (lower is better)
    const normalizedScore = Math.max(0, 100 - uiLoadIndex * 10);
    return Math.round(normalizedScore * 100) / 100; // Round to 2 decimals
  }

  /**
   * Calculate Completion Quality
   * 
   * Formula: (sections_with_correct_micro_check / total_sections_viewed) * 100
   */
  private calculateCompletionQuality(events: any[]): number {
    const microChecks = events.filter(
      (e) => e.event_type === TelemetryEventType.MICRO_CHECK_ANSWERED,
    );

    if (microChecks.length === 0) return 0;

    const correctChecks = microChecks.filter((e) => (e.data as any).correct === true).length;
    const completionQuality = (correctChecks / microChecks.length) * 100;

    return Math.round(completionQuality);
  }

  /**
   * Get default analytics when no events exist
   */
  private getDefaultAnalytics(): SessionAnalytics {
    return {
      deep_reading_index: 0,
      ui_load_index: 0,
      completion_quality: 0,
      metadata: {
        total_events: 0,
        session_duration_minutes: 0,
      },
    };
  }
}
