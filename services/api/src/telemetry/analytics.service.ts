import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  SessionMetricsDto,
  DailyEngagementDto,
} from "./dto/analytics-response.dto";

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSessionMetrics(
    contentId: string,
    userId: string,
  ): Promise<SessionMetricsDto> {
    // Fetch the latest FINISHED session for this content and user
    const session = await this.prisma.reading_sessions.findFirst({
      where: {
        user_id: userId,
        content_id: contentId,
        phase: 'FINISHED',
      },
      orderBy: {
        finished_at: 'desc',
      },
      include: {
        session_outcomes: true,
      },
    });

    // If no finished session found, fall back to telemetry aggregation
    if (!session) {
      return this.getSessionMetricsFromTelemetry(contentId, userId);
    }

    // Calculate time from session timestamps
    const totalTimeMs = session.finished_at && session.started_at
      ? session.finished_at.getTime() - session.started_at.getTime()
      : 0;

    // Fetch interaction metrics from telemetry (scroll, highlights, notes)
    const [scrollEvents, interactions] = await Promise.all([
      this.prisma.telemetry_events.findMany({
        where: {
          user_id: userId,
          content_id: contentId,
          event_type: 'SCROLL_DEPTH',
        },
        select: { data: true },
      }),
      this.prisma.telemetry_events.groupBy({
        by: ['event_type'],
        where: {
          user_id: userId,
          content_id: contentId,
          event_type: {
            in: ['ANNOTATION_CREATED', 'NOTE_CREATED'],
          },
        },
        _count: true,
      }),
    ]);

    const maxScroll = scrollEvents.reduce(
      (max, e) => Math.max(max, (e.data as any)?.scrollPercent || 0),
      0,
    );

    const highlightsCount =
      interactions.find((i) => i.event_type === 'ANNOTATION_CREATED')?._count ||
      0;
    const notesCount =
      interactions.find((i) => i.event_type === 'NOTE_CREATED')?._count || 0;

    // Fetch mode from telemetry
    const modeEvent = await this.prisma.telemetry_events.findFirst({
      where: {
        user_id: userId,
        content_id: contentId,
        event_type: 'CHANGE_MODE',
      },
      orderBy: { created_at: 'desc' },
    });
    const dominantMode = (modeEvent?.data as any)?.newMode || 'NARRATIVE';

    return {
      sessionId: session.id,
      totalTimeMs,
      scrollDepth: maxScroll,
      highlightsCount,
      notesCount,
      dominantMode,
      startTime: session.started_at || new Date(),
      endTime: session.finished_at || new Date(),
      comprehensionScore: session.session_outcomes?.comprehension_score,
      productionScore: session.session_outcomes?.production_score,
      frustrationIndex: session.session_outcomes?.frustration_index,
    };
  }

  /**
   * Fallback method for sessions without outcomes (legacy or incomplete sessions)
   */
  private async getSessionMetricsFromTelemetry(
    contentId: string,
    userId: string,
  ): Promise<SessionMetricsDto> {
    // Original telemetry-based aggregation logic
    const timeEvents = await this.prisma.telemetry_events.findMany({
      where: {
        user_id: userId,
        content_id: contentId,
        event_type: { in: ['TIME_SPENT', 'TIME_HEARTBEAT'] },
      },
      orderBy: { created_at: 'desc' },
      take: 100,
    });

    const totalTimeMs = timeEvents
      .filter((e) => e.event_type === 'TIME_SPENT')
      .reduce(
        (acc, curr) => acc + ((curr.data as any)?.totalDurationMs || 0),
        0,
      );

    const interactions = await this.prisma.telemetry_events.groupBy({
      by: ['event_type'],
      where: {
        user_id: userId,
        content_id: contentId,
        event_type: {
          in: ['ANNOTATION_CREATED', 'NOTE_CREATED', 'SCROLL_DEPTH'],
        },
      },
      _count: true,
    });

    const highlightsCount =
      interactions.find((i) => i.event_type === 'ANNOTATION_CREATED')?._count ||
      0;
    const notesCount =
      interactions.find((i) => i.event_type === 'NOTE_CREATED')?._count || 0;

    const scrollEvents = await this.prisma.telemetry_events.findMany({
      where: {
        user_id: userId,
        content_id: contentId,
        event_type: 'SCROLL_DEPTH',
      },
      select: { data: true },
    });
    const maxScroll = scrollEvents.reduce(
      (max, e) => Math.max(max, (e.data as any)?.scrollPercent || 0),
      0,
    );

    const modeEvents = await this.prisma.telemetry_events.findFirst({
      where: {
        user_id: userId,
        content_id: contentId,
        event_type: 'CHANGE_MODE',
      },
      orderBy: { created_at: 'desc' },
    });
    const dominantMode = (modeEvents?.data as any)?.newMode || 'NARRATIVE';

    return {
      sessionId: 'aggregate',
      totalTimeMs,
      scrollDepth: maxScroll,
      highlightsCount,
      notesCount,
      dominantMode,
      startTime: new Date(),
      endTime: new Date(),
    };
  }

  async getDailyStats(userId: string): Promise<DailyEngagementDto> {
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0];
    const todayDate = new Date(todayDateString);

    // Query daily_activities table for today's data
    const activity = await this.prisma.daily_activities.findFirst({
      where: {
        user_id: userId,
        date: todayDate,
      },
    });

    // If no activity found, return zeros
    if (!activity) {
      return {
        date: todayDateString,
        totalTimeMs: 0,
        contentsRead: 0,
        sessionsCount: 0,
      };
    }

    // Convert minutes to milliseconds for frontend compatibility
    const totalTimeMs = activity.minutes_studied * 60 * 1000;

    return {
      date: todayDateString,
      totalTimeMs,
      contentsRead: activity.contents_read,
      sessionsCount: activity.sessions_count,
    };
  }

  async getGlobalStats(range: "7d" | "30d" | "90d"): Promise<any> {
    // For MVP, return mock data or basic aggregation
    // Real implementation would use Prisma to aggregate telemetry_events
    return {
      activeUsers: 156,
      contentsRead: 1240,
      completionRate: 78,
      avgTime: 24,
      modeUsage: {
        NARRATIVE: 450,
        DIDACTIC: 320,
        TECHNICAL: 180,
        SCIENTIFIC: 120,
        LANGUAGE: 170,
      },
      confusionHeatmap: [
        { sectionId: "Section 1", count: 12 },
        { sectionId: "Section 2", count: 5 },
        { sectionId: "Section 3", count: 18 },
        { sectionId: "Section 4", count: 2 },
      ],
    };
  }
}
