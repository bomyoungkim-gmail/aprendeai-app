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
var AdvancePhaseUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancePhaseUseCase = void 0;
const common_1 = require("@nestjs/common");
const sessions_repository_interface_1 = require("../../domain/sessions.repository.interface");
const cornell_repository_interface_1 = require("../../../cornell/domain/interfaces/cornell.repository.interface");
let AdvancePhaseUseCase = AdvancePhaseUseCase_1 = class AdvancePhaseUseCase {
    constructor(sessionsRepository, cornellRepository) {
        this.sessionsRepository = sessionsRepository;
        this.cornellRepository = cornellRepository;
        this.logger = new common_1.Logger(AdvancePhaseUseCase_1.name);
    }
    async execute(sessionId, userId, toPhase) {
        const session = await this.sessionsRepository.findById(sessionId);
        if (!session)
            throw new common_1.NotFoundException("Session not found");
        if (session.userId !== userId)
            throw new common_1.ForbiddenException("Access denied");
        if (toPhase === "POST") {
            if (session.phase !== "PRE" && session.phase !== "DURING") {
                throw new common_1.BadRequestException("Can only advance to POST from PRE or DURING phase");
            }
        }
        if (toPhase === "FINISHED") {
            if (session.phase !== "POST") {
                throw new common_1.BadRequestException("Can only finish from POST phase");
            }
            await this.validatePostCompletion(sessionId, userId, session.contentId);
        }
        const updated = await this.sessionsRepository.update(sessionId, {
            phase: toPhase,
            finishedAt: toPhase === "FINISHED" ? new Date() : undefined
        });
        return updated;
    }
    async validatePostCompletion(sessionId, userId, contentId) {
        const notes = await this.cornellRepository.findByContentAndUser(contentId, userId);
        if (!(notes === null || notes === void 0 ? void 0 : notes.summary) || !notes.summary.trim()) {
            throw new common_1.BadRequestException("Cornell Notes summary is required to complete the session. Please add a summary in the Cornell Notes section.");
        }
        const events = await this.sessionsRepository.findEvents(sessionId);
        const hasQuiz = events.some(e => e.eventType === "QUIZ_RESPONSE" || e.eventType === "CHECKPOINT_RESPONSE");
        if (!hasQuiz) {
            throw new common_1.BadRequestException("At least 1 quiz or checkpoint response is required to complete the session.");
        }
        const hasProduction = events.some(e => e.eventType === "PRODUCTION_SUBMIT");
        if (!hasProduction) {
            throw new common_1.BadRequestException("Production text submission is required to complete the session.");
        }
    }
};
exports.AdvancePhaseUseCase = AdvancePhaseUseCase;
exports.AdvancePhaseUseCase = AdvancePhaseUseCase = AdvancePhaseUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(sessions_repository_interface_1.ISessionsRepository)),
    __param(1, (0, common_1.Inject)(cornell_repository_interface_1.ICornellRepository)),
    __metadata("design:paramtypes", [Object, Object])
], AdvancePhaseUseCase);
//# sourceMappingURL=advance-phase.use-case.js.map