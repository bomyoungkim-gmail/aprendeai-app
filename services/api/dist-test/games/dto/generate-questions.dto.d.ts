import { EducationLevel } from "./question-bank.dto";
export declare class GenerateQuestionsDto {
    gameType: string;
    topic: string;
    subject: string;
    educationLevel: EducationLevel;
    count: number;
    language?: string;
    difficulty?: number;
}
export declare class GeneratedQuestionsResponseDto {
    questions: any[];
    generated: number;
    saved: number;
    language: string;
    gameType: string;
}
