import { Assessment } from "../entities/assessment.entity";
import { AssessmentAttempt } from "../entities/assessment-attempt.entity";
export interface IAssessmentRepository {
    create(assessment: Assessment): Promise<Assessment>;
    findById(id: string): Promise<Assessment | null>;
    findAllByUser(userId: string): Promise<Assessment[]>;
    createAttempt(attempt: AssessmentAttempt, answers: any[]): Promise<AssessmentAttempt>;
}
export declare const IAssessmentRepository: unique symbol;
