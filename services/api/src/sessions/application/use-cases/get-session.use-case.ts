import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { ISessionsRepository } from "../../domain/sessions.repository.interface";

@Injectable()
export class GetSessionUseCase {
  constructor(
    @Inject(ISessionsRepository)
    private readonly sessionsRepository: ISessionsRepository,
  ) {}

  async execute(sessionId: string, userId: string): Promise<any> {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    if (session.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    // Event Transformation Logic (Previously in service)
    // Extract messages and quick replies from events
    // Ideally this transformation belongs to a DTO mapper or Presentation Layer?
    // For now, keeping it here to match service behavior

    // We need events loaded, Repo implementation includes them
    const events = session.events || [];

    const messages = events
      .filter((event) => event.payload && typeof event.payload === "object")
      .filter(
        (event) =>
          event.payload.role || event.payload.text || event.payload.content,
      )
      .map((event) => ({
        id: event.id,
        role: event.payload.role || "SYSTEM",
        content:
          event.payload.text ||
          event.payload.content ||
          event.payload.message ||
          "",
        timestamp: event.createdAt,
      }));

    // Extract quickReplies from last event that has them
    const lastEventWithReplies = [...events]
      .reverse()
      .find((e) => e.payload?.quickReplies);

    const quickReplies = lastEventWithReplies
      ? lastEventWithReplies.payload.quickReplies
      : [];

    return {
      session,
      content: session.content,
      messages,
      quickReplies,
    };
  }
}
