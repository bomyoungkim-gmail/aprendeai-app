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
        phase: "FINISHED",
      },
      orderBy: {
        finished_at: "desc",
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
    const totalTimeMs =
      session.finished_at && session.started_at
        ? session.finished_at.getTime() - session.started_at.getTime()
        : 0;

    // Fetch interaction metrics from telemetry (scroll, highlights, notes)
    const [scrollEvents, interactions] = await Promise.all([
      this.prisma.telemetry_events.findMany({
        where: {
          user_id: userId,
          content_id: contentId,
          event_type: "SCROLL_DEPTH",
        },
        select: { data: true },
      }),
      this.prisma.telemetry_events.groupBy({
        by: ["event_type"],
        where: {
          user_id: userId,
          content_id: contentId,
          event_type: {
            in: ["ANNOTATION_CREATED", "NOTE_CREATED"],
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
      interactions.find((i) => i.event_type === "ANNOTATION_CREATED")?._count ||
      0;
    const notesCount =
      interactions.find((i) => i.event_type === "NOTE_CREATED")?._count || 0;

    // Fetch mode from telemetry
    const modeEvent = await this.prisma.telemetry_events.findFirst({
      where: {
        user_id: userId,
        content_id: contentId,
        event_type: "CHANGE_MODE",
      },
      orderBy: { created_at: "desc" },
    });
    const dominantMode = (modeEvent?.data as any)?.newMode || "NARRATIVE";

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
        event_type: { in: ["TIME_SPENT", "TIME_HEARTBEAT"] },
      },
      orderBy: { created_at: "desc" },
      take: 100,
    });

    const totalTimeMs = timeEvents
      .filter((e) => e.event_type === "TIME_SPENT")
      .reduce(
        (acc, curr) => acc + ((curr.data as any)?.totalDurationMs || 0),
        0,
      );

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
      sessionId: "aggregate",
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
    const todayDateString = today.toISOString().split("T")[0];
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

  async getGlobalStats(_range: "7d" | "30d" | "90d"): Promise<any> {
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

  /**
   * SCRIPT 07: Get comprehensive telemetry & KPIs for Syntax Analyzer and Fading
   *
   * @param from - Start date
   * @param to - End date
   * @returns Complete SCRIPT 07 metrics
   */
  async getScript07Metrics(from: Date, to: Date): Promise<any> {
    const [
      syntaxUsageRate,
      summaryImprovement,
      writingClarity,
      fadingHealth,
      checkpointCorrelation,
    ] = await Promise.all([
      this.calculateSyntaxUsageRate(from, to),
      this.calculateSummaryImprovement(from, to),
      this.calculateWritingClarity(from, to),
      this.calculateFadingHealth(from, to),
      this.calculateCheckpointCorrelation(from, to),
    ]);

    return {
      syntaxUsageRate,
      summaryImprovement,
      writingClarity,
      fadingHealth,
      checkpointCorrelation,
    };
  }

  /**
   * Calculate syntax analyzer usage rate
   */
  private async calculateSyntaxUsageRate(from: Date, to: Date): Promise<any> {
    // Count sessions with syntax analysis
    const sessionsWithSyntax = await this.prisma.telemetry_events.findMany({
      where: {
        event_type: "PROMPT_RECEIVED",
        created_at: { gte: from, lte: to },
      },
      select: {
        session_id: true,
        data: true,
      },
    });

    const syntaxSessionIds = new Set(
      sessionsWithSyntax
        .filter((e) => (e.data as any)?.kind === "SENTENCE_ANALYSIS_COMPLETED")
        .map((e) => e.session_id)
        .filter(Boolean),
    );

    // Count total sessions
    const totalSessions = await this.prisma.reading_sessions.count({
      where: {
        started_at: { gte: from, lte: to },
      },
    });

    const percentage =
      totalSessions > 0 ? (syntaxSessionIds.size / totalSessions) * 100 : 0;

    return {
      percentage: Math.round(percentage * 10) / 10,
      sessionsWithSyntax: syntaxSessionIds.size,
      totalSessions,
    };
  }

  /**
   * Calculate summary improvement metrics
   */
  private async calculateSummaryImprovement(
    from: Date,
    to: Date,
  ): Promise<any> {
    // Get users who used syntax analyzer
    const syntaxUsers = await this.prisma.telemetry_events.findMany({
      where: {
        event_type: "PROMPT_RECEIVED",
        created_at: { gte: from, lte: to },
      },
      select: {
        user_id: true,
        data: true,
      },
    });

    const syntaxUserIds = new Set(
      syntaxUsers
        .filter((e) => (e.data as any)?.kind === "SENTENCE_ANALYSIS_COMPLETED")
        .map((e) => e.user_id)
        .filter(Boolean),
    );

    // Get production submissions
    const productionEvents = await this.prisma.telemetry_events.findMany({
      where: {
        event_type: "PRODUCTION_SUBMIT",
        created_at: { gte: from, lte: to },
      },
      select: {
        user_id: true,
        data: true,
      },
    });

    const withSyntax: number[] = [];
    const withoutSyntax: number[] = [];
    const propositionDensityWith: number[] = [];
    const propositionDensityWithout: number[] = [];

    const connectors = [
      "porque",
      "pois",
      "portanto",
      "embora",
      "mas",
      "porém",
      "contudo",
      "todavia",
    ];

    for (const event of productionEvents) {
      const text = (event.data as any)?.text || "";
      const length = text.length;
      const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;

      // Count connectors
      const connectorCount = connectors.reduce(
        (count, conn) =>
          count +
          (text.toLowerCase().match(new RegExp(conn, "g"))?.length || 0),
        0,
      );
      const density = wordCount > 0 ? (connectorCount / wordCount) * 100 : 0;

      if (syntaxUserIds.has(event.user_id)) {
        withSyntax.push(length);
        propositionDensityWith.push(density);
      } else {
        withoutSyntax.push(length);
        propositionDensityWithout.push(density);
      }
    }

    const avgWith =
      withSyntax.length > 0
        ? withSyntax.reduce((a, b) => a + b, 0) / withSyntax.length
        : 0;
    const avgWithout =
      withoutSyntax.length > 0
        ? withoutSyntax.reduce((a, b) => a + b, 0) / withoutSyntax.length
        : 0;
    const avgDensityWith =
      propositionDensityWith.length > 0
        ? propositionDensityWith.reduce((a, b) => a + b, 0) /
          propositionDensityWith.length
        : 0;
    const avgDensityWithout =
      propositionDensityWithout.length > 0
        ? propositionDensityWithout.reduce((a, b) => a + b, 0) /
          propositionDensityWithout.length
        : 0;

    return {
      avgLengthWithSyntax: Math.round(avgWith),
      avgLengthWithoutSyntax: Math.round(avgWithout),
      lengthImprovement: Math.round(avgWith - avgWithout),
      propositionDensityWithSyntax: Math.round(avgDensityWith * 10) / 10,
      propositionDensityWithoutSyntax: Math.round(avgDensityWithout * 10) / 10,
    };
  }

  /**
   * Calculate writing clarity metrics
   */
  private async calculateWritingClarity(from: Date, to: Date): Promise<any> {
    // Get average syntax confidence
    const syntaxEvents = await this.prisma.telemetry_events.findMany({
      where: {
        event_type: "PROMPT_RECEIVED",
        created_at: { gte: from, lte: to },
      },
      select: {
        data: true,
      },
    });

    const confidenceScores = syntaxEvents
      .filter((e) => (e.data as any)?.kind === "SENTENCE_ANALYSIS_COMPLETED")
      .map((e) => (e.data as any)?.confidence)
      .filter((c) => typeof c === "number");

    const avgConfidence =
      confidenceScores.length > 0
        ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
        : 0;

    // Get users who used syntax analyzer
    const syntaxUserIds = new Set(
      syntaxEvents
        .filter((e) => (e.data as any)?.kind === "SENTENCE_ANALYSIS_COMPLETED")
        .map((e) => (e.data as any)?.user_id)
        .filter(Boolean),
    );

    // Analyze production text
    const productionEvents = await this.prisma.telemetry_events.findMany({
      where: {
        event_type: "PRODUCTION_SUBMIT",
        created_at: { gte: from, lte: to },
      },
      select: {
        user_id: true,
        data: true,
      },
    });

    const sentenceLengthWith: number[] = [];
    const sentenceLengthWithout: number[] = [];
    const connectorDensityWith: number[] = [];
    const connectorDensityWithout: number[] = [];

    const connectors = ["porque", "pois", "portanto", "embora", "mas", "porém"];

    for (const event of productionEvents) {
      const text = (event.data as any)?.text || "";
      const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
      const avgSentenceLength =
        sentences.length > 0 ? text.length / sentences.length : 0;

      const connectorCount = connectors.reduce(
        (count, conn) =>
          count +
          (text.toLowerCase().match(new RegExp(conn, "g"))?.length || 0),
        0,
      );
      const density =
        sentences.length > 0 ? connectorCount / sentences.length : 0;

      if (syntaxUserIds.has(event.user_id)) {
        sentenceLengthWith.push(avgSentenceLength);
        connectorDensityWith.push(density);
      } else {
        sentenceLengthWithout.push(avgSentenceLength);
        connectorDensityWithout.push(density);
      }
    }

    const avgLengthWith =
      sentenceLengthWith.length > 0
        ? sentenceLengthWith.reduce((a, b) => a + b, 0) /
          sentenceLengthWith.length
        : 0;
    const avgLengthWithout =
      sentenceLengthWithout.length > 0
        ? sentenceLengthWithout.reduce((a, b) => a + b, 0) /
          sentenceLengthWithout.length
        : 0;
    const avgDensityWith =
      connectorDensityWith.length > 0
        ? connectorDensityWith.reduce((a, b) => a + b, 0) /
          connectorDensityWith.length
        : 0;
    const avgDensityWithout =
      connectorDensityWithout.length > 0
        ? connectorDensityWithout.reduce((a, b) => a + b, 0) /
          connectorDensityWithout.length
        : 0;

    return {
      avgSyntaxConfidence: Math.round(avgConfidence * 100) / 100,
      avgSentenceLengthWithSyntax: Math.round(avgLengthWith),
      avgSentenceLengthWithoutSyntax: Math.round(avgLengthWithout),
      connectorDensityWithSyntax: Math.round(avgDensityWith * 100) / 100,
      connectorDensityWithoutSyntax: Math.round(avgDensityWithout * 100) / 100,
    };
  }

  /**
   * Calculate fading health metrics
   */
  private async calculateFadingHealth(from: Date, to: Date): Promise<any> {
    const levelSetEvents = await this.prisma.telemetry_events.findMany({
      where: {
        event_type: "SCAFFOLDING_LEVEL_SET",
        created_at: { gte: from, lte: to },
      },
      select: {
        user_id: true,
        data: true,
        created_at: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // Group by user and track fading sequences
    const userSequences: Map<string, any[]> = new Map();
    for (const event of levelSetEvents) {
      const userId = event.user_id;
      if (!userSequences.has(userId)) {
        userSequences.set(userId, []);
      }
      userSequences.get(userId)!.push(event);
    }

    const fadingByMode: Map<string, { totalDays: number; count: number }> =
      new Map();

    for (const [_userId, events] of userSequences.entries()) {
      for (let i = 1; i < events.length; i++) {
        const prev = events[i - 1];
        const curr = events[i];
        const fromLevel = (prev.data as any)?.toLevel;
        const toLevel = (curr.data as any)?.toLevel;
        const mode = (curr.data as any)?.mode || "UNKNOWN";

        // Only count fading (decrease)
        if (fromLevel > toLevel) {
          const daysToFade =
            (curr.created_at.getTime() - prev.created_at.getTime()) /
            (1000 * 60 * 60 * 24);

          if (!fadingByMode.has(mode)) {
            fadingByMode.set(mode, { totalDays: 0, count: 0 });
          }
          const modeData = fadingByMode.get(mode)!;
          modeData.totalDays += daysToFade;
          modeData.count += 1;
        }
      }
    }

    const byMode = Array.from(fadingByMode.entries()).map(([mode, data]) => ({
      mode,
      avgDaysToFade: Math.round((data.totalDays / data.count) * 10) / 10,
      fadeCount: data.count,
    }));

    return { byMode };
  }

  /**
   * Calculate checkpoint correlation metrics
   */
  private async calculateCheckpointCorrelation(
    from: Date,
    to: Date,
  ): Promise<any> {
    // Get users who used syntax analyzer
    const syntaxEvents = await this.prisma.telemetry_events.findMany({
      where: {
        event_type: "PROMPT_RECEIVED",
        created_at: { gte: from, lte: to },
      },
      select: {
        user_id: true,
        data: true,
      },
    });

    const syntaxUserIds = new Set(
      syntaxEvents
        .filter((e) => (e.data as any)?.kind === "SENTENCE_ANALYSIS_COMPLETED")
        .map((e) => e.user_id)
        .filter(Boolean),
    );

    // Get checkpoint responses
    const checkpointEvents = await this.prisma.telemetry_events.findMany({
      where: {
        event_type: "CHECKPOINT_RESPONSE",
        created_at: { gte: from, lte: to },
      },
      select: {
        user_id: true,
        data: true,
      },
    });

    const scoresWithSyntax: number[] = [];
    const scoresWithoutSyntax: number[] = [];

    for (const event of checkpointEvents) {
      const comprehension = (event.data as any)?.rubric?.comprehension;
      if (typeof comprehension === "number") {
        if (syntaxUserIds.has(event.user_id)) {
          scoresWithSyntax.push(comprehension);
        } else {
          scoresWithoutSyntax.push(comprehension);
        }
      }
    }

    const avgWith =
      scoresWithSyntax.length > 0
        ? scoresWithSyntax.reduce((a, b) => a + b, 0) / scoresWithSyntax.length
        : 0;
    const avgWithout =
      scoresWithoutSyntax.length > 0
        ? scoresWithoutSyntax.reduce((a, b) => a + b, 0) /
          scoresWithoutSyntax.length
        : 0;

    return {
      withSyntax: {
        avgScore: Math.round(avgWith * 100) / 100,
        userCount: new Set(
          checkpointEvents
            .filter((e) => syntaxUserIds.has(e.user_id))
            .map((e) => e.user_id),
        ).size,
      },
      withoutSyntax: {
        avgScore: Math.round(avgWithout * 100) / 100,
        userCount: new Set(
          checkpointEvents
            .filter((e) => !syntaxUserIds.has(e.user_id))
            .map((e) => e.user_id),
        ).size,
      },
      improvement: Math.round((avgWith - avgWithout) * 100) / 100,
    };
  }
}
