import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { GroupSessionsService } from "./group-sessions.service";
import { UpdatePromptDto } from "./dto/update-prompt.dto";
import { SubmitEventDto } from "./dto/submit-event.dto";
import { RoundStatus } from "@prisma/client";
import { StudyGroupsWebSocketGateway } from "../websocket/study-groups-ws.gateway";
import { StudyGroupEvent } from "../websocket/events";
import * as crypto from "crypto";

@Injectable()
export class GroupRoundsService {
  private readonly logger = new Logger(GroupRoundsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly groupSessionsService: GroupSessionsService,
    private readonly wsGateway: StudyGroupsWebSocketGateway,
  ) {}

  async updatePrompt(
    sessionId: string,
    roundIndex: number,
    user_id: string,
    dto: UpdatePromptDto,
  ) {
    const session = await this.groupSessionsService.getSession(
      sessionId,
      user_id,
    );

    // Check permissions using loaded session data (no extra queries)
    this.assertFacilitatorPermission(session, user_id);

    const round = await this.prisma.group_rounds.findFirst({
      where: { session_id: sessionId, round_index: roundIndex },
    });

    if (!round) {
      throw new BadRequestException("Round not found");
    }

    const updatedRound = await this.prisma.group_rounds.update({
      where: { id: round.id },
      data: {
        prompt_json: {
          prompt_text: dto.prompt_text,
          options: dto.options || null,
          linked_highlight_ids: dto.linked_highlight_ids || [],
        },
      },
    });

    // Emit WebSocket event for real-time update
    this.wsGateway.emitToSession(sessionId, StudyGroupEvent.PROMPT_UPDATED, {
      sessionId,
      roundId: round.id,
      roundIndex,
      prompt: dto.prompt_text,
    });

    return updatedRound;
  }

  async advanceRound(
    sessionId: string,
    roundIndex: number,
    user_id: string,
    toStatus: RoundStatus,
  ) {
    const session = await this.groupSessionsService.getSession(
      sessionId,
      user_id,
    );

    // Check permissions using loaded session data (no extra queries)
    this.assertFacilitatorPermission(session, user_id);

    const round = await this.prisma.group_rounds.findFirst({
      where: { session_id: sessionId, round_index: roundIndex },
    });

    if (!round) {
      throw new BadRequestException("Round not found");
    }

    // Validate transition with accountability gates
    await this.validateTransition(sessionId, round.id, toStatus);

    const updatedRound = await this.prisma.group_rounds.update({
      where: { id: round.id },
      data: { status: toStatus },
    });

    // Emit WebSocket event for real-time update
    this.wsGateway.emitToSession(sessionId, StudyGroupEvent.ROUND_ADVANCED, {
      sessionId,
      roundId: round.id,
      roundIndex,
      status: toStatus,
    });

    this.logger.log(
      `Round ${roundIndex} advanced to ${toStatus} in session ${sessionId}`,
    );

    return updatedRound;
  }

  async submitEvent(sessionId: string, user_id: string, dto: SubmitEventDto) {
    const session = await this.groupSessionsService.getSession(
      sessionId,
      user_id,
    );

    // Find member in already-loaded session members
    const member = (session as any).group_session_members.find(
      (m: any) => m.user_id === user_id,
    );

    if (!member || member.attendance_status !== "JOINED") {
      throw new ForbiddenException("Must be a joined session member");
    }

    // Get round
    const round = await this.prisma.group_rounds.findFirst({
      where: { session_id: sessionId, round_index: dto.round_index },
    });

    if (!round) {
      throw new BadRequestException("Round not found");
    }

    // Validate event type permissions
    if (dto.event_type === "GROUP_EXPLANATION_SUBMIT") {
      if (member.assigned_role !== "SCRIBE") {
        throw new ForbiddenException(
          "Only SCRIBE can submit group explanation",
        );
      }
    }

    // Record event
    const event = await this.prisma.group_events.create({
      data: {
        id: crypto.randomUUID(),
        session_id: sessionId,
        round_id: round.id,
        user_id,
        event_type: dto.event_type,
        payload_json: dto.payload,
      },
    });

    // Emit WebSocket event for real-time update
    const wsEventType =
      dto.event_type === "PI_VOTE_SUBMIT"
        ? StudyGroupEvent.VOTE_SUBMITTED
        : dto.event_type === "PI_REVOTE_SUBMIT"
          ? StudyGroupEvent.REVOTE_SUBMITTED
          : StudyGroupEvent.SESSION_UPDATED;

    this.wsGateway.emitToSession(sessionId, wsEventType, {
      sessionId,
      roundId: round.id,
      roundIndex: dto.round_index,
      user_id,
      eventType: dto.event_type,
    });

    // Special handling for GROUP_EXPLANATION_SUBMIT
    if (dto.event_type === "GROUP_EXPLANATION_SUBMIT") {
      await this.createSharedCard(sessionId, round.id, user_id, dto.payload);

      // Emit shared card created event
      this.wsGateway.emitToSession(
        sessionId,
        StudyGroupEvent.SHARED_CARD_CREATED,
        {
          sessionId,
          roundId: round.id,
          roundIndex: dto.round_index,
        },
      );
    }

    this.logger.log(
      `Event ${dto.event_type} submitted for round ${round.id} by user ${user_id}`,
    );

    return event;
  }

