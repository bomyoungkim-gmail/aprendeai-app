import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';

export interface SessionStartedEvent {
  userId: string;
  activityType: 'reading' | 'game' | 'assessment' | 'extension_clip';
  contentId?: string;
  sourceId?: string;
}

export interface SessionFinishedEvent {
  sessionId: string;
  durationMinutes?: number;
  netFocusMinutes?: number;
  interruptions?: number;
  accuracyRate?: number;
  engagementScore?: number;
}

export interface SessionHeartbeatEvent {
  sessionId: string;
  status: 'focused' | 'blurred';
}

@Injectable()
export class SessionTrackingService {
  private readonly logger = new Logger(SessionTrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('session.started')
  async handleSessionStart(event: SessionStartedEvent) {
    try {
      const session = await this.prisma.studySession.create({
        data: {
          userId: event.userId,
          activityType: event.activityType,
          contentId: event.contentId,
          sourceId: event.sourceId,
          startTime: new Date(),
        },
      });

      this.logger.log(
        `Session started: ${session.id} (${event.activityType}) for user ${event.userId}`,
      );

      return session;
    } catch (error) {
      this.logger.error(`Failed to start session: ${error.message}`);
    }
  }

  @OnEvent('session.finished')
  async handleSessionFinish(event: SessionFinishedEvent) {
    try {
      // Calculate focus score if both metrics provided
      let focusScore: number | undefined;
      if (
        event.netFocusMinutes != null &&
        event.durationMinutes != null &&
        event.durationMinutes > 0
      ) {
        focusScore = (event.netFocusMinutes / event.durationMinutes) * 100;
      }

      const session = await this.prisma.studySession.update({
        where: { id: event.sessionId },
        data: {
          endTime: new Date(),
          durationMinutes: event.durationMinutes,
          netFocusMinutes: event.netFocusMinutes,
          interruptions: event.interruptions,
          focusScore,
          accuracyRate: event.accuracyRate,
          engagementScore: event.engagementScore,
        },
      });

      this.logger.log(
        `Session finished: ${session.id} (Focus: ${focusScore?.toFixed(1)}%)`,
      );

      return session;
    } catch (error) {
      this.logger.error(`Failed to finish session: ${error.message}`);
    }
  }

  @OnEvent('session.heartbeat')
  async handleSessionHeartbeat(event: SessionHeartbeatEvent) {
    // Increment interruptions counter if status changed to blurred
    if (event.status === 'blurred') {
      try {
        await this.prisma.studySession.update({
          where: { id: event.sessionId },
          data: {
            interruptions: { increment: 1 },
          },
        });
      } catch (error) {
        this.logger.error(`Failed to record interruption: ${error.message}`);
      }
    }
  }

  /**
   * Handle reading activity events from Cornell/Highlights
   * Groups multiple reading actions into sessions
   */
  @OnEvent('reading.activity')
  async handleReadingActivity(event: {
    userId: string;
    contentId: string;
    activityType: string;
  }) {
    try {
      // Find or create active reading session for this content
      let activeSession = await this.prisma.studySession.findFirst({
        where: {
          userId: event.userId,
          contentId: event.contentId,
          activityType: 'reading',
          endTime: null,
        },
        orderBy: { startTime: 'desc' },
      });

      if (!activeSession) {
        // Create new reading session
        activeSession = await this.prisma.studySession.create({
          data: {
            userId: event.userId,
            contentId: event.contentId,
            activityType: 'reading',
            startTime: new Date(),
          },
        });

        this.logger.log(
          `Reading session started: ${activeSession.id} for content ${event.contentId}`,
        );
      }

      // Auto-close reading sessions after 15 minutes of inactivity
      const idleTime = Date.now() - activeSession.startTime.getTime();
      if (idleTime > 15 * 60 * 1000) {
        const durationMinutes = Math.floor(idleTime / (1000 * 60));

        await this.prisma.studySession.update({
          where: { id: activeSession.id },
          data: {
            endTime: new Date(),
            durationMinutes,
            engagementScore: 70, // Base engagement for active reading
          },
        });

        this.logger.log(`Reading session auto-closed: ${activeSession.id}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle reading activity: ${error.message}`);
    }
  }

  /**
   * Find active session for user (for extension usage)
   */
  async findActiveSession(userId: string, activityType?: string) {
    const where: any = {
      userId,
      endTime: null,
    };

    if (activityType) {
      where.activityType = activityType;
    }

    return this.prisma.studySession.findFirst({
      where,
      orderBy: { startTime: 'desc' },
    });
  }

  /**
   * Auto-close sessions older than threshold (cleanup job)
   */
  async autoCloseAbandonedSessions(thresholdMinutes: number = 30) {
    const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);

    const abandoned = await this.prisma.studySession.findMany({
      where: {
        endTime: null,
        startTime: { lt: threshold },
      },
    });

    for (const session of abandoned) {
      const duration = Math.floor(
        (threshold.getTime() - session.startTime.getTime()) / (1000 * 60),
      );

      await this.prisma.studySession.update({
        where: { id: session.id },
        data: {
          endTime: threshold,
          durationMinutes: duration,
          // Assume low engagement for abandoned sessions
          focusScore: 20,
        },
      });
    }

    this.logger.log(`Auto-closed ${abandoned.length} abandoned sessions`);
    return abandoned.length;
  }
}
