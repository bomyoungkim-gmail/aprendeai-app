export declare class AssessmentQuestion {
    id: string;
    assessmentId?: string;
    questionType: string;
    questionText: string;
    options: string[] | any;
    correctAnswer: any;
    createdAt?: Date;
    updatedAt?: Date;
    constructor(partial: Partial<AssessmentQuestion>);
}
