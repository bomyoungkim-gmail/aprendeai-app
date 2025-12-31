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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitAssessmentUseCase = void 0;
const common_1 = require("@nestjs/common");
const assessment_repository_interface_1 = require("../../domain/interfaces/assessment.repository.interface");
const assessment_attempt_entity_1 = require("../../domain/entities/assessment-attempt.entity");
const topic_mastery_service_1 = require("../../../analytics/topic-mastery.service");
const crypto = require("crypto");
let SubmitAssessmentUseCase = class SubmitAssessmentUseCase {
    constructor(assessmentRepository, topicMastery) {
        this.assessmentRepository = assessmentRepository;
        this.topicMastery = topicMastery;
    }
    async execute(userId, assessmentId, dto) {
        var _a, _b;
        const assessment = await this.assessmentRepository.findById(assessmentId);
        if (!assessment) {
            throw new common_1.NotFoundException("Assessment not found");
        }
        let scorePoints = 0;
        const totalQuestions = ((_a = assessment.questions) === null || _a === void 0 ? void 0 : _a.length) || 0;
        const assessmentAnswers = [];
        for (const answerDto of dto.answers) {
            const question = (_b = assessment.questions) === null || _b === void 0 ? void 0 : _b.find((q) => q.id === answerDto.questionId);
            if (!question)
                continue;
            const isCorrect = JSON.stringify(question.correctAnswer) ===
                JSON.stringify(answerDto.userAnswer);
            if (isCorrect)
                scorePoints++;
            assessmentAnswers.push({
                id: crypto.randomUUID(),
                questionId: question.id,
                userAnswer: answerDto.userAnswer,
                isCorrect: isCorrect,
                timeSpentSeconds: answerDto.timeSpentSeconds || 0,
            });
        }
        const scorePercent = totalQuestions > 0 ? (scorePoints / totalQuestions) * 100 : 0;
        const attempt = new assessment_attempt_entity_1.AssessmentAttempt({
            id: crypto.randomUUID(),
            assessmentId: assessmentId,
            userId: userId,
            scoreRaw: scorePoints,
            scorePercent: scorePercent,
            finishedAt: new Date(),
        });
        const createdAttempt = await this.assessmentRepository.createAttempt(attempt, assessmentAnswers);
        return createdAttempt;
    }
};
exports.SubmitAssessmentUseCase = SubmitAssessmentUseCase;
exports.SubmitAssessmentUseCase = SubmitAssessmentUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(assessment_repository_interface_1.IAssessmentRepository)),
    __metadata("design:paramtypes", [Object, topic_mastery_service_1.TopicMasteryService])
], SubmitAssessmentUseCase);
//# sourceMappingURL=submit-assessment.use-case.js.map