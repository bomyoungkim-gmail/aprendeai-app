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
    // For MVP, "Session" is implicitly defined by contentId + User + Time window (last 24h?)
    // Or we use the actual sessionId passed from frontend if we tracked it in 'data' json.
    // Sprint 1 TelemetryEvent has 'data' Json.
    // Let's aggregate by contentId for the user for now (Life-time stats for this content).
    // Or simpler: Aggregate ALL events for this user/content.

    // 1. Time Spent
    const timeEvents = await this.prisma.telemetry_events.findMany({
      where: {
        user_id: userId,
        content_id: contentId,
        event_type: { in: ["TIME_SPENT", "TIME_HEARTBEAT"] },
      },
      orderBy: { created_at: "desc" },
      take: 100, // Limit for perf
    });

    // Simple sum of TIME_SPENT events (assuming they are increments or final summaries)
    // Our frontend sends "totalDurationMs" in TIME_SPENT.
    // If we have multiple sessions, we sum the distinct final events?
    // Complex. For MVP, let's sum "activeDurationMs" from heartbeats if available, or just count events.
    // Better: Frontend TIME_SPENT has 'totalDurationMs' for THAT session.
    // We sum all TIME_SPENT.totalDurationMs
    const totalTimeMs = timeEvents
      .filter((e) => e.event_type === "TIME_SPENT")
      .reduce(
        (acc, curr) => acc + ((curr.data as any)?.totalDurationMs || 0),
        0,
      );

    // 2. Interactions
    const interactions = await this.prisma.telemetry_events.groupBy({
      by: ["event_type"],
      where: {
        user_id: userId,
        content_id: contentId,
        event_type: {
          in: ["ANNOTATION_CREATED", "NOTE_CREATED", "SCROLL_DEPTH"],
        },
      },
      _count: true,
    });

    const highlightsCount =
      interactions.find((i) => i.event_type === "ANNOTATION_CREATED")?._count ||
      0;
    const notesCount =
      interactions.find((i) => i.event_type === "NOTE_CREATED")?._count || 0;

    // 3. Max Scroll
    const scrollEvents = await this.prisma.telemetry_events.findMany({
      where: {
        user_id: userId,
        content_id: contentId,
        event_type: "SCROLL_DEPTH",
      },
      select: { data: true },
    });
    const maxScroll = scrollEvents.reduce(
      (max, e) => Math.max(max, (e.data as any)?.scrollPercent || 0),
      0,
    );

    // 4. Mode
    const modeEvents = await this.prisma.telemetry_events.findFirst({
      where: {
        user_id: userId,
        content_id: contentId,
        event_type: "CHANGE_MODE",
      },
      orderBy: { created_at: "desc" },
    });
    const dominantMode = (modeEvents?.data as any)?.newMode || "NARRATIVE";

    return {
      sessionId: "aggregate", // Placeholder
      totalTimeMs,
      scrollDepth: maxScroll,
      highlightsCount,
      notesCount,
      dominantMode,
      startTime: new Date(), // Placeholder
      endTime: new Date(),
    };
  }

  async getDailyStats(userId: string): Promise<DailyEngagementDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await this.prisma.telemetry_events.count({
      where: {
        user_id: userId,
        created_at: { gte: today },
      },
    });

    // Distinct contents
    const contents = await this.prisma.telemetry_events.groupBy({
      by: ["content_id"],
      where: {
        user_id: userId,
        created_at: { gte: today },
        event_type: "VIEW_CONTENT",
      },
    });

    return {
      date: today.toISOString().split("T")[0],
      totalTimeMs: 0, // TODO: Aggregate time for today
      contentsRead: contents.length,
      sessionsCount: 0, // Placeholder
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
