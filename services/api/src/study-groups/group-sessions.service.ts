import { Injectable, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { StudyGroupsService } from "./study-groups.service";
import { CreateSessionDto } from "./dto/create-session.dto";
import { group_sessions as GroupSession, SessionRole } from "@prisma/client";
import { StudyGroupsWebSocketGateway } from "../websocket/study-groups-ws.gateway";
import { StudyGroupEvent } from "../websocket/events";
import * as crypto from "crypto";

@Injectable()
export class GroupSessionsService {
  private readonly logger = new Logger(GroupSessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly studyGroupsService: StudyGroupsService,
    private readonly wsGateway: StudyGroupsWebSocketGateway,
  ) {}

  async createSession(
    group_id: string,
    user_id: string,
    dto: CreateSessionDto,
  ): Promise<GroupSession> {
    // Verify user is active member
    await this.studyGroupsService.assertMembership(group_id, user_id);

    // Verify content exists
    const content = await this.prisma.contents.findUnique({
      where: { id: dto.content_id },
    });

    if (!content) {
      throw new BadRequestException("Content not found");
    }

    // Get active members
    const members = await this.studyGroupsService.getActiveMembers(group_id);

    if (members.length < 2) {
      throw new BadRequestException(
        "Minimum 2 active members required for PI session",
      );
    }

    // Create session with rounds and role assignments in transaction
    const newSession = await this.prisma.$transaction(async (tx) => {
      // 1. Create session
      const session = await tx.group_sessions.create({
        data: {
          id: crypto.randomUUID(),
          study_groups: { connect: { id: group_id } },
          contents: { connect: { id: dto.content_id } },
          mode: dto.mode || "PI_SPRINT",
          layer: dto.layer || "L1",
          status: "CREATED",
        },
      });

      // 2. Assign roles (deterministic rotation)
      await this.assignRoles(tx, session.id, group_id, members);

      // 3. Create rounds
      const timers = this.getDefaultTimers(dto.layer || "L1");
      const roundsData = [];

      for (let i = 1; i <= dto.rounds_count; i++) {
        roundsData.push({
          id: crypto.randomUUID(),
          session_id: session.id,
          round_index: i,
          round_type: "PI",
          prompt_json: { prompt_text: "", options: null },
          timing_json: timers,
          status: "CREATED",
        });
      }

      await tx.group_rounds.createMany({ data: roundsData });

      this.logger.log(
        `Created session ${session.id} with ${dto.rounds_count} rounds for group ${group_id}`,
      );

      return session;
    });

    return this.getSession(newSession.id, user_id);
  }

  async getSession(sessionId: string, user_id: string) {
    const session = await this.prisma.group_sessions.findUnique({
      where: { id: sessionId },
      include: {
        study_groups: {
          include: {
            study_group_members: true, // Eager load for permission checks
          },
        },
        contents: {
          select: { id: true, title: true, type: true },
        },
        group_session_members: {
          include: {
            users: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        group_rounds: {
          orderBy: { round_index: "asc" },
        },
      },
    });

    if (!session) {
      throw new BadRequestException("Session not found");
    }

    // Verify user is member
    await this.studyGroupsService.assertMembership(session.group_id, user_id);

    return session;
  }

  async startSession(sessionId: string, user_id: string): Promise<void> {
    const session = await this.getSession(sessionId, user_id);

    if (session.status !== "CREATED") {
      throw new BadRequestException("Session already started");
    }

    await this.prisma.group_sessions.update({
      where: { id: sessionId },
      data: {
        status: "RUNNING",
        starts_at: new Date(),
      },
    });

    // Emit WebSocket event for real-time update
    this.wsGateway.emitToSession(sessionId, StudyGroupEvent.SESSION_STARTED, {
      sessionId,
      status: "RUNNING",
      startedBy: user_id,
    });

    this.logger.log(`Started session ${sessionId}`);
  }

  async updateSessionStatus(
    sessionId: string,
    user_id: string,
    status: string,
  ): Promise<void> {
    const session = await this.getSession(sessionId, user_id);

    // Only FACILITATOR or OWNER/MOD can update status
    const member = await this.prisma.group_session_members.findUnique({
      where: { session_id_user_id: { session_id: sessionId, user_id } },
    });

    const groupMember = await this.prisma.study_group_members.findUnique({
      where: { group_id_user_id: { group_id: session.group_id, user_id } },
    });

    const canUpdate =
      member?.assigned_role === "FACILITATOR" ||
      ["OWNER", "MOD"].includes(groupMember?.role);

    if (!canUpdate) {
      throw new BadRequestException(
        "Only FACILITATOR or group OWNER/MOD can update session status",
      );
    }

    const updates: any = { status };
    if (status === "FINISHED") {
      updates.ends_at = new Date();
    }

    await this.prisma.group_sessions.update({
      where: { id: sessionId },
      data: updates,
    });
  }

  async getGroupSessions(group_id: string) {
    return this.prisma.group_sessions.findMany({
      where: { group_id },
      include: {
        _count: {
          select: { group_rounds: true },
        },
      },
      orderBy: { created_at: "desc" },
    });
  }

  // Deterministic role assignment algorithm
  private async assignRoles(
    tx: any,
    sessionId: string,
    group_id: string,
    members: any[],
  ) {
    // Stable sort by user_id
    const sorted = [...members].sort((a, b) =>
      a.user_id.localeCompare(b.user_id),
    );

    // Get number of completed sessions for rotation offset
    const completedCount = await tx.group_sessions.count({
      where: {
        group_id,
        status: { in: ["FINISHED"] },
      },
    });

    const offset = completedCount % sorted.length;

    // Role priority order
    const roles: SessionRole[] = [
      "FACILITATOR",
      "TIMEKEEPER",
      "CLARIFIER",
      "CONNECTOR",
      "SCRIBE",
    ];

    const assignments = [];
    for (let i = 0; i < Math.min(sorted.length, 5); i++) {
      const memberIndex = (i + offset) % sorted.length;
      const role = roles[i];

      assignments.push({
        session_id: sessionId,
        user_id: sorted[memberIndex].user_id,
        assigned_role: role,
        attendance_status: "JOINED",
      });
    }

    await tx.group_session_members.createMany({ data: assignments });

    this.logger.log(
      `Assigned ${assignments.length} roles for session ${sessionId}, offset=${offset}`,
    );
  }

  // Get default timers based on layer
  private getDefaultTimers(layer: string) {
    const isAdvanced = layer === "L2" || layer === "L3";

    return {
      voteSec: isAdvanced ? 90 : 60,
      discussSec: isAdvanced ? 240 : 180,
      revoteSec: isAdvanced ? 90 : 60,
      explainSec: isAdvanced ? 240 : 180,
    };
  }
}
