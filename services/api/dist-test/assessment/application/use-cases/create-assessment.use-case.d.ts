import { IAssessmentRepository } from "../../domain/interfaces/assessment.repository.interface";
import { Assessment } from "../../domain/entities/assessment.entity";
import { CreateAssessmentDto } from "../../dto/assessment.dto";
export declare class CreateAssessmentUseCase {
    private readonly assessmentRepository;
    constructor(assessmentRepository: IAssessmentRepository);
    execute(dto: CreateAssessmentDto): Promise<Assessment>;
}
