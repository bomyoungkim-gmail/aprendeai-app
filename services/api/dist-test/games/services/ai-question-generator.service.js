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
var AIQuestionGeneratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIQuestionGeneratorService = void 0;
const common_1 = require("@nestjs/common");
const llm_service_1 = require("../../llm/llm.service");
let AIQuestionGeneratorService = AIQuestionGeneratorService_1 = class AIQuestionGeneratorService {
    constructor(llmService) {
        this.llmService = llmService;
        this.logger = new common_1.Logger(AIQuestionGeneratorService_1.name);
    }
    async generate(params) {
        const language = params.language || "pt-BR";
        try {
            switch (params.gameType) {
                case "CONCEPT_LINKING":
                    return await this.generateTabooQuestions(params, language);
                case "SRS_ARENA":
                    return await this.generateSRSQuestions(params, language);
                case "FREE_RECALL_SCORE":
                    return await this.generateFreeRecallQuestions(params, language);
                default:
                    throw new Error(`Unsupported game type: ${params.gameType}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to generate questions: ${error.message}`);
            throw error;
        }
    }
    async generateTabooQuestions(params, language) {
        const prompt = `Generate ${params.count} Taboo-style questions about "${params.topic}" (${params.subject}) 
for ${params.educationLevel} education level in ${language}.

For each question, provide:
- targetWord: the word to be described
- forbiddenWords: exactly 4 related forbidden words
- requiredKeywords: 2-3 keywords that must appear in a good description
- validExamples: 2 example descriptions

Return JSON: { questions: [{ targetWord, forbiddenWords, requiredKeywords, validExamples }] }`;
        const result = await this.llmService.generateText(prompt, {
            temperature: 0.8,
            model: "gpt-4",
        });
        const data = JSON.parse(result.text);
        return data.questions.map((q) => ({
            question: {
                targetWord: q.targetWord,
                forbiddenWords: q.forbiddenWords,
            },
            answer: {
                type: "criteria",
                requiredKeywords: q.requiredKeywords || [],
                forbiddenKeywords: q.forbiddenWords,
                minWords: 5,
                maxWords: 50,
                validExamples: q.validExamples || [],
                scoring: {
                    noForbidden: 40,
                    hasRequired: 30,
                    goodLength: 20,
                    clarity: 10,
                },
            },
        }));
    }
    async generateSRSQuestions(params, language) {
        const prompt = `Generate ${params.count} flashcard questions about "${params.topic}" (${params.subject})
for ${params.educationLevel} education level in ${language}.

For each question, provide:
- question: a clear question
- correct: the correct answer
- acceptableVariations: 2-3 acceptable alternative answers
- keywords: key terms that should appear in the answer

Return JSON: { questions: [{ question, correct, acceptableVariations, keywords }] }`;
        const result = await this.llmService.generateText(prompt, {
            temperature: 0.7,
            model: "gpt-4",
        });
        const data = JSON.parse(result.text);
        return data.questions.map((q) => ({
            question: {
                question: q.question,
            },
            answer: {
                type: "exact",
                correct: q.correct,
                acceptableVariations: q.acceptableVariations || [],
                keywords: q.keywords || [],
                scoring: {
                    exactMatch: 100,
                    hasAllKeywords: 80,
                    hasSomeKeywords: 50,
                },
            },
        }));
    }
    async generateFreeRecallQuestions(params, language) {
        const prompt = `Generate ${params.count} free recall prompts about "${params.topic}" (${params.subject})
for ${params.educationLevel} education level in ${language}.

For each prompt, provide:
- topic: the specific topic name
- prompt: instruction to summarize/explain
- mustMentionConcepts: 5-7 key concepts that must be mentioned
- exampleAnswer: a good example answer

Return JSON: { questions: [{ topic, prompt, mustMentionConcepts, exampleAnswer }] }`;
        const result = await this.llmService.generateText(prompt, {
            temperature: 0.7,
            model: "gpt-4",
        });
        const data = JSON.parse(result.text);
        return data.questions.map((q) => ({
            question: {
                topic: q.topic,
                prompt: q.prompt,
            },
            answer: {
                type: "self-assessed",
                topic: q.topic,
                mustMentionConcepts: q.mustMentionConcepts || [],
                optionalConcepts: [],
                minWords: 20,
                exampleAnswer: q.exampleAnswer,
                rubric: {
                    excellent: {
                        description: "Menciona 5+ conceitos essenciais",
                        minConcepts: 5,
                        minWords: 30,
                    },
                    good: {
                        description: "Menciona 3-4 conceitos",
                        minConcepts: 3,
                        minWords: 20,
                    },
                    needs_improvement: {
                        description: "Menciona <3 conceitos",
                        minConcepts: 0,
                        minWords: 10,
                    },
                },
                aiEvaluationAvailable: true,
            },
        }));
    }
};
exports.AIQuestionGeneratorService = AIQuestionGeneratorService;
exports.AIQuestionGeneratorService = AIQuestionGeneratorService = AIQuestionGeneratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [llm_service_1.LLMService])
], AIQuestionGeneratorService);
//# sourceMappingURL=ai-question-generator.service.js.map