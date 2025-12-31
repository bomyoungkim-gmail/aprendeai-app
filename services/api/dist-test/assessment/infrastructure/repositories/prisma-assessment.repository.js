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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaAssessmentRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
const assessment_entity_1 = require("../../domain/entities/assessment.entity");
const assessment_attempt_entity_1 = require("../../domain/entities/assessment-attempt.entity");
const assessment_question_entity_1 = require("../../domain/entities/assessment-question.entity");
let PrismaAssessmentRepository = class PrismaAssessmentRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(assessment) {
        var _a;
        const created = await this.prisma.assessments.create({
            data: {
                id: assessment.id,
                content_id: assessment.contentId,
                content_version_id: assessment.contentVersionId,
                schooling_level_target: assessment.schoolingLevelTarget,
                updated_at: new Date(),
                assessment_questions: {
                    create: (_a = assessment.questions) === null || _a === void 0 ? void 0 : _a.map((q) => ({
                        id: q.id,
                        question_type: q.questionType,
                        question_text: q.questionText,
                        options: q.options,
                        correct_answer: q.correctAnswer,
                    })),
                },
            },
            include: {
                assessment_questions: true,
            },
        });
        return this.mapToDomain(created);
    }
    async findById(id) {
        const found = await this.prisma.assessments.findUnique({
            where: { id },
            include: {
                assessment_questions: true,
            },
        });
        if (!found)
            return null;
        return this.mapToDomain(found);
    }
    async findAllByUser(userId) {
        const found = await this.prisma.assessments.findMany({
            where: {
                contents: {
                    owner_user_id: userId,
                },
            },
            include: {
                assessment_questions: true,
            },
            orderBy: { created_at: "desc" },
        });
        return found.map((a) => this.mapToDomain(a));
    }
    async createAttempt(attempt, answers) {
        const created = await this.prisma.assessment_attempts.create({
            data: {
                id: attempt.id,
                assessment_id: attempt.assessmentId,
                user_id: attempt.userId,
                score_raw: attempt.scoreRaw,
                score_percent: attempt.scorePercent,
                finished_at: attempt.finishedAt,
                assessment_answers: {
                    create: answers.map((a) => ({
                        id: a.id,
                        question_id: a.questionId,
                        user_answer: a.userAnswer,
                        is_correct: a.isCorrect,
                        time_spent_seconds: a.timeSpentSeconds,
                    })),
                },
            },
        });
        return new assessment_attempt_entity_1.AssessmentAttempt({
            id: created.id,
            assessmentId: created.assessment_id,
            userId: created.user_id,
            scoreRaw: created.score_raw,
            scorePercent: created.score_percent || 0,
            finishedAt: created.finished_at,
            createdAt: created.created_at || new Date(),
        });
    }
    mapToDomain(prismaAssessment) {
        var _a;
        const questions = (_a = prismaAssessment.assessment_questions) === null || _a === void 0 ? void 0 : _a.map((q) => new assessment_question_entity_1.AssessmentQuestion({
            id: q.id,
            assessmentId: q.assessment_id,
            questionType: q.question_type,
            questionText: q.question_text,
            options: q.options,
            correctAnswer: q.correct_answer,
            createdAt: q.created_at,
        }));
        return new assessment_entity_1.Assessment({
            id: prismaAssessment.id,
            contentId: prismaAssessment.content_id,
            contentVersionId: prismaAssessment.content_version_id,
            schoolingLevelTarget: prismaAssessment.schooling_level_target,
            createdAt: prismaAssessment.created_at,
            updatedAt: prismaAssessment.updated_at,
            questions,
        });
    }
};
exports.PrismaAssessmentRepository = PrismaAssessmentRepository;
exports.PrismaAssessmentRepository = PrismaAssessmentRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaAssessmentRepository);
//# sourceMappingURL=prisma-assessment.repository.js.map