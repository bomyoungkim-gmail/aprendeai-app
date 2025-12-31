import { CreateAssessmentDto, SubmitAssessmentDto } from "./dto/assessment.dto";
import { CreateAssessmentUseCase } from "./application/use-cases/create-assessment.use-case";
import { GetAssessmentUseCase } from "./application/use-cases/get-assessment.use-case";
import { SubmitAssessmentUseCase } from "./application/use-cases/submit-assessment.use-case";
export declare class AssessmentService {
    private readonly createUseCase;
    private readonly getUseCase;
    private readonly submitUseCase;
    constructor(createUseCase: CreateAssessmentUseCase, getUseCase: GetAssessmentUseCase, submitUseCase: SubmitAssessmentUseCase);
    create(createAssessmentDto: CreateAssessmentDto): Promise<import("./domain/entities/assessment.entity").Assessment>;
    findAllByUser(userId: string): Promise<import("./domain/entities/assessment.entity").Assessment[]>;
    submitAssessment(userId: string, assessmentId: string, dto: SubmitAssessmentDto): Promise<import("./domain/entities/assessment-attempt.entity").AssessmentAttempt>;
}
