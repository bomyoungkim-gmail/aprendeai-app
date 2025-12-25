import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { GroupSessionsService } from "./group-sessions.service";
import { SendChatMessageDto } from "./dto/send-chat-message.dto";

@Injectable()
export class GroupChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groupSessionsService: GroupSessionsService,
  ) {}

  async sendMessage(
    sessionId: string,
    userId: string,
    dto: SendChatMessageDto,
  ) {
    // Verify user is session member
    const session = await this.groupSessionsService.getSession(
      sessionId,
      userId,
    );

    // Get the round
    const round = session.rounds?.find((r) => r.roundIndex === dto.roundIndex);
    if (!round) {
      throw new BadRequestException("Round not found");
    }

    // Sanitize message (basic XSS prevention)
    const sanitizedMessage = dto.message
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<[^>]*>/g, ""); // Strip HTML tags

    if (!sanitizedMessage) {
      throw new BadRequestException(
        "Message cannot be empty after sanitization",
      );
    }

    // Create chat message
    const chatMessage = await this.prisma.groupChatMessage.create({
      data: {
        sessionId,
        roundId: round.id,
        userId,
        message: sanitizedMessage,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get user's role in session
    const sessionMember = session.members?.find((m) => m.userId === userId);

    return {
      ...chatMessage,
      userRole: sessionMember?.assignedRole || null,
    };
  }

  async getMessages(sessionId: string, roundIndex: number, userId: string) {
    // Verify user is session member
    const session = await this.groupSessionsService.getSession(
      sessionId,
      userId,
    );

    // Get the round
    const round = session.rounds?.find((r) => r.roundIndex === roundIndex);
    if (!round) {
      throw new BadRequestException("Round not found");
    }

    // Fetch messages for this round
    const messages = await this.prisma.groupChatMessage.findMany({
      where: {
        sessionId,
        roundId: round.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Add role information
    const messagesWithRoles = messages.map((msg) => {
      const sessionMember = session.members?.find(
        (m) => m.userId === msg.userId,
      );
      return {
        ...msg,
        userRole: sessionMember?.assignedRole || null,
      };
    });

    return messagesWithRoles;
  }
}
