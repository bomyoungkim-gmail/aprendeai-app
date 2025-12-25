import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OutcomesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Compute session outcomes when session finishes.
   * Uses deterministic calculations based on session events and data.
   */
  async computeSessionOutcomes(sessionId: string) {
    const session = await this.prisma.readingSession.findUnique({
      where: { id: sessionId },
      include: {
        events: true,
        content: true,
        outcome: true,
      },
    });

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Calculate three outcome scores
    const comprehension = await this.calculateComprehension(session);
    const production = await this.calculateProduction(session);
    const frustration = await this.calculateFrustration(session);

    // Upsert outcome
    return this.prisma.sessionOutcome.upsert({
      where: { readingSessionId: sessionId },
      create: {
        readingSessionId: sessionId,
        comprehensionScore: comprehension,
        productionScore: production,
        frustrationIndex: frustration,
      },
      update: {
        comprehensionScore: comprehension,
        productionScore: production,
        frustrationIndex: frustration,
        computedAt: new Date(),
      },
    });
  }

  /**
   * Calculate comprehension score (0-100)
   * Based on: quiz responses, checkpoint responses, unknown word rate
   */
  private async calculateComprehension(session: any): Promise<number> {
    let score = 50; // Start at neutral

    // Factor 1: Quiz responses
    const quizEvents = session.events.filter(
      (e) => e.eventType === "QUIZ_RESPONSE",
    );
    if (quizEvents.length > 0) {
      // Assume payload has { correct: boolean }
      const correctCount = quizEvents.filter(
        (e) => e.payload?.correct === true,
      ).length;
      const quizAccuracy = correctCount / quizEvents.length;
      score += (quizAccuracy - 0.5) * 40; // ±20 points
    }

    // Factor 2: Checkpoint responses (quality)
    const checkpointEvents = session.events.filter(
      (e) => e.eventType === "CHECKPOINT_RESPONSE",
    );
    if (checkpointEvents.length > 0) {
      // Simple heuristic: response length indicates engagement
      const avgLength =
        checkpointEvents.reduce(
          (sum, e) => sum + (e.payload?.response?.length || 0),
          0,
        ) / checkpointEvents.length;

      if (avgLength > 50)
        score += 10; // Good engagement
      else if (avgLength < 20) score -= 10; // Weak engagement
    }

    // Factor 3: Unknown word rate
    const unknownWordEvents = session.events.filter(
      (e) => e.eventType === "MARK_UNKNOWN_WORD",
    );
    const textLength = session.content?.rawText?.length || 1000;
    const unknownRate = unknownWordEvents.length / (textLength / 100); // per 100 chars

    if (unknownRate > 2)
      score -= 15; // High unknown rate = lower comprehension
    else if (unknownRate < 0.5) score += 10; // Low unknown rate = good comprehension

    // Clamp to 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate production score (0-100)
   * Based on: Cornell notes quality, cue responses, summary production
   */
  private async calculateProduction(session: any): Promise<number> {
    let score = 50; // Start at neutral

    // Rubric from plan:
    // - 0-10: Empty/minimal Cornell notes
    // - 11-40: Basic notes, few cues
    // - 41-70: Good notes, decent cues
    // - 71-90: Detailed notes, quality cues
    // - 91-100: Exceptional notes + synthesis

    // Factor 1: Cornell notes count (if we stored them)
    // For now, use event-based heuristic
    const keyIdeaEvents = session.events.filter(
      (e) => e.eventType === "MARK_KEY_IDEA",
    );

    if (keyIdeaEvents.length === 0) {
      score = 5; // Minimal engagement
    } else if (keyIdeaEvents.length < 3) {
      score = 25; // Basic
    } else if (keyIdeaEvents.length < 7) {
      score = 55; // Good
    } else if (keyIdeaEvents.length < 12) {
      score = 80; // Detailed
    } else {
      score = 95; // Exceptional
    }

    // Factor 2: Production submit events (summary, synthesis)
    const productionEvents = session.events.filter(
      (e) => e.eventType === "PRODUCTION_SUBMIT",
    );
    if (productionEvents.length > 0) {
      const avgLength =
        productionEvents.reduce(
          (sum, e) => sum + (e.payload?.text?.length || 0),
          0,
        ) / productionEvents.length;

      if (avgLength > 200)
        score += 15; // Quality synthesis
      else if (avgLength > 100) score += 10;
      else if (avgLength > 50) score += 5;
    }

    // Clamp to 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Calculate frustration index (0-100, higher = more frustrated)
   * Based on: session duration vs expected, help requests, repeated errors
   */
  private async calculateFrustration(session: any): Promise<number> {
    let frustration = 0;

    // Factor 1: Session duration anomaly
    const expectedDuration = this.estimateExpectedDuration(session);
    const actualDuration = this.calculateActualDuration(session);

    if (actualDuration > expectedDuration * 2) {
      frustration += 30; // Taking much longer than expected
    } else if (actualDuration > expectedDuration * 1.5) {
      frustration += 15;
    }

    // Factor 2: High unknown word rate (indicates difficulty)
    const unknownWordEvents = session.events.filter(
      (e) => e.eventType === "MARK_UNKNOWN_WORD",
    );
    const textLength = session.content?.rawText?.length || 1000;
    const unknownRate = unknownWordEvents.length / (textLength / 100);

    if (unknownRate > 3) frustration += 25;
    else if (unknownRate > 2) frustration += 15;
    else if (unknownRate > 1) frustration += 5;

    // Factor 3: Checkpoint struggle (multiple attempts, low quality)
    const checkpointEvents = session.events.filter(
      (e) => e.eventType === "CHECKPOINT_RESPONSE",
    );
    const weakResponses = checkpointEvents.filter(
      (e) => (e.payload?.response?.length || 0) < 10,
    ).length;

    if (weakResponses > checkpointEvents.length * 0.5) {
      frustration += 20; // More than half are weak
    }

    // Factor 4: Quiz failures
    const quizEvents = session.events.filter(
      (e) => e.eventType === "QUIZ_RESPONSE",
    );
    const incorrectCount = quizEvents.filter(
      (e) => e.payload?.correct === false,
    ).length;
    const quizFailureRate =
      quizEvents.length > 0 ? incorrectCount / quizEvents.length : 0;

    if (quizFailureRate > 0.6) frustration += 20;
    else if (quizFailureRate > 0.4) frustration += 10;

    // Clamp to 0-100
    return Math.max(0, Math.min(100, Math.round(frustration)));
  }

  /**
   * Estimate expected duration based on content length and layer
   */
  private estimateExpectedDuration(session: any): number {
    const textLength = session.content?.rawText?.length || 1000;
    const wordsCount = textLength / 5; // Rough estimate

    // Base reading speed: 200 words/minute
    // Add time for Cornell notes: +50%
    const baseMinutes = (wordsCount / 200) * 1.5;

    // Adjust by layer if available
    const layerMultiplier = {
      L1: 0.8, // Easier, faster
      L2: 1.0,
      L3: 1.3, // Harder, slower
    };

    const layer = session.assetLayer || "L2";
    const expectedMinutes = baseMinutes * (layerMultiplier[layer] || 1.0);

    return expectedMinutes * 60; // Convert to seconds
  }

  /**
   * Calculate actual session duration from events
   */
  private calculateActualDuration(session: any): number {
    if (session.events.length === 0) return 0;

    const timestamps = session.events
      .map((e) => e.timestamp)
      .sort((a, b) => a.getTime() - b.getTime());

    const start = timestamps[0];
    const end = timestamps[timestamps.length - 1];

    return (end.getTime() - start.getTime()) / 1000; // seconds
  }
}
