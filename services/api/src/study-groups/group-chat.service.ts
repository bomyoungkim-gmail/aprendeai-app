import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { GroupSessionsService } from "./group-sessions.service";
import { SendChatMessageDto } from "./dto/send-chat-message.dto";
import * as crypto from "crypto";

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
    const round = (session as any).group_rounds?.find(
      (r: any) => r.round_index === dto.round_index,
    );
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
    const chatMessage = await this.prisma.group_chat_messages.create({
      data: {
        id: crypto.randomUUID(),
        session_id: sessionId,
        round_id: round.id,
        user_id: userId,
        message: sanitizedMessage,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Get user's role in session
    const sessionMember = (session as any).group_session_members?.find(
      (m: any) => m.user_id === userId,
    );

    return {
      ...chatMessage,
      userRole: sessionMember?.assigned_role || null,
    };
  }

  async getMessages(sessionId: string, roundIndex: number, userId: string) {
    // Verify user is session member
    const session = await this.groupSessionsService.getSession(
      sessionId,
      userId,
    );

    // Get the round
    const round = (session as any).group_rounds?.find(
      (r: any) => r.round_index === roundIndex,
    );
    if (!round) {
      throw new BadRequestException("Round not found");
    }

    // Fetch messages for this round
    const messages = await this.prisma.group_chat_messages.findMany({
      where: {
        session_id: sessionId,
        round_id: round.id,
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // Add role information
    const messagesWithRoles = messages.map((msg) => {
      const sessionMember = (session as any).group_session_members?.find(
        (m: any) => m.user_id === msg.user_id,
      );
      return {
        ...msg,
        userRole: sessionMember?.assigned_role || null,
      };
    });

    return messagesWithRoles;
  }
}
