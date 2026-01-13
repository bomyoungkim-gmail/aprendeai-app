import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { DcsCalculatorService } from "./dcs-calculator.service";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class DcsCalculatorListener {
  private readonly logger = new Logger(DcsCalculatorListener.name);

  constructor(
    private readonly dcsService: DcsCalculatorService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Handle Session End Events
   * Triggers DCS recalc when a session finishes (potential new evidence from behavior)
   */
  @OnEvent("session.events.created")
  async handleSessionEvents(payload: {
    sessionId: string;
    eventTypes: string[];
  }) {
    if (
      payload.eventTypes.includes("CO_SESSION_FINISHED") ||
      payload.eventTypes.includes("READING_SESSION_FINISHED") ||
      payload.eventTypes.includes("SESSION_FINISHED")
    ) {
      this.logger.log(
        `Session finished (${payload.sessionId}), triggering DCS recalc...`,
      );

      try {
        const session = await this.prisma.reading_sessions.findUnique({
          where: { id: payload.sessionId },
          select: { content_id: true, user_id: true },
        });

        if (session) {
          this.logger.log(
            `Recalculating DCS for session ${payload.sessionId} (User: ${session.user_id}, Content: ${session.content_id})`,
          );
          const result = await this.dcsService.calculateDcs(
            session.content_id,
            "USER",
            session.user_id,
          );
          await this.dcsService.persistScore(
            session.content_id,
            "USER",
            session.user_id,
            result,
          );
        } else {
          this.logger.warn(
            `Session ${payload.sessionId} not found for DCS recalc`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to handle session finish event for DCS recalc: ${error.message}`,
        );
      }
    }
  }

  /**
   * Handle Synthesis / Cornell Updates
   * Triggers DCS recalc when notes are updated (User curation signal)
   */
  @OnEvent("cornell.summary.updated")
  async handleCornellUpdate(payload: {
    noteId: string;
    userId: string;
    contentId: string;
  }) {
    this.logger.log(
      `Cornell summary updated for ${payload.contentId}, triggering DCS recalc...`,
    );
    // Recalc for USER scope
    const result = await this.dcsService.calculateDcs(
      payload.contentId,
      "USER",
      payload.userId,
    );
    await this.dcsService.persistScore(
      payload.contentId,
      "USER",
      payload.userId,
      result,
    );
  }

  @OnEvent("cornell.note.added")
  async handleCornellNote(payload: {
    noteId: string;
    userId: string;
    contentId: string;
  }) {
    this.logger.log(
      `Cornell note added for ${payload.contentId}, triggering DCS recalc...`,
    );
    const result = await this.dcsService.calculateDcs(
      payload.contentId,
      "USER",
      payload.userId,
    );
    await this.dcsService.persistScore(
      payload.contentId,
      "USER",
      payload.userId,
      result,
    );
  }
}
