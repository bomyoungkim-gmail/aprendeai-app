import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { IAssessmentRepository } from "../../domain/interfaces/assessment.repository.interface";
import { Assessment } from "../../domain/entities/assessment.entity";

@Injectable()
export class GetAssessmentUseCase {
  constructor(
    @Inject(IAssessmentRepository)
    private readonly assessmentRepository: IAssessmentRepository,
  ) {}

  async getUserAssessments(userId: string): Promise<Assessment[]> {
    return this.assessmentRepository.findAllByUser(userId);
  }

  async getByContentId(contentId: string): Promise<Assessment[]> {
    return this.assessmentRepository.findByContentId(contentId);
  }

  async getById(id: string): Promise<Assessment> {
    const assessment = await this.assessmentRepository.findById(id);
    if (!assessment) {
      throw new NotFoundException("Assessment not found");
    }
    return assessment;
  }
}
