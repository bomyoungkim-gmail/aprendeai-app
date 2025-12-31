import { QuestionType } from "@prisma/client";
export declare class CreateQuestionDto {
    questionType: QuestionType;
    questionText: string;
    options?: string[];
    correctAnswer: any;
}
export declare class CreateAssessmentDto {
    contentId: string;
    contentVersionId?: string;
    schoolingLevelTarget: string;
    questions: CreateQuestionDto[];
}
export declare class SubmitAssessmentAnswerDto {
    questionId: string;
    userAnswer: any;
    timeSpentSeconds?: number;
}
export declare class SubmitAssessmentDto {
    answers: SubmitAssessmentAnswerDto[];
}
