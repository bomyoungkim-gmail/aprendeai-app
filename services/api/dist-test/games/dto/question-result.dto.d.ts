export declare class SubmitQuestionResultDto {
    questionId: string;
    score: number;
    timeTaken: number;
    isCorrect: boolean;
    selfRating?: number;
    userAnswer?: any;
    mistakes?: any;
    gameSessionId?: string;
}
export declare class QuestionResultResponseDto {
    id: string;
    userId: string;
    questionId: string;
    score: number;
    timeTaken: number;
    isCorrect: boolean;
    selfRating?: number;
    createdAt: Date;
}
export declare class QuestionResultWithAnalyticsDto extends QuestionResultResponseDto {
    questionAnalytics: {
        totalAttempts: number;
        successRate: number;
        avgScore: number;
        isDifficult: boolean;
    };
    nextReviewDate?: Date;
}
