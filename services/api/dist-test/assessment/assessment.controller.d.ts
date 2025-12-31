import { AssessmentService } from "./assessment.service";
import { CreateAssessmentDto } from "./dto/assessment.dto";
export declare class AssessmentController {
    private readonly assessmentService;
    constructor(assessmentService: AssessmentService);
    create(createAssessmentDto: CreateAssessmentDto): Promise<import("./domain/entities/assessment.entity").Assessment>;
    findAll(req: any): Promise<import("./domain/entities/assessment.entity").Assessment[]>;
}
