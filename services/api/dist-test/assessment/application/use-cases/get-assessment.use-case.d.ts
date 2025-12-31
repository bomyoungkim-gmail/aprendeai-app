import { IAssessmentRepository } from "../../domain/interfaces/assessment.repository.interface";
import { Assessment } from "../../domain/entities/assessment.entity";
export declare class GetAssessmentUseCase {
    private readonly assessmentRepository;
    constructor(assessmentRepository: IAssessmentRepository);
    getUserAssessments(userId: string): Promise<Assessment[]>;
    getById(id: string): Promise<Assessment>;
}
