import { Injectable, Inject, BadRequestException, NotFoundException, ForbiddenException, Logger } from "@nestjs/common";
import { ISessionsRepository } from "../../domain/sessions.repository.interface";
import { ReadingSession } from "../../domain/reading-session.entity";
import { ICornellRepository } from "../../../cornell/domain/interfaces/cornell.repository.interface";

@Injectable()
export class AdvancePhaseUseCase {
  private readonly logger = new Logger(AdvancePhaseUseCase.name);

  constructor(
    @Inject(ISessionsRepository) private readonly sessionsRepository: ISessionsRepository,
    @Inject(ICornellRepository) private readonly cornellRepository: ICornellRepository,
  ) {}

  async execute(sessionId: string, userId: string, toPhase: "POST" | "FINISHED"): Promise<ReadingSession> {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) throw new NotFoundException("Session not found");
    if (session.userId !== userId) throw new ForbiddenException("Access denied");

    // Validate transition
    if (toPhase === "POST") {
        if (session.phase !== "PRE" && session.phase !== "DURING") {
            throw new BadRequestException("Can only advance to POST from PRE or DURING phase");
        }
    }

    if (toPhase === "FINISHED") {
      if (session.phase !== "POST") {
        throw new BadRequestException("Can only finish from POST phase");
      }
      // Validate DoD
      await this.validatePostCompletion(sessionId, userId, session.contentId);
    }

    const updated = await this.sessionsRepository.update(sessionId, {
        phase: toPhase,
        finishedAt: toPhase === "FINISHED" ? new Date() : undefined
    });

    return updated;
  }

  private async validatePostCompletion(sessionId: string, userId: string, contentId: string) {
      // 1. Check Cornell Notes has summary
      const notes = await this.cornellRepository.findByContentAndUser(contentId, userId);
  
      if (!notes?.summary || !notes.summary.trim()) {
        throw new BadRequestException(
          "Cornell Notes summary is required to complete the session. Please add a summary in the Cornell Notes section.",
        );
      }
  
      // 2. Get all events for validation
      const events = await this.sessionsRepository.findEvents(sessionId);

      // 3. Check at least 1 quiz/checkpoint response
      const hasQuiz = events.some(e => 
          e.eventType === "QUIZ_RESPONSE" || e.eventType === "CHECKPOINT_RESPONSE"
      );
  
      if (!hasQuiz) {
        throw new BadRequestException(
          "At least 1 quiz or checkpoint response is required to complete the session.",
        );
      }
  
      // 4. Check at least 1 production submission
      const hasProduction = events.some(e => e.eventType === "PRODUCTION_SUBMIT");
  
      if (!hasProduction) {
        throw new BadRequestException(
          "Production text submission is required to complete the session.",
        );
      }
    }
}
