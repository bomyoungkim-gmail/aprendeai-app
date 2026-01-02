import { Injectable, Inject } from "@nestjs/common";
import { IAssessmentRepository } from "../../domain/interfaces/assessment.repository.interface";
import { Assessment } from "../../domain/entities/assessment.entity";
import { AssessmentQuestion } from "../../domain/entities/assessment-question.entity";
import { CreateAssessmentDto } from "../../dto/assessment.dto";
import * as crypto from "crypto";

@Injectable()
export class CreateAssessmentUseCase {
  constructor(
    @Inject(IAssessmentRepository)
    private readonly assessmentRepository: IAssessmentRepository,
  ) {}

  async execute(dto: CreateAssessmentDto): Promise<Assessment> {
    const { questions, ...data } = dto;

    const assessment = new Assessment({
      id: crypto.randomUUID(),
      contentId: (data as any).contentId,
      contentVersionId: (data as any).contentVersionId,
      schoolingLevelTarget:
        (data as any).schoolingLevelTarget || "HIGHER_EDUCATION",
      questions: questions.map(
        (q) =>
          new AssessmentQuestion({
            id: crypto.randomUUID(),
            questionType: q.questionType,
            questionText: q.questionText,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
          }),
      ),
    });

    return this.assessmentRepository.create(assessment);
  }
}
