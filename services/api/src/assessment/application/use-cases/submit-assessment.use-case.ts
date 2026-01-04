import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { IAssessmentRepository } from "../../domain/interfaces/assessment.repository.interface";
import { AssessmentAttempt } from "../../domain/entities/assessment-attempt.entity";
import { SubmitAssessmentDto } from "../../dto/assessment.dto";
import { TopicMasteryService } from "../../../analytics/topic-mastery.service";
import { TelemetryService } from "../../../telemetry/telemetry.service";
import { TelemetryEventType } from "../../../telemetry/domain/telemetry.constants";
import { ScaffoldingService } from "../../../decision/application/scaffolding.service";
import * as crypto from "crypto";

@Injectable()
export class SubmitAssessmentUseCase {
  constructor(
    @Inject(IAssessmentRepository)
    private readonly assessmentRepository: IAssessmentRepository,
    private readonly topicMastery: TopicMasteryService,
    private readonly telemetryService: TelemetryService,
    private readonly scaffoldingService: ScaffoldingService,
  ) {}

  async execute(
    userId: string,
    assessmentId: string,
    dto: SubmitAssessmentDto,
  ): Promise<AssessmentAttempt> {
    const assessment = await this.assessmentRepository.findById(assessmentId);
    if (!assessment) {
      throw new NotFoundException("Assessment not found");
    }

    let scorePoints = 0;
    const totalQuestions = assessment.questions?.length || 0;
    const assessmentAnswers: any[] = [];
    const startTime = Date.now();

    // Process answers
    for (const answerDto of dto.answers) {
      const question = assessment.questions?.find(
        (q) => q.id === answerDto.questionId,
      );
      if (!question) continue;

      const isCorrect =
        JSON.stringify(question.correctAnswer) ===
        JSON.stringify(answerDto.userAnswer);
      if (isCorrect) scorePoints++;

      assessmentAnswers.push({
        id: crypto.randomUUID(),
        questionId: question.id,
        userAnswer: answerDto.userAnswer,
        isCorrect: isCorrect,
        timeSpentSeconds: answerDto.timeSpentSeconds || 0,
      });

      // Emit telemetry for each question answered
      await this.telemetryService.track({
        eventType: TelemetryEventType.MICRO_CHECK_ANSWERED,
        eventVersion: '1.0.0',
        contentId: assessment.contentId,
        sessionId: dto.sessionId || 'unknown',
        data: {
          correct: isCorrect,
          latencyMs: (answerDto.timeSpentSeconds || 0) * 1000,
          difficulty: 'medium', // Default difficulty (not tracked in current schema)
        },
      }, userId);
    }

    const scorePercent =
      totalQuestions > 0 ? (scorePoints / totalQuestions) * 100 : 0;

    // Create Attempt Entity
    const attempt = new AssessmentAttempt({
      id: crypto.randomUUID(),
      assessmentId: assessmentId,
      userId: userId,
      scoreRaw: scorePoints,
      scorePercent: scorePercent,
      finishedAt: new Date(),
    });

    const createdAttempt = await this.assessmentRepository.createAttempt(
      attempt,
      assessmentAnswers,
    );

    // Update Mastery (Side Effect)
    // We strictly replicate the logic from the original service
    // Note: The original service accessed 'assessment.contents.metadata'.
    // The current repository implementation for 'findById' fetches 'assessment_questions' but might NOT fetch 'contents'.
    // We need to ensure logic preservation. Ideally, Mastery update should be an Event.
    // GUIDANCE: For now, we skip the Mastery update here if the entity doesn't have the data,
    // OR we update the Repository to fetch content metadata.
    // Given Clean Architecture, the Use Case *should* orchestrate this.
    // I will stick to the core logic first. If I need content metadata, I should fetch it.
    // The current repository definition 'findById' in Prisma impl returns 'questions' but not 'contents'.
    // I should probably update the repo to fetch content or just contentId?
    // The 'Assessment' entity has 'contentId'.
    // I might need a "GetContentMetadata" service or repo method.
    // Or, for simplicity in this refactor, I might need to skip strict mastery update here or fix the repo.

    // SCRIPT 08: Emit ASSESSMENT_COMPLETED telemetry event
    await this.telemetryService.track({
      eventType: TelemetryEventType.ASSESSMENT_COMPLETED,
      eventVersion: '1.0.0',
      contentId: assessment.contentId,
      sessionId: dto.sessionId || 'unknown',
      data: {
        assessmentId: assessmentId,
        attemptId: createdAttempt.id,
        scorePercent: scorePercent,
        scoreRaw: scorePoints,
        totalQuestions: totalQuestions,
      },
    }, userId);

    // SCRIPT 08: Automatically update mastery from assessment results
    try {
      await this.scaffoldingService.updateMasteryFromAssessment(
        userId,
        createdAttempt.id,
      );
    } catch (error) {
      // Log error but don't fail the assessment submission
      console.error('Failed to update mastery from assessment:', error);
    }

    return createdAttempt;
  }
}
