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
    private readonly submitUseCase: SubmitAssessmentUseCase,
  ) {}

  async create(createAssessmentDto: CreateAssessmentDto) {
    return this.createUseCase.execute(createAssessmentDto);
  }

  findAllByUser(userId: string) {
    return this.getUseCase.getUserAssessments(userId);
  }

  async submitAssessment(
    userId: string,
    assessmentId: string,
    dto: SubmitAssessmentDto,
  ) {
    return this.submitUseCase.execute(userId, assessmentId, dto);
  }
}
