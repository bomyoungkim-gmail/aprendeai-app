import { Assessment } from "../entities/assessment.entity";
import { AssessmentAttempt } from "../entities/assessment-attempt.entity";

export interface IAssessmentRepository {
  create(assessment: Assessment): Promise<Assessment>;
  findById(id: string): Promise<Assessment | null>;
  findByContentId(contentId: string): Promise<Assessment[]>;
  findAllByUser(userId: string): Promise<Assessment[]>;
  findQuestionById(questionId: string): Promise<any | null>;
  createAttempt(
    attempt: AssessmentAttempt,
    answers: any[],
  ): Promise<AssessmentAttempt>;
}

export const IAssessmentRepository = Symbol("IAssessmentRepository");
