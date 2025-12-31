import { ConfigService } from "@nestjs/config";
import { LLMService } from "../../llm/llm.service";
export interface SimplificationResult {
    simplifiedText: string;
    summary: string;
}
export interface AssessmentQuestion {
    questionText: string;
    questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
    options?: string[];
    correctAnswer: string;
    explanation: string;
}
export interface AssessmentResult {
    questions: AssessmentQuestion[];
}
export declare class AIContentService {
    private configService;
    private llmService;
    private readonly logger;
    constructor(configService: ConfigService, llmService: LLMService);
    simplifyText(params: {
        text: string;
        targetLevel: string;
        targetLanguage: string;
    }): Promise<SimplificationResult>;
    generateAssessment(params: {
        text: string;
        level: string;
        questionCount?: number;
    }): Promise<AssessmentResult>;
}
