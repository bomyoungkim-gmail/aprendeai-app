"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var QuestionSelectionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionSelectionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const ai_question_generator_service_1 = require("./ai-question-generator.service");
const question_bank_dto_1 = require("../dto/question-bank.dto");
const crypto = require("crypto");
let QuestionSelectionService = QuestionSelectionService_1 = class QuestionSelectionService {
    constructor(prisma, aiGenerator) {
        this.prisma = prisma;
        this.aiGenerator = aiGenerator;
        this.logger = new common_1.Logger(QuestionSelectionService_1.name);
    }
    async getQuestionsForUser(params) {
        const { gameType, topic, subject, educationLevel, count, language = "pt-BR", } = params;
        const questions = [];
        const dbQuestions = await this.prisma.question_bank.findMany({
            where: {
                game_type: gameType,
                subject,
                topic,
                education_level: educationLevel,
                language,
            },
            take: count,
            orderBy: {
                updated_at: "desc",
            },
        });
        questions.push(...dbQuestions);
        if (questions.length < count) {
            const remainingCount = count - questions.length;
            this.logger.log(`Not enough questions in DB (${questions.length}/${count}). Generating ${remainingCount} via AI...`);
            try {
                const generatedQuestions = await this.aiGenerator.generate(Object.assign(Object.assign({}, params), { count: remainingCount, language }));
                for (const q of generatedQuestions) {
                    const saved = await this.saveGeneratedQuestion({
                        gameType,
                        subject,
                        topic,
                        educationLevel,
                        language,
                        difficulty: 3,
                        question: q.question,
                        answer: q.answer,
                        sourceType: question_bank_dto_1.SourceType.AI_GENERATED,
                        metadata: { generatedAt: new Date() },
                    });
                    questions.push(saved);
                }
            }
            catch (error) {
                this.logger.error("Failed to generate AI questions fallback:", error);
            }
        }
        return questions.sort(() => Math.random() - 0.5).slice(0, count);
    }
    async saveGeneratedQuestion(dto) {
        return this.prisma.question_bank.create({
            data: {
                id: crypto.randomUUID(),
                game_type: dto.gameType,
                subject: dto.subject,
                topic: dto.topic,
                difficulty: dto.difficulty,
                education_level: dto.educationLevel,
                language: dto.language,
                question: dto.question,
                answer: dto.answer,
                source_type: dto.sourceType,
                metadata: dto.metadata || {},
                updated_at: new Date(),
            },
        });
    }
};
exports.QuestionSelectionService = QuestionSelectionService;
exports.QuestionSelectionService = QuestionSelectionService = QuestionSelectionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_question_generator_service_1.AIQuestionGeneratorService])
], QuestionSelectionService);
//# sourceMappingURL=question-selection.service.js.map