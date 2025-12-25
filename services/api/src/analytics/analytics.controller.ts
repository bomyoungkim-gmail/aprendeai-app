import { Controller, Get, UseGuards, Request, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AnalyticsService } from "./analytics.service";
import { AuthGuard } from "@nestjs/passport";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { User } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("Analytics")
@ApiBearerAuth()
@Controller("analytics")
@UseGuards(AuthGuard("jwt"))
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get("progress")
  getProgress(@Request() req: any) {
    return this.analyticsService.getStudentProgress(req.user.id);
  }

  @Get("vocabulary")
  getVocabulary(@Request() req: any) {
    return this.analyticsService.getVocabularyList(req.user.id);
  }

  @Get('hourly-performance')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get hourly study performance heatmap for user',
  })
  async getHourlyPerformance(
    @CurrentUser() user: User,
    @Query('days') days?: string,
  ) {
    const daysToAnalyze = days ? parseInt(days, 10) : 30;
    const since = new Date(Date.now() - daysToAnalyze * 24 * 60 * 60 * 1000);

    const hourlyData = await this.prisma.$queryRaw<
      Array<{
        hour: number;
        avg_accuracy: number;
        avg_focus_score: number;
        total_sessions: bigint;
        total_minutes: bigint;
      }>
    >`
      SELECT 
        EXTRACT(HOUR FROM start_time)::integer AS hour,
        AVG(accuracy_rate)::float AS avg_accuracy,
        AVG(focus_score)::float AS avg_focus_score,
        COUNT(*)::bigint AS total_sessions,
        SUM(duration_minutes)::bigint AS total_minutes
      FROM study_sessions
      WHERE user_id = ${user.id}
        AND start_time >= ${since}
        AND duration_minutes IS NOT NULL
      GROUP BY EXTRACT(HOUR FROM start_time)
      ORDER BY hour
    `;

    const transformed = hourlyData.map((row) => ({
      hour: row.hour,
      avgAccuracy: row.avg_accuracy || 0,
      avgFocusScore: row.avg_focus_score || 0,
      sessionCount: Number(row.total_sessions),
      totalMinutes: Number(row.total_minutes),
    }));

    const ranked = [...transformed].sort((a, b) => b.avgFocusScore - a.avgFocusScore);
    const peakHours = ranked.slice(0, 3).map((r) => r.hour);

    return {
      hourlyBreakdown: transformed,
      peakHours,
      daysAnalyzed: daysToAnalyze,
    };
  }

  @Get('quality-overview')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get study quality overview for user',
  })
  async getQualityOverview(
    @CurrentUser() user: User,
    @Query('period') period?: string,
  ) {
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const sessions = await this.prisma.studySession.findMany({
      where: {
        userId: user.id,
        startTime: { gte: since },
      },
    });

    if (sessions.length === 0) {
      return { period: days, totalSessions: 0, avgAccuracy: 0 };
    }

    const totals = sessions.reduce(
      (acc, s) => ({
        accuracy: acc.accuracy + (s.accuracyRate || 0),
        focus: acc.focus + (s.focusScore || 0),
      }),
      { accuracy: 0, focus: 0 },
    );

    return {
      period: days,
      totalSessions: sessions.length,
      avgAccuracy: Math.round((totals.accuracy / sessions.length) * 10) / 10,
      avgFocusScore: Math.round((totals.focus / sessions.length) * 10) / 10,
    };
  }
}
