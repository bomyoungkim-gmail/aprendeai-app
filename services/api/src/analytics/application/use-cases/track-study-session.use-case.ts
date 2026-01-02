import { Injectable, Inject, Logger } from "@nestjs/common";
import { IAnalyticsRepository } from "../../domain/analytics.repository.interface";
import { StudySession } from "../../domain/study-session.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class TrackStudySessionUseCase {
  private readonly logger = new Logger(TrackStudySessionUseCase.name);

  constructor(
    @Inject(IAnalyticsRepository)
    private readonly repository: IAnalyticsRepository,
  ) {}

  async startSession(
    userId: string,
    activityType: string,
    contentId?: string,
    sourceId?: string,
  ): Promise<StudySession> {
    const session = new StudySession({
      id: uuidv4(),
      userId,
      activityType,
      contentId,
      sourceId,
      startTime: new Date(),
    });

    const created = await this.repository.createSession(session);
    this.logger.log(
      `Session started: ${created.id} (${activityType}) for user ${userId}`,
    );
    return created;
  }

  async finishSession(
    sessionId: string,
    data: {
      durationMinutes?: number;
      netFocusMinutes?: number;
      interruptions?: number;
      accuracyRate?: number;
      engagementScore?: number;
    },
  ): Promise<StudySession> {
    let focusScore: number | undefined;
    if (
      data.netFocusMinutes != null &&
      data.durationMinutes != null &&
      data.durationMinutes > 0
    ) {
      focusScore = (data.netFocusMinutes / data.durationMinutes) * 100;
    }

    const updated = await this.repository.updateSession(sessionId, {
      endTime: new Date(),
      durationMinutes: data.durationMinutes,
      netFocusMinutes: data.netFocusMinutes,
      interruptions: data.interruptions,
      focusScore,
      accuracyRate: data.accuracyRate,
      engagementScore: data.engagementScore,
    });

    this.logger.log(
      `Session finished: ${updated.id} (Focus: ${focusScore?.toFixed(1)}%)`,
    );
    return updated;
  }

  async heartbeat(
    sessionId: string,
    status: "focused" | "blurred",
  ): Promise<void> {
    if (status === "blurred") {
      await this.repository.incrementInterruptions(sessionId);
    }
  }

  async handleReadingActivity(
    userId: string,
    contentId: string,
  ): Promise<void> {
    let activeSession = await this.repository.findReadingSession(
      userId,
      contentId,
    );

    if (!activeSession) {
      activeSession = await this.startSession(userId, "reading", contentId);
    }

    // Auto-close if too old
    const idleTime = Date.now() - activeSession.startTime.getTime();
    if (idleTime > 15 * 60 * 1000) {
      const durationMinutes = Math.floor(idleTime / (1000 * 60));
      await this.finishSession(activeSession.id, {
        durationMinutes,
        engagementScore: 70,
      });
      this.logger.log(`Reading session auto-closed: ${activeSession.id}`);
    }
  }
}
