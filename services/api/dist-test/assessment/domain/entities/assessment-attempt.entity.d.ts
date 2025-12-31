import { Assessment } from "./assessment.entity";
export declare class AssessmentAttempt {
    id: string;
    assessmentId: string;
    userId: string;
    scoreRaw: number;
    scorePercent: number;
    startedAt?: Date;
    finishedAt: Date;
    createdAt?: Date;
    assessment?: Assessment;
    constructor(partial: Partial<AssessmentAttempt>);
}
