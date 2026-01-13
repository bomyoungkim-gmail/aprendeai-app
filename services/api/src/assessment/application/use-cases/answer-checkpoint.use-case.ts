import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { IAssessmentRepository } from "../../domain/interfaces/assessment.repository.interface";
import { TelemetryService } from "../../../telemetry/telemetry.service";
import { TelemetryEventType } from "../../../telemetry/domain/telemetry.constants";
import { ScaffoldingService } from "../../../decision/application/scaffolding.service";
import { FeedbackGenerationService } from "../feedback-generation.service";
import * as crypto from "crypto";

export interface AnswerCheckpointDto {
  checkpointId: string;
  sessionId: string;
  answer: any;
}

export interface AnswerCheckpointResult {
  correct: boolean;
  feedback: string;
  masteryUpdate?: {
    skill: string;
    newLevel: number;
  };
}

/**
 * Use Case: Answer a single checkpoint question
 *
 * Handles granular micro-learning interactions where users answer
 * individual checkpoint questions and receive immediate feedback.
 */
@Injectable()
export class AnswerCheckpointUseCase {
  constructor(
    @Inject(IAssessmentRepository)
    private readonly assessmentRepository: IAssessmentRepository,
    private readonly telemetryService: TelemetryService,
    private readonly scaffoldingService: ScaffoldingService,
    private readonly feedbackService: FeedbackGenerationService,
  ) {}

  async execute(
    userId: string,
    dto: AnswerCheckpointDto,
  ): Promise<AnswerCheckpointResult> {
    // 1. Find the checkpoint question
    const question = await this.assessmentRepository.findQuestionById(
      dto.checkpointId,
    );

    if (!question) {
      throw new NotFoundException(`Checkpoint ${dto.checkpointId} not found`);
    }

    // 2. Check correctness
    const isCorrect =
      JSON.stringify(question.correctAnswer) === JSON.stringify(dto.answer);

    // 3. Emit telemetry
    await this.telemetryService.track(
      {
        eventType: TelemetryEventType.MICRO_CHECK_ANSWERED,
        eventVersion: "1.0.0",
        contentId: "unknown", // Will be enriched from question's assessment
        sessionId: dto.sessionId,
        data: {
          checkpointId: dto.checkpointId,
          correct: isCorrect,
          latencyMs: 0, // Client should track this
        },
      },
      userId,
    );

    // 4. Create attempt record
    await this.assessmentRepository.createAttempt(
      {
        id: crypto.randomUUID(),
        assessmentId: question.assessmentId,
        userId: userId,
        scoreRaw: isCorrect ? 1 : 0,
        scorePercent: isCorrect ? 100 : 0,
        finishedAt: new Date(),
      },
      [
        {
          id: crypto.randomUUID(),
          questionId: question.id,
          userAnswer: dto.answer,
          isCorrect: isCorrect,
          timeSpentSeconds: 0,
        },
      ],
    );

    // 5. Update mastery if skills are present
    let masteryUpdate;
    if (question.skills && question.skills.length > 0) {
      try {
        // Update mastery for each skill
        for (const skill of question.skills) {
          await this.scaffoldingService.updateMasteryFromCheckpoint(
            userId,
            skill,
            isCorrect,
          );
        }

        // Return first skill's update for simplicity
        masteryUpdate = {
          skill: question.skills[0],
          newLevel: isCorrect ? 1 : 0, // Simplified - actual level from service
        };
      } catch (error) {
        console.error("Failed to update mastery:", error);
      }
    }

    // 6. Generate feedback
    const feedback = isCorrect
      ? "Correct! Well done."
      : await this.feedbackService.generateFeedback(
          question,
          dto.answer,
          question.correctAnswer,
        );

    return {
      correct: isCorrect,
      feedback,
      masteryUpdate,
    };
  }
}
