import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DecisionService } from '../../decision/application/decision.service';
import { TelemetryService } from '../../telemetry/telemetry.service';
import { TelemetryEventType } from '../../telemetry/domain/telemetry.constants';
import { EventEmitter2 } from '@nestjs/event-emitter'; // GRAPH SCRIPT 19.10

/**
 * Productive Failure Service
 * 
 * Implements the "Productive Failure" pedagogical pattern where students
 * attempt to solve a problem BEFORE receiving formal instruction or feedback.
 * 
 * Flow:
 * 1. Assign PF mission (generic template from transfer_missions)
 * 2. Student submits attempt (response_text in transfer_attempts)
 * 3. System generates feedback (deterministic keywords OR LLM if policy allows)
 */
@Injectable()
export class ProductiveFailureService {
  private readonly logger = new Logger(ProductiveFailureService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly decisionService: DecisionService,
    private readonly telemetryService: TelemetryService,
    private readonly eventEmitter: EventEmitter2, // GRAPH SCRIPT 19.10
  ) {}

  /**
   * Assign a generic Productive Failure mission to a user for a specific content
   * 
   * @param userId - The user ID
   * @param contentId - The content ID
   * @returns The created transfer_attempt ID
   */
  async assignGenericPF(userId: string, contentId: string): Promise<string> {
    this.logger.debug(`Assigning PF mission for user ${userId}, content ${contentId}`);

    // 1. Find or create generic PF mission template
    const pfMission = await this.prisma.transfer_missions.findFirst({
      where: {
        type: 'PRODUCTIVE_FAILURE',
        scope_type: 'GLOBAL',
      },
    });

    if (!pfMission) {
      throw new NotFoundException(
        'Generic PRODUCTIVE_FAILURE mission template not found. Please run seed script.',
      );
    }

    // 2. Create transfer_attempt
    const attempt = await this.prisma.transfer_attempts.create({
      data: {
        id: this.generateAttemptId(),
        user_id: userId,
        content_id: contentId,
        mission_id: pfMission.id,
        status: 'PENDING',
        score: null,
        response_text: null,
        feedback_json: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    this.logger.log(`PF mission assigned: attempt ${attempt.id}`);
    return attempt.id;
  }

  /**
   * Submit a Productive Failure response
   * 
   * @param attemptId - The transfer_attempt ID
   * @param responseText - The student's attempt text
   */
  async submitPFResponse(attemptId: string, responseText: string): Promise<void> {
    this.logger.debug(`Submitting PF response for attempt ${attemptId}`);

    const attempt = await this.prisma.transfer_attempts.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException(`Transfer attempt ${attemptId} not found`);
    }

    if (attempt.status !== 'PENDING') {
      throw new Error(`Attempt ${attemptId} is not in PENDING status`);
    }

    await this.prisma.transfer_attempts.update({
      where: { id: attemptId },
      data: {
        response_text: responseText,
        updated_at: new Date(),
      },
    });

    this.logger.log(`PF response submitted for attempt ${attemptId}`);
  }

  /**
   * Generate feedback for a Productive Failure attempt
   * 
   * Uses a two-tier approach:
   * - Tier 1 (Deterministic): Checks section_transfer_metadata for keywords/cues
   * - Tier 2 (LLM): If policy allows and deterministic is insufficient
   * 
   * @param attemptId - The transfer_attempt ID
   * @returns The generated feedback object
   */
  async generateFeedback(attemptId: string): Promise<{
    feedbackType: 'deterministic' | 'llm';
    feedback: string;
    hints?: string[];
  }> {
    this.logger.debug(`Generating feedback for attempt ${attemptId}`);

    const attempt = await this.prisma.transfer_attempts.findUnique({
      where: { id: attemptId },
      include: {
        contents: {
          include: {
            section_transfer_metadata: true,
          },
        },
        users: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Transfer attempt ${attemptId} not found`);
    }

    if (!attempt.response_text) {
      throw new Error(`Attempt ${attemptId} has no response text`);
    }

    // Tier 1: Deterministic feedback from metadata
    const deterministicFeedback = this.generateDeterministicFeedback(
      attempt.response_text,
      attempt.contents.section_transfer_metadata,
    );

    // Check if deterministic feedback is sufficient
    if (deterministicFeedback.hints.length > 0) {
      // Persist feedback
      await this.prisma.transfer_attempts.update({
        where: { id: attemptId },
        data: {
          feedback_json: {
            type: 'deterministic',
            feedback: deterministicFeedback.feedback,
            hints: deterministicFeedback.hints,
          },
          updated_at: new Date(),
        },
      });

      this.logger.log(`Deterministic feedback generated for attempt ${attemptId}`);
      return {
        feedbackType: 'deterministic',
        feedback: deterministicFeedback.feedback,
        hints: deterministicFeedback.hints,
      };
    }

    // Tier 2: Check if LLM is allowed
    const policyEval = await this.decisionService.evaluateExtractionPolicy(
      attempt.user_id,
      'POST',
      {
        contentId: attempt.content_id,
        sessionId: `pf-${attemptId}`,
      },
    );

    if (!policyEval.allowed) {
      // Fall back to generic deterministic feedback
      const genericFeedback = 'Please review the main concepts and try again.';
      await this.prisma.transfer_attempts.update({
        where: { id: attemptId },
        data: {
          feedback_json: {
            type: 'deterministic',
            feedback: genericFeedback,
            hints: [],
          },
          updated_at: new Date(),
        },
      });

      this.logger.log(`Generic feedback generated for attempt ${attemptId} (LLM denied)`);
      return {
        feedbackType: 'deterministic',
        feedback: genericFeedback,
        hints: [],
      };
    }

    // Tier 2: LLM feedback (placeholder for now - will integrate with AiService)
    const llmFeedback = await this.generateLLMFeedback(
      attempt.response_text,
      attempt.contents.section_transfer_metadata,
    );

    await this.prisma.transfer_attempts.update({
      where: { id: attemptId },
      data: {
        feedback_json: {
          type: 'llm',
          feedback: llmFeedback,
        },
        updated_at: new Date(),
      },
    });

    this.logger.log(`LLM feedback generated for attempt ${attemptId}`);
    return {
      feedbackType: 'llm',
      feedback: llmFeedback,
    };
  }

  /**
   * Generate deterministic feedback based on keywords and metadata
   */
  private generateDeterministicFeedback(
    responseText: string,
    metadata: any[],
  ): { feedback: string; hints: string[] } {
    const hints: string[] = [];
    const responseLower = responseText.toLowerCase();

    // Extract key concepts from metadata
    const keyConcepts = metadata
      .map((m) => {
        const conceptJson = m.concept_json as any;
        return conceptJson?.main_idea || conceptJson?.concept || null;
      })
      .filter(Boolean);

    // Check if response mentions key concepts
    const missingConcepts = keyConcepts.filter(
      (concept: string) => !responseLower.includes(concept.toLowerCase()),
    );

    if (missingConcepts.length > 0) {
      hints.push(`Try focusing on: ${missingConcepts.slice(0, 2).join(', ')}`);
    }

    // Extract cues from metadata
    const cues = metadata
      .flatMap((m) => {
        const toolsJson = m.tools_json as any;
        return toolsJson?.cues || [];
      })
      .filter(Boolean);

    if (cues.length > 0 && hints.length === 0) {
      hints.push(`Consider these guiding questions: ${cues.slice(0, 2).join('; ')}`);
    }

    const feedback =
      hints.length > 0
        ? 'Your attempt shows effort, but you might be missing some key points.'
        : 'Good start! Your response covers the main ideas.';

    return { feedback, hints };
  }

  /**
   * Generate LLM-based feedback (placeholder)
   * TODO: Integrate with AiServiceClient when implementing full LLM support
   */
  private async generateLLMFeedback(
    responseText: string,
    metadata: any[],
  ): Promise<string> {
    // Placeholder: In real implementation, this would call AiServiceClient
    // with a prompt like: "Evaluate this student's attempt and provide constructive feedback"
    this.logger.warn('LLM feedback generation not yet implemented - using placeholder');
    return 'Your attempt demonstrates understanding. Consider elaborating on the main concepts with specific examples.';
  }

  /**
   * Complete a Productive Failure mission
   * 
   * Marks the attempt as COMPLETED and emits MISSION_COMPLETED telemetry event.
   * This should be called after the student has reviewed feedback and completed the learning cycle.
   * 
   * @param attemptId - The transfer_attempt ID
   * @param score - Final score (0-100)
   */
  async completeMission(attemptId: string, score: number): Promise<void> {
    this.logger.debug(`Completing mission for attempt ${attemptId}`);

    // 1. Validate attempt exists and is not already completed
    const attempt = await this.prisma.transfer_attempts.findUnique({
      where: { id: attemptId },
      include: { transfer_missions: true },
    });

    if (!attempt) {
      throw new NotFoundException(`Transfer attempt ${attemptId} not found`);
    }

    if (attempt.status === 'COMPLETED') {
      this.logger.warn(`Attempt ${attemptId} already completed`);
      return;
    }

    // 2. Update status to COMPLETED
    await this.prisma.transfer_attempts.update({
      where: { id: attemptId },
      data: {
        status: 'COMPLETED',
        score: score,
        updated_at: new Date(),
      },
    });

    // 3. Emit MISSION_COMPLETED telemetry event
    await this.telemetryService.track({
      eventType: TelemetryEventType.MISSION_COMPLETED,
      eventVersion: '1.0.0',
      sessionId: `pf-mission-${attemptId}`, // Generate session ID for tracking
      contentId: attempt.content_id || 'unknown',
      data: {
        missionId: attempt.mission_id,
        score: score,
      },
    }, attempt.user_id);

    // GRAPH SCRIPT 19.10: Emit event for graph reinforcement
    this.eventEmitter.emit('mission.completed', {
      userId: attempt.user_id,
      contentId: attempt.content_id,
      missionData: {
        missionId: attempt.mission_id,
        score: score,
        missionType: attempt.transfer_missions.type,
      },
    });

    this.logger.log(`Mission completed: ${attempt.mission_id}, score: ${score}`);
  }

  /**
   * Generate a unique attempt ID
   */
  private generateAttemptId(): string {
    return `pf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