  async getEvents(sessionId: string, roundIndex?: number) {
    const where: any = { session_id: sessionId };

    if (roundIndex !== undefined) {
      const round = await this.prisma.group_rounds.findFirst({
        where: { session_id: sessionId, round_index: roundIndex },
      });
      if (round) {
        where.round_id = round.id;
      }
    }

    return this.prisma.group_events.findMany({
      where,
      orderBy: { created_at: "asc" },
      include: {
        group_rounds: {
          select: { round_index: true },
        },
      },
    });
  }

  async getSharedCards(sessionId: string) {
    return this.prisma.shared_cards.findMany({
      where: { session_id: sessionId },
      include: {
        group_rounds: {
          select: { round_index: true, status: true },
        },
      },
      orderBy: { created_at: "asc" },
    });
  }

  // Accountability gates with 409 Conflict responses
  private async validateTransition(
    sessionId: string,
    roundId: string,
    toStatus: RoundStatus,
  ) {
    switch (toStatus) {
      case "DISCUSSING":
        await this.assertAllVoted(sessionId, roundId, "PI_VOTE_SUBMIT");
        break;
      case "EXPLAINING":
        await this.assertAllVoted(sessionId, roundId, "PI_REVOTE_SUBMIT");
        break;
      case "DONE":
        await this.assertExplanationPresent(roundId);
        break;
    }
  }

  private async assertAllVoted(
    sessionId: string,
    roundId: string,
    eventType: string,
  ) {
    // Count joined members
    const joinedCount = await this.prisma.group_session_members.count({
      where: { session_id: sessionId, attendance_status: "JOINED" },
    });

    // Count unique voters
    const votes = await this.prisma.group_events.groupBy({
      by: ["user_id"],
      where: { round_id: roundId, event_type: eventType },
    });

    const votedCount = votes.length;

    if (votedCount < joinedCount) {
      const missing = joinedCount - votedCount;
      this.logger.warn(
        `Cannot advance: ${missing} members haven't ${eventType}`,
      );

      throw new ConflictException({
        statusCode: 409,
        message: `Cannot advance: ${missing} member(s) haven't ${eventType}`,
        required: joinedCount,
        current: votedCount,
        missing,
      });
    }
  }

  private async assertExplanationPresent(roundId: string) {
    const explanation = await this.prisma.group_events.findFirst({
      where: { round_id: roundId, event_type: "GROUP_EXPLANATION_SUBMIT" },
    });

    if (!explanation) {
      throw new ConflictException({
        statusCode: 409,
        message:
          "SCRIBE must submit group explanation before advancing to DONE",
      });
    }
  }

  // Create or update shared card
  private async createSharedCard(
    sessionId: string,
    roundId: string,
    userId: string,
    payload: any,
  ) {
    // Check if card already exists (idempotent)
    const existing = await this.prisma.shared_cards.findUnique({
      where: { round_id: roundId },
    });

    if (existing) {
      // Update existing card
      return this.prisma.shared_cards.update({
        where: { round_id: roundId },
        data: {
          card_json: {
            prompt: payload.prompt || (existing.card_json as any)["prompt"],
            groupAnswer: payload.group_choice || payload.groupAnswer,
            explanation: payload.explanation,
            linkedHighlightIds: payload.linked_highlight_ids || [],
            keyTerms: payload.key_terms || [],
          },
        },
      });
    }

    // Create new card
    return this.prisma.shared_cards.create({
      data: {
        id: crypto.randomUUID(),
        session_id: sessionId,
        round_id: roundId,
        created_by_user_id: userId,
        card_json: {
          prompt: payload.prompt || "",
          groupAnswer: payload.group_choice || payload.groupAnswer,
          explanation: payload.explanation,
          linkedHighlightIds: payload.linked_highlight_ids || [],
          keyTerms: payload.key_terms || [],
        },
      },
    });
  }

  // Helper: Check if user has facilitator-level permissions
  // Uses session data loaded by getSession to avoid extra queries
  private assertFacilitatorPermission(session: any, user_id: string): void {
    // Find member in already-loaded session members
    const sessionMember = session.group_session_members?.find(
      (m: any) => m.user_id === user_id,
    );

    // Find group member in already-loaded group members
    const groupMember = session.study_groups?.study_group_members?.find(
      (m: any) => m.user_id === user_id,
    );

    const canPerform =
      sessionMember?.assigned_role === "FACILITATOR" ||
      ["OWNER", "MOD"].includes(groupMember?.role);

    if (!canPerform) {
      throw new ForbiddenException(
        "Only FACILITATOR or group OWNER/MOD can perform this action",
      );
    }
  }
}
