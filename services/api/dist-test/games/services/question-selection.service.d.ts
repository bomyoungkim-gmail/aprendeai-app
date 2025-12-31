import { PrismaService } from "../../prisma/prisma.service";
import { AIQuestionGeneratorService } from "./ai-question-generator.service";
import { GenerateQuestionsDto } from "../dto/generate-questions.dto";
export declare class QuestionSelectionService {
    private prisma;
    private aiGenerator;
    private readonly logger;
    constructor(prisma: PrismaService, aiGenerator: AIQuestionGeneratorService);
    getQuestionsForUser(params: GenerateQuestionsDto): Promise<any[]>;
    private saveGeneratedQuestion;
}
