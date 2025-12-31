import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";
import { TrackStudySessionUseCase } from "./application/use-cases/track-study-session.use-case";

export interface SessionStartedEvent {
  user_id: string;
  activity_type: "reading" | "game" | "assessment" | "extension_clip";
  content_id?: string;
  source_id?: string;
}

export interface SessionFinishedEvent {
  sessionId: string;
  duration_minutes?: number;
  net_focus_minutes?: number;
  interruptions?: number;
  accuracy_rate?: number;
  engagement_score?: number;
}

export interface SessionHeartbeatEvent {
  sessionId: string;
  status: "focused" | "blurred";
}

@Injectable()
export class SessionTrackingService {
  private readonly logger = new Logger(SessionTrackingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly trackUseCase: TrackStudySessionUseCase,
  ) {}

  @OnEvent("session.started")
  async handleSessionStart(event: SessionStartedEvent) {
    const user_id = event.user_id || (event as any).userId;
    const activity_type = event.activity_type || (event as any).activityType;
    const content_id = event.content_id || (event as any).contentId;
    const source_id = event.source_id || (event as any).sourceId;

    return this.trackUseCase.startSession(user_id, activity_type, content_id, source_id);
  }

  @OnEvent("session.finished")
  async handleSessionFinish(event: SessionFinishedEvent) {
    return this.trackUseCase.finishSession(event.sessionId, {
      durationMinutes: event.duration_minutes || (event as any).durationMinutes,
      netFocusMinutes: event.net_focus_minutes || (event as any).netFocusMinutes,
      interruptions: event.interruptions,
      accuracyRate: event.accuracy_rate || (event as any).accuracyRate,
      engagementScore: event.engagement_score || (event as any).engagementScore,
    });
  }

  @OnEvent("session.heartbeat")
  async handleSessionHeartbeat(event: SessionHeartbeatEvent) {
    await this.trackUseCase.heartbeat(event.sessionId, event.status);
  }

  /**
   * Handle reading activity events from Cornell/Highlights
   * Groups multiple reading actions into sessions
   */
  @OnEvent("reading.activity")
  async handleReadingActivity(event: {
    user_id: string;
    content_id: string;
    activity_type: string;
  }) {
    const user_id = event.user_id || (event as any).userId;
    const content_id = event.content_id || (event as any).contentId;
    await this.trackUseCase.handleReadingActivity(user_id, content_id);
  }

  /**
   * Find active session for user (for extension usage)
   */
  async findActiveSession(user_id: string, activityType?: string) {
    return this.trackUseCase["repository"].findActiveSession(user_id, activityType);
  }

  /**
   * Auto-close sessions older than threshold (cleanup job)
   */
  async autoCloseAbandonedSessions(thresholdMinutes: number = 30) {
    const abandoned = await this.trackUseCase["repository"].findAbandonedSessions(thresholdMinutes);

    for (const session of abandoned) {
      const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
      const duration = Math.floor(
        (threshold.getTime() - session.startTime.getTime()) /
          (1000 * 60),
      );

      await this.trackUseCase.finishSession(session.id, {
          durationMinutes: duration,
          engagementScore: 20
      });
    }

    this.logger.log(`Auto-closed ${abandoned.length} abandoned sessions`);
    return abandoned.length;
  }
}
