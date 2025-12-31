import { IAssessmentRepository } from "../../domain/interfaces/assessment.repository.interface";
import { AssessmentAttempt } from "../../domain/entities/assessment-attempt.entity";
import { SubmitAssessmentDto } from "../../dto/assessment.dto";
import { TopicMasteryService } from "../../../analytics/topic-mastery.service";
export declare class SubmitAssessmentUseCase {
    private readonly assessmentRepository;
    private readonly topicMastery;
    constructor(assessmentRepository: IAssessmentRepository, topicMastery: TopicMasteryService);
    execute(userId: string, assessmentId: string, dto: SubmitAssessmentDto): Promise<AssessmentAttempt>;
}
