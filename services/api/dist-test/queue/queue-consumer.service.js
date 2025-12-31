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
var QueueConsumerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueConsumerService = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const queue_service_1 = require("./queue.service");
const notifications_gateway_1 = require("../notifications/notifications.gateway");
const prisma_service_1 = require("../prisma/prisma.service");
const ai_content_service_1 = require("../common/services/ai-content.service");
const client_1 = require("@prisma/client");
let QueueConsumerService = QueueConsumerService_1 = class QueueConsumerService {
    constructor(queueService, prisma, aiContentService, notificationsGateway) {
        this.queueService = queueService;
        this.prisma = prisma;
        this.aiContentService = aiContentService;
        this.notificationsGateway = notificationsGateway;
        this.logger = new common_1.Logger(QueueConsumerService_1.name);
        this.channel = null;
    }
    async onModuleInit() {
        setTimeout(() => this.startConsuming(), 2000);
    }
    async startConsuming() {
        try {
            const queueServiceInternal = this.queueService;
            if (!queueServiceInternal.channel) {
                this.logger.warn("RabbitMQ channel not available, consumer disabled");
                return;
            }
            this.channel = queueServiceInternal.channel;
            const queue = "content.process";
            await this.channel.assertQueue(queue, { durable: true });
            await this.channel.prefetch(1);
            this.logger.log(`🎧 Listening for messages on queue: ${queue}`);
            this.channel.consume(queue, async (msg) => {
                var _a, _b;
                if (!msg)
                    return;
                try {
                    const content = JSON.parse(msg.content.toString());
                    this.logger.log(`📥 Processing ${content.action} for content ${content.contentId}`);
                    await this.processMessage(content);
                    (_a = this.channel) === null || _a === void 0 ? void 0 : _a.ack(msg);
                }
                catch (error) {
                    this.logger.error(`❌ Error processing message: ${error.message}`, error.stack);
                    (_b = this.channel) === null || _b === void 0 ? void 0 : _b.nack(msg, false, true);
                }
            }, { noAck: false });
        }
        catch (error) {
            this.logger.error(`Failed to start consumer: ${error.message}`);
        }
    }
    async processMessage(message) {
        const { action, contentId, text, level, targetLang } = message;
        try {
            if (action === "SIMPLIFY") {
                await this.handleSimplification(contentId, text, level, targetLang);
            }
            else if (action === "ASSESSMENT") {
                await this.handleAssessment(contentId, text, level);
            }
            this.logger.log(`✅ Completed ${action} for content ${contentId}`);
        }
        catch (error) {
            this.logger.error(`Failed to process ${action}: ${error.message}`, error.stack);
            throw error;
        }
    }
    async handleSimplification(contentId, text, level, targetLang) {
        this.logger.log(`Simplifying content ${contentId} to level ${level} using Gemini AI`);
        const lang = targetLang || client_1.Language.PT_BR;
        const schoolingLevel = level || "5_EF";
        try {
            const result = await this.aiContentService.simplifyText({
                text,
                targetLevel: schoolingLevel,
                targetLanguage: lang,
            });
            await this.prisma.content_versions.create({
                data: {
                    id: crypto.randomUUID(),
                    content_id: contentId,
                    target_language: lang,
                    schooling_level_target: schoolingLevel,
                    simplified_text: result.simplifiedText,
                    summary: result.summary,
                },
            });
            this.logger.log(`✅ Saved AI-simplified version for content ${contentId}`);
        }
        catch (error) {
            this.logger.error(`AI simplification failed: ${error.message}`);
            if (error.message === "QUOTA_EXCEEDED") {
                this.notificationsGateway.emitContentError(contentId, "simplification", "QUOTA_EXCEEDED", "Cota de IA excedida. Tente novamente mais tarde.");
                return;
            }
            this.logger.warn(`Using fallback simplification for content ${contentId}`);
            this.notificationsGateway.emitContentError(contentId, "simplification", "AI_FALLBACK", "Simplificação gerada sem IA devido a erro no serviço.");
            const simplifiedText = `[Simplificado (Modo Offline) para ${schoolingLevel}]\n\n${text.substring(0, 500)}...`;
            const summary = `Resumo automático (Offline): ${text.substring(0, 100)}...`;
            await this.prisma.content_versions.create({
                data: {
                    id: crypto.randomUUID(),
                    content_id: contentId,
                    target_language: lang,
                    schooling_level_target: schoolingLevel,
                    simplified_text: simplifiedText,
                    summary,
                },
            });
            this.notificationsGateway.emitContentUpdate(contentId, "simplification");
        }
    }
    async handleAssessment(contentId, text, level) {
        this.logger.log(`Generating assessment for content ${contentId} using Gemini AI`);
        const schoolingLevel = level || "1_EM";
        try {
            const result = await this.aiContentService.generateAssessment({
                text,
                level: schoolingLevel,
                questionCount: 5,
            });
            const questionsToCreate = result.questions.map((q) => ({
                id: crypto.randomUUID(),
                question_text: q.questionText,
                question_type: this.mapQuestionType(q.questionType),
                options: q.options || [],
                correct_answer: q.correctAnswer,
            }));
            await this.prisma.assessments.create({
                data: {
                    id: crypto.randomUUID(),
                    contents: { connect: { id: contentId } },
                    schooling_level_target: schoolingLevel,
                    updated_at: new Date(),
                    assessment_questions: {
                        create: questionsToCreate,
                    },
                },
            });
            this.logger.log(`✅ Created AI-generated assessment for content ${contentId}`);
            this.notificationsGateway.emitContentUpdate(contentId, "assessment");
        }
        catch (error) {
            this.logger.error(`AI assessment generation failed: ${error.message}`);
            if (error.message === "QUOTA_EXCEEDED") {
                this.notificationsGateway.emitContentError(contentId, "assessment", "QUOTA_EXCEEDED", "Não foi possível gerar a avaliação: Limite de cota da IA excedido.");
            }
            else {
                this.notificationsGateway.emitContentError(contentId, "assessment", "AI_ERROR", "Erro ao gerar avaliação com IA. Tente novamente.");
            }
            throw error;
        }
    }
    mapQuestionType(type) {
        if (type === "MULTIPLE_CHOICE")
            return client_1.QuestionType.MULTIPLE_CHOICE;
        if (type === "TRUE_FALSE")
            return client_1.QuestionType.TRUE_FALSE;
        return client_1.QuestionType.SHORT_ANSWER;
    }
};
exports.QueueConsumerService = QueueConsumerService;
exports.QueueConsumerService = QueueConsumerService = QueueConsumerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [queue_service_1.QueueService,
        prisma_service_1.PrismaService,
        ai_content_service_1.AIContentService,
        notifications_gateway_1.NotificationsGateway])
], QueueConsumerService);
//# sourceMappingURL=queue-consumer.service.js.map