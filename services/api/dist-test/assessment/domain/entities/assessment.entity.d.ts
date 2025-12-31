import { AssessmentQuestion } from "./assessment-question.entity";
export declare class Assessment {
    id: string;
    contentId: string;
    contentVersionId?: string;
    schoolingLevelTarget: string;
    createdAt: Date;
    updatedAt: Date;
    questions?: AssessmentQuestion[];
    constructor(partial: Partial<Assessment>);
}
