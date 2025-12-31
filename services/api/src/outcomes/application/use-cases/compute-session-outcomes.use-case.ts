import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { IOutcomesRepository } from "../../domain/outcomes.repository.interface";
import { SessionOutcome } from "../../domain/session-outcome.entity";
import { ISessionsRepository } from "../../../sessions/domain/sessions.repository.interface";
import { IContentRepository } from "../../../cornell/domain/content.repository.interface";

@Injectable()
export class ComputeSessionOutcomesUseCase {
  constructor(
    @Inject(ISessionsRepository) private readonly sessionsRepository: ISessionsRepository,
    @Inject(IContentRepository) private readonly contentRepository: IContentRepository,
    @Inject(IOutcomesRepository) private readonly outcomesRepository: IOutcomesRepository,
  ) {}

  async execute(sessionId: string): Promise<SessionOutcome> {
    const session = await this.sessionsRepository.findById(sessionId);

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const content = await this.contentRepository.findById(session.contentId);
    if (!content) {
        throw new NotFoundException(`Content not found for session ${sessionId}`);
    }

    // Attach full content to session object for calculation methods
    // We can use a composite object or typed cast if needed, or update methods signatures.
    // The methods expect 'session' to have 'session_events' and 'contents' property (Prisma style).
    // We should refactor the helper methods to use Domain Entity structure.
    
    // Domain Entity 'ReadingSession' has 'events' property instead of 'session_events'.
    // And 'content' property (summary) instead of 'contents'.
    
    // Let's adapt the helpers.
    const validationContext = {
       ...session,
       session_events: session.events || [], // Map for compatibility or refactor helpers
       contents: content // inject full content
    };

    // Calculate three outcome scores
    const comprehension = await this.calculateComprehension(validationContext);
    const production = await this.calculateProduction(validationContext);
    const frustration = await this.calculateFrustration(validationContext);

    const outcome = new SessionOutcome({
      readingSessionId: sessionId,
      comprehensionScore: comprehension,
      productionScore: production,
      frustrationIndex: frustration,
      computedAt: new Date(),
    });

    return this.outcomesRepository.upsert(outcome);
  }

  private async calculateComprehension(session: any): Promise<number> {
    let score = 50; 

    const quizEvents = session.session_events.filter(
      (e) => e.event_type === "QUIZ_RESPONSE",
    );
    if (quizEvents.length > 0) {
      const correctCount = quizEvents.filter(
        (e) => (e.payload_json as any)?.correct === true,
      ).length;
      const quizAccuracy = correctCount / quizEvents.length;
      score += (quizAccuracy - 0.5) * 40; 
    }

    const checkpointEvents = session.session_events.filter(
      (e) => e.event_type === "CHECKPOINT_RESPONSE",
    );
    if (checkpointEvents.length > 0) {
      const avgLength =
        checkpointEvents.reduce(
          (sum, e) => sum + ((e.payload_json as any)?.response?.length || 0),
          0,
        ) / checkpointEvents.length;

      if (avgLength > 50) score += 10;
      else if (avgLength < 20) score -= 10;
    }

    const unknownWordEvents = session.session_events.filter(
      (e) => e.event_type === "MARK_UNKNOWN_WORD",
    );
    const textLength = session.contents?.raw_text?.length || 1000;
    const unknownRate = unknownWordEvents.length / (textLength / 100);

    if (unknownRate > 2) score -= 15;
    else if (unknownRate < 0.5) score += 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private async calculateProduction(session: any): Promise<number> {
    let score = 50;

    const keyIdeaEvents = session.session_events.filter(
      (e) => e.event_type === "MARK_KEY_IDEA",
    );

    if (keyIdeaEvents.length === 0) {
      score = 5;
    } else if (keyIdeaEvents.length < 3) {
      score = 25;
    } else if (keyIdeaEvents.length < 7) {
      score = 55;
    } else if (keyIdeaEvents.length < 12) {
      score = 80;
    } else {
      score = 95;
    }

    const productionEvents = session.session_events.filter(
      (e) => e.event_type === "PRODUCTION_SUBMIT",
    );
    if (productionEvents.length > 0) {
      const avgLength =
        productionEvents.reduce(
          (sum, e) => sum + ((e.payload_json as any)?.text?.length || 0),
          0,
        ) / productionEvents.length;

      if (avgLength > 200) score += 15;
      else if (avgLength > 100) score += 10;
      else if (avgLength > 50) score += 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private async calculateFrustration(session: any): Promise<number> {
    let frustration = 0;

    const expectedDuration = this.estimateExpectedDuration(session);
    const actualDuration = this.calculateActualDuration(session);

    if (actualDuration > expectedDuration * 2) {
      frustration += 30;
    } else if (actualDuration > expectedDuration * 1.5) {
      frustration += 15;
    }

    const unknownWordEvents = session.session_events.filter(
      (e) => e.event_type === "MARK_UNKNOWN_WORD",
    );
    const textLength = session.contents?.raw_text?.length || 1000;
    const unknownRate = unknownWordEvents.length / (textLength / 100);

    if (unknownRate > 3) frustration += 25;
    else if (unknownRate > 2) frustration += 15;
    else if (unknownRate > 1) frustration += 5;

    const checkpointEvents = session.session_events.filter(
      (e) => e.event_type === "CHECKPOINT_RESPONSE",
    );
    const weakResponses = checkpointEvents.filter(
      (e) => ((e.payload_json as any)?.response?.length || 0) < 10,
    ).length;

    if (weakResponses > checkpointEvents.length * 0.5) {
      frustration += 20;
    }

    const quizEvents = session.session_events.filter(
      (e) => e.event_type === "QUIZ_RESPONSE",
    );
    const incorrectCount = quizEvents.filter(
      (e) => (e.payload_json as any)?.correct === false,
    ).length;
    const quizFailureRate =
      quizEvents.length > 0 ? incorrectCount / quizEvents.length : 0;

    if (quizFailureRate > 0.6) frustration += 20;
    else if (quizFailureRate > 0.4) frustration += 10;

    return Math.max(0, Math.min(100, Math.round(frustration)));
  }

  private estimateExpectedDuration(session: any): number {
    const textLength = session.contents?.raw_text?.length || 1000;
    const wordsCount = textLength / 5;

    const baseMinutes = (wordsCount / 200) * 1.5;

    const layerMultiplier: Record<string, number> = {
      L1: 0.8,
      L2: 1.0,
      L3: 1.3,
    };

    const layer = session.asset_layer || "L2";
    const expectedMinutes = baseMinutes * (layerMultiplier[layer] || 1.0);

    return expectedMinutes * 60;
  }

  private calculateActualDuration(session: any): number {
    if (!session.session_events || session.session_events.length === 0)
      return 0;

    const timestamps = session.session_events
      .map((e: any) => e.created_at || new Date())
      .filter((t: any) => t instanceof Date)
      .sort((a: any, b: any) => a.getTime() - b.getTime());

    if (timestamps.length === 0) return 0;

    const start = timestamps[0];
    const end = timestamps[timestamps.length - 1];

    return (end.getTime() - start.getTime()) / 1000;
  }
}
