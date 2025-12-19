import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StudyGroupsService } from './study-groups.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { GroupSession, SessionRole } from '@prisma/client';

@Injectable()
export class GroupSessionsService {
  private readonly logger = new Logger(GroupSessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly studyGroupsService: StudyGroupsService,
  ) {}

  async createSession(groupId: string, userId: string, dto: CreateSessionDto): Promise<GroupSession> {
    // Verify user is active member
    await this.studyGroupsService.assertMembership(groupId, userId);

    // Verify content exists
    const content = await this.prisma.content.findUnique({
      where: { id: dto.contentId },
    });

    if (!content) {
      throw new BadRequestException('Content not found');
    }

    // Get active members
    const members = await this.studyGroupsService.getActiveMembers(groupId);

    if (members.length < 2) {
      throw new BadRequestException('Minimum 2 active members required for PI session');
    }

    // Create session with rounds and role assignments in transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Create session
      const session = await tx.groupSession.create({
        data: {
          groupId,
          contentId: dto.contentId,
          mode: dto.mode || 'PI_SPRINT',
          layer: dto.layer || 'L1',
          status: 'CREATED',
        },
      });

      // 2. Assign roles (deterministic rotation)
      await this.assignRoles(tx, session.id, groupId, members);

      // 3. Create rounds
      const timers = this.getDefaultTimers(dto.layer || 'L1');
      const roundsData = [];

      for (let i = 1; i <= dto.roundsCount; i++) {
        roundsData.push({
          sessionId: session.id,
          roundIndex: i,
          roundType: 'PI',
          promptJson: { prompt_text: '', options: null },
          timingJson: timers,
          status: 'CREATED',
        });
      }

      await tx.groupRound.createMany({ data: roundsData });

      this.logger.log(`Created session ${session.id} with ${dto.roundsCount} rounds for group ${groupId}`);

      return session;
    });
  }

  async getSession(sessionId: string, userId: string) {
    const session = await this.prisma.groupSession.findUnique({
      where: { id: sessionId },
      include: {
        group: true,
        content: {
          select: { id: true, title: true, type: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        rounds: {
          orderBy: { roundIndex: 'asc' },
        },
      },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    // Verify user is member
    await this.studyGroupsService.assertMembership(session.groupId, userId);

    return session;
  }

  async startSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.getSession(sessionId, userId);

    if (session.status !== 'CREATED') {
      throw new BadRequestException('Session already started');
    }

    await this.prisma.groupSession.update({
      where: { id: sessionId },
      data: {
        status: 'RUNNING',
        startsAt: new Date(),
      },
    });

    this.logger.log(`Started session ${sessionId}`);
  }

  async updateSessionStatus(sessionId: string, userId: string, status: string): Promise<void> {
    const session = await this.getSession(sessionId, userId);

    // Only FACILITATOR or OWNER/MOD can update status
    const member = await this.prisma.groupSessionMember.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });

    const groupMember = await this.prisma.studyGroupMember.findUnique({
      where: { groupId_userId: { groupId: session.groupId, userId } },
    });

    const canUpdate = member?.assignedRole === 'FACILITATOR' || ['OWNER', 'MOD'].includes(groupMember?.role);

    if (!canUpdate) {
      throw new BadRequestException('Only FACILITATOR or group OWNER/MOD can update session status');
    }

    const updates: any = { status };
    if (status === 'FINISHED') {
      updates.endsAt = new Date();
    }

    await this.prisma.groupSession.update({
      where: { id: sessionId },
      data: updates,
    });
  }

  // Deterministic role assignment algorithm
  private async assignRoles(tx: any, sessionId: string, groupId: string, members: any[]) {
    // Stable sort by userId (alphabetical)
    const sorted = [...members].sort((a, b) => a.userId.localeCompare(b.userId));

    // Get number of completed sessions for rotation offset
    const completedCount = await tx.groupSession.count({
      where: {
        groupId,
        status: { in: ['FINISHED', 'CANCELLED'] },
      },
    });

    const offset = completedCount % sorted.length;

    // Role priority order
    const roles: SessionRole[] = ['FACILITATOR', 'TIMEKEEPER', 'CLARIFIER', 'CONNECTOR', 'SCRIBE'];

    const assignments = [];
    for (let i = 0; i < Math.min(sorted.length, 5); i++) {
      const memberIndex = (i + offset) % sorted.length;
      const role = roles[i];

      assignments.push({
        sessionId,
        userId: sorted[memberIndex].userId,
        assignedRole: role,
        attendanceStatus: 'JOINED',
      });
    }

    await tx.groupSessionMember.createMany({ data: assignments });

    this.logger.log(`Assigned ${assignments.length} roles for session ${sessionId}, offset=${offset}`);
  }

  // Get default timers based on layer
  private getDefaultTimers(layer: string) {
    const isAdvanced = layer === 'L2' || layer === 'L3';

    return {
      voteSec: isAdvanced ? 90 : 60,
      discussSec: isAdvanced ? 240 : 180,
      revoteSec: isAdvanced ? 90 : 60,
      explainSec: isAdvanced ? 240 : 180,
    };
  }
}
