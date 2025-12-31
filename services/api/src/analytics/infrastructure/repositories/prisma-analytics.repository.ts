import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { IAnalyticsRepository } from "../../domain/analytics.repository.interface";
import { StudySession } from "../../domain/study-session.entity";

@Injectable()
export class PrismaAnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSession(session: StudySession): Promise<StudySession> {
    const created = await this.prisma.study_sessions.create({
      data: {
        id: session.id,
        user_id: session.userId,
        activity_type: session.activityType,
        content_id: session.contentId,
        source_id: session.sourceId,
        start_time: session.startTime,
      },
    });
    return this.mapToDomain(created);
  }

  async updateSession(id: string, updates: Partial<StudySession>): Promise<StudySession> {
    const updated = await this.prisma.study_sessions.update({
      where: { id },
      data: {
        end_time: updates.endTime,
        duration_minutes: updates.durationMinutes,
        net_focus_minutes: updates.netFocusMinutes,
        interruptions: updates.interruptions ? { increment: 1 } : undefined, // Special handling for heartbeat
        focus_score: updates.focusScore,
        accuracy_rate: updates.accuracyRate,
        engagement_score: updates.engagementScore,
      },
    });
    // Note: If interruptions is just a value update, we might need a different method or check.
    // In handleSessionHeartbeat it was { increment: 1 }.
    return this.mapToDomain(updated);
  }

  // Adding a specific increment method to handle heartbeat correctly
  async incrementInterruptions(id: string): Promise<void> {
    await this.prisma.study_sessions.update({
      where: { id },
      data: { interruptions: { increment: 1 } }
    });
  }

  async findById(id: string): Promise<StudySession | null> {
    const found = await this.prisma.study_sessions.findUnique({
      where: { id },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async findActiveSession(userId: string, activityType?: string): Promise<StudySession | null> {
    const found = await this.prisma.study_sessions.findFirst({
      where: {
        user_id: userId,
        activity_type: activityType,
        end_time: null,
      },
      orderBy: { start_time: "desc" },
    });
    return found ? this.mapToDomain(found) : null;
  }

  async findAbandonedSessions(thresholdMinutes: number): Promise<StudySession[]> {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
    const found = await this.prisma.study_sessions.findMany({
      where: {
        end_time: null,
        start_time: { lt: threshold },
      },
    });
    return found.map(this.mapToDomain);
  }

  async findReadingSession(userId: string, contentId: string): Promise<StudySession | null> {
     const found = await this.prisma.study_sessions.findFirst({
        where: {
          user_id: userId,
          content_id: contentId,
          activity_type: "reading",
          end_time: null,
        },
        orderBy: { start_time: "desc" },
      });
      return found ? this.mapToDomain(found) : null;
  }

  async countMasteredVocab(userId: string, minMastery: number): Promise<number> {
    return this.prisma.user_vocabularies.count({
      where: { user_id: userId, mastery_score: { gte: minMastery } },
    });
  }

  async getAssessmentAnswers(userId: string): Promise<any[]> {
    return this.prisma.assessment_answers.findMany({
      where: { assessment_attempts: { user_id: userId } },
      include: { assessment_questions: true },
    });
  }

  async getVocabularyList(userId: string, limit: number): Promise<any[]> {
    return this.prisma.user_vocabularies.findMany({
      where: { user_id: userId },
      orderBy: { mastery_score: "desc" },
      take: limit,
    });
  }

  async getHourlyPerformance(userId: string, since: Date): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT 
        EXTRACT(HOUR FROM start_time)::integer AS hour,
        AVG(accuracy_rate)::float AS avg_accuracy,
        AVG(focus_score)::float AS avg_focus_score,
        COUNT(*)::bigint AS total_sessions,
        SUM(duration_minutes)::bigint AS total_minutes
      FROM study_sessions
      WHERE user_id = ${userId}
        AND start_time >= ${since}
        AND duration_minutes IS NOT NULL
      GROUP BY EXTRACT(HOUR FROM start_time)
      ORDER BY hour
    `;
  }

  async getQualitySessions(userId: string, since: Date): Promise<any[]> {
    return this.prisma.study_sessions.findMany({
      where: {
        user_id: userId,
        start_time: { gte: since },
      },
    });
  }

  private mapToDomain(item: any): StudySession {
    return new StudySession({
      id: item.id,
      userId: item.user_id,
      activityType: item.activity_type,
      contentId: item.content_id,
      sourceId: item.source_id,
      startTime: item.start_time,
      endTime: item.end_time,
      durationMinutes: item.duration_minutes,
      netFocusMinutes: item.net_focus_minutes,
      interruptions: item.interruptions,
      focusScore: item.focus_score,
      accuracyRate: item.accuracy_rate,
      engagementScore: item.engagement_score,
    });
  }
}
