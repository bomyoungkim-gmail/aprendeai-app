import { Injectable } from "@nestjs/common";
import { CreateAssessmentDto, SubmitAssessmentDto } from "./dto/assessment.dto";
import { CreateAssessmentUseCase } from "./application/use-cases/create-assessment.use-case";
import { GetAssessmentUseCase } from "./application/use-cases/get-assessment.use-case";
import { SubmitAssessmentUseCase } from "./application/use-cases/submit-assessment.use-case";

@Injectable()
export class AssessmentService {
  constructor(
    private readonly createUseCase: CreateAssessmentUseCase,
    private readonly getUseCase: GetAssessmentUseCase,
    private readonly submitUseCase: SubmitAssessmentUseCase
  ) {}

  async create(createAssessmentDto: CreateAssessmentDto) {
    return this.createUseCase.execute(createAssessmentDto);
  }

  findAllByUser(userId: string) {
    return this.getUseCase.getUserAssessments(userId);
  }

  findByContent(contentId: string) {
    return this.getUseCase.getByContentId(contentId);
  }

  async submitAssessment(
    userId: string,
    assessmentId: string,
    dto: SubmitAssessmentDto
  ) {
    return this.submitUseCase.execute(userId, assessmentId, dto);
  }

  /**
   * Get pending checkpoints for a user and content
   * Returns assessments that have no completed attempts
   */
  async getPendingCheckpoints(userId: string, contentId: string) {
    // 1. Get all assessments for this content
    const assessments = await this.getUseCase.getByContentId(contentId);

    // 2. Get all attempts for this user
    const attempts = await this.getUseCase.getUserAssessments(userId);

    // 3. Filter for assessments with no completed attempts
    const pending = assessments.filter((assessment) => {
      const hasCompletedAttempt = attempts.some(
        (attempt: any) =>
          attempt.assessment_id === assessment.id &&
          attempt.finished_at !== null
      );
      return !hasCompletedAttempt;
    });

    return pending;
  }
}
