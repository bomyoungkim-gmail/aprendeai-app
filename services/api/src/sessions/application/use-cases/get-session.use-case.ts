import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { ISessionsRepository } from "../../domain/sessions.repository.interface";
import { buildSessionContext } from "../../helpers/context-builder";
import { PrismaService } from "../../../prisma/prisma.service";
import { GamificationService } from "../../../gamification/gamification.service";
import { ScaffoldingInitializerService } from "../../../decision/application/scaffolding-initializer.service"; // SCRIPT 03
import { ScaffoldingBehaviorAdapterService } from "../../../decision/application/scaffolding-behavior-adapter.service"; // SCRIPT 03 - Fase 3

@Injectable()
export class GetSessionUseCase {
  constructor(
    @Inject(ISessionsRepository)
    private readonly sessionsRepository: ISessionsRepository,
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
    private readonly scaffoldingInitializer: ScaffoldingInitializerService, // SCRIPT 03
    private readonly scaffoldingBehaviorAdapter: ScaffoldingBehaviorAdapterService, // SCRIPT 03 - Fase 3
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

    // Build decision_policy from context-builder
    let decision_policy = null;
    try {
      const contextWithPolicy = await buildSessionContext(
        sessionId,
        userId,
        session.contentId,
        { 
          prisma: this.prisma, 
          gamificationService: this.gamificationService,
          scaffoldingInitializer: this.scaffoldingInitializer, // SCRIPT 03
          scaffoldingBehaviorAdapter: this.scaffoldingBehaviorAdapter, // SCRIPT 03 - Fase 3
        },
        undefined, // No uiMode override in get-session
      );
      decision_policy = contextWithPolicy.decision_policy;
    } catch (error) {
      // Log but don't fail if policy fetch fails
      console.warn('Failed to fetch decision_policy:', error);
    }

    return {
      session,
      content: session.content,
      messages,
      quickReplies,
      decision_policy, // Include decision_policy for Python AI Service
    };
  }
}
