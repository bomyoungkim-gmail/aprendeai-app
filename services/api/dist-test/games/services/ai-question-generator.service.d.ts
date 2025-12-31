import { LLMService } from "../../llm/llm.service";
import { GenerateQuestionsDto } from "../dto/generate-questions.dto";
export declare class AIQuestionGeneratorService {
    private llmService;
    private readonly logger;
    constructor(llmService: LLMService);
    generate(params: GenerateQuestionsDto): Promise<any>;
    private generateTabooQuestions;
    private generateSRSQuestions;
    private generateFreeRecallQuestions;
}
