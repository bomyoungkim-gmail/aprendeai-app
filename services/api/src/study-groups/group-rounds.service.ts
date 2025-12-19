import { Injectable, BadRequestException, ForbiddenException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GroupSessionsService } from './group-sessions.service';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { SubmitEventDto } from './dto/submit-event.dto';
import { RoundStatus } from '@prisma/client';

@Injectable()
export class GroupRoundsService {
  private readonly logger = new Logger(GroupRoundsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly groupSessionsService: GroupSessionsService,
  ) {}

  async updatePrompt(sessionId: string, roundIndex: number, userId: string, dto: UpdatePromptDto) {
    const session = await this.groupSessionsService.getSession(sessionId, userId);

    // Check permissions using loaded session data (no extra queries)
    this.assertFacilitatorPermission(session, userId);

    const round = await this.prisma.groupRound.findFirst({
      where: { sessionId, roundIndex },
    });

    if (!round) {
      throw new BadRequestException('Round not found');
    }

    return this.prisma.groupRound.update({
      where: { id: round.id },
      data: {
        promptJson: {
          prompt_text: dto.promptText,
          options: dto.options || null,
          linked_highlight_ids: dto.linkedHighlightIds || [],
        },
      },
    });
  }

  async advanceRound(sessionId: string, roundIndex: number, userId: string, toStatus: RoundStatus) {
    const session = await this.groupSessionsService.getSession(sessionId, userId);

    // Check permissions using loaded session data (no extra queries)
    this.assertFacilitatorPermission(session, userId);

    const round = await this.prisma.groupRound.findFirst({
      where: { sessionId, roundIndex },
    });

    if (!round) {
      throw new BadRequestException('Round not found');
    }

    // Validate transition with accountability gates
    await this.validateTransition(sessionId, round.id, toStatus);

    return this.prisma.groupRound.update({
      where: { id: round.id },
      data: { status: toStatus },
    });
  }

  async submitEvent(sessionId: string, userId: string, dto: SubmitEventDto) {
    const session = await this.groupSessionsService.getSession(sessionId, userId);
    
    // Find member in already-loaded session members
    const member = session.members.find((m: any) => m.userId === userId);

    if (!member || member.attendanceStatus !== 'JOINED') {
      throw new ForbiddenException('Must be a joined session member');
    }

    // Get round
    const round = await this.prisma.groupRound.findFirst({
      where: { sessionId, roundIndex: dto.roundIndex },
    });

    if (!round) {
      throw new BadRequestException('Round not found');
    }

    // Validate event type permissions
    if (dto.eventType === 'GROUP_EXPLANATION_SUBMIT') {
      if (member.assignedRole !== 'SCRIBE') {
        throw new ForbiddenException('Only SCRIBE can submit group explanation');
      }
    }

    // Record event
    const event = await this.prisma.groupEvent.create({
      data: {
        sessionId,
        roundId: round.id,
        userId,
        eventType: dto.eventType,
        payloadJson: dto.payload,
      },
    });

    // Special handling for GROUP_EXPLANATION_SUBMIT
    if (dto.eventType === 'GROUP_EXPLANATION_SUBMIT') {
      await this.createSharedCard(sessionId, round.id, userId, dto.payload);
    }

    this.logger.log(`Event ${dto.eventType} submitted for round ${round.id} by user ${userId}`);

    return event;
  }

  async getEvents(sessionId: string, roundIndex?: number) {
    const where: any = { sessionId };

    if (roundIndex !== undefined) {
      const round = await this.prisma.groupRound.findFirst({
        where: { sessionId, roundIndex },
      });
      if (round) {
        where.roundId = round.id;
      }
    }

    return this.prisma.groupEvent.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        round: {
          select: { roundIndex: true },
        },
      },
    });
  }

  async getSharedCards(sessionId: string) {
    return this.prisma.sharedCard.findMany({
      where: { sessionId },
      include: {
        round: {
          select: { roundIndex: true, status: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Accountability gates with 409 Conflict responses
  private async validateTransition(sessionId: string, roundId: string, toStatus: RoundStatus) {
    switch (toStatus) {
      case 'DISCUSSING':
        await this.assertAllVoted(sessionId, roundId, 'PI_VOTE_SUBMIT');
        break;
      case 'EXPLAINING':
        await this.assertAllVoted(sessionId, roundId, 'PI_REVOTE_SUBMIT');
        break;
      case 'DONE':
        await this.assertExplanationPresent(roundId);
        break;
    }
  }

  private async assertAllVoted(sessionId: string, roundId: string, eventType: string) {
    // Count joined members
    const joinedCount = await this.prisma.groupSessionMember.count({
      where: { sessionId, attendanceStatus: 'JOINED' },
    });

    // Count unique voters
    const votes = await this.prisma.groupEvent.groupBy({
      by: ['userId'],
      where: { roundId, eventType },
    });

    const votedCount = votes.length;

    if (votedCount < joinedCount) {
      const missing = joinedCount - votedCount;
      this.logger.warn(`Cannot advance: ${missing} members haven't ${eventType}`);

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
    const explanation = await this.prisma.groupEvent.findFirst({
      where: { roundId, eventType: 'GROUP_EXPLANATION_SUBMIT' },
    });

    if (!explanation) {
      throw new ConflictException({
        statusCode: 409,
        message: 'SCRIBE must submit group explanation before advancing to DONE',
      });
    }
  }

  // Create or update shared card
  private async createSharedCard(sessionId: string, roundId: string, userId: string, payload: any) {
    // Check if card already exists (idempotent)
    const existing = await this.prisma.sharedCard.findUnique({
      where: { roundId },
    });

    if (existing) {
      // Update existing card
      return this.prisma.sharedCard.update({
        where: { roundId },
        data: {
          cardJson: {
            prompt: payload.prompt || existing.cardJson['prompt'],
            groupAnswer: payload.group_choice || payload.groupAnswer,
            explanation: payload.explanation,
            linkedHighlightIds: payload.linked_highlight_ids || [],
            keyTerms: payload.key_terms || [],
          },
        },
      });
    }

    // Create new card
    return this.prisma.sharedCard.create({
      data: {
        sessionId,
        roundId,
        createdByUserId: userId,
        cardJson: {
          prompt: payload.prompt || '',
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
  private assertFacilitatorPermission(session: any, userId: string): void {
    // Find member in already-loaded session members
    const sessionMember = session.members?.find((m: any) => m.userId === userId);
    
    // Find group member in already-loaded group members
    const groupMember = session.group?.members?.find((m: any) => m.userId === userId);

    const canPerform = 
      sessionMember?.assignedRole === 'FACILITATOR' || 
      ['OWNER', 'MOD'].includes(groupMember?.role);

    if (!canPerform) {
      throw new ForbiddenException('Only FACILITATOR or group OWNER/MOD can perform this action');
    }
  }
}
