export declare enum EducationLevel {
    FUNDAMENTAL = "fundamental",
    MEDIO = "medio",
    SUPERIOR = "superior"
}
export declare enum SourceType {
    AI_GENERATED = "AI_GENERATED",
    CURATED = "CURATED",
    USER_CONTRIBUTED = "USER_CONTRIBUTED"
}
export declare class CreateQuestionBankDto {
    language: string;
    gameType: string;
    subject: string;
    topic: string;
    difficulty: number;
    educationLevel: EducationLevel;
    question: any;
    answer: any;
    metadata?: any;
    sourceType: SourceType;
    sourceContentId?: string;
    universalConceptId?: string;
}
export declare class QuestionBankResponseDto {
    id: string;
    language: string;
    gameType: string;
    subject: string;
    topic: string;
    difficulty: number;
    educationLevel: string;
    question: any;
    answer: any;
    metadata?: any;
    sourceType: string;
    timesUsed: number;
    avgScore?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class QuestionBankListDto {
    questions: QuestionBankResponseDto[];
    total: number;
    page: number;
    pageSize: number;
}
