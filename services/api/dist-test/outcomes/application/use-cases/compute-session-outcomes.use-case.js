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
exports.ComputeSessionOutcomesUseCase = void 0;
const common_1 = require("@nestjs/common");
const outcomes_repository_interface_1 = require("../../domain/outcomes.repository.interface");
const session_outcome_entity_1 = require("../../domain/session-outcome.entity");
const sessions_repository_interface_1 = require("../../../sessions/domain/sessions.repository.interface");
const content_repository_interface_1 = require("../../../cornell/domain/content.repository.interface");
let ComputeSessionOutcomesUseCase = class ComputeSessionOutcomesUseCase {
    constructor(sessionsRepository, contentRepository, outcomesRepository) {
        this.sessionsRepository = sessionsRepository;
        this.contentRepository = contentRepository;
        this.outcomesRepository = outcomesRepository;
    }
    async execute(sessionId) {
        const session = await this.sessionsRepository.findById(sessionId);
        if (!session) {
            throw new common_1.NotFoundException(`Session ${sessionId} not found`);
        }
        const content = await this.contentRepository.findById(session.contentId);
        if (!content) {
            throw new common_1.NotFoundException(`Content not found for session ${sessionId}`);
        }
        const validationContext = Object.assign(Object.assign({}, session), { session_events: session.events || [], contents: content });
        const comprehension = await this.calculateComprehension(validationContext);
        const production = await this.calculateProduction(validationContext);
        const frustration = await this.calculateFrustration(validationContext);
        const outcome = new session_outcome_entity_1.SessionOutcome({
            readingSessionId: sessionId,
            comprehensionScore: comprehension,
            productionScore: production,
            frustrationIndex: frustration,
            computedAt: new Date(),
        });
        return this.outcomesRepository.upsert(outcome);
    }
    async calculateComprehension(session) {
        var _a, _b;
        let score = 50;
        const quizEvents = session.session_events.filter((e) => e.event_type === "QUIZ_RESPONSE");
        if (quizEvents.length > 0) {
            const correctCount = quizEvents.filter((e) => { var _a; return ((_a = e.payload_json) === null || _a === void 0 ? void 0 : _a.correct) === true; }).length;
            const quizAccuracy = correctCount / quizEvents.length;
            score += (quizAccuracy - 0.5) * 40;
        }
        const checkpointEvents = session.session_events.filter((e) => e.event_type === "CHECKPOINT_RESPONSE");
        if (checkpointEvents.length > 0) {
            const avgLength = checkpointEvents.reduce((sum, e) => { var _a, _b; return sum + (((_b = (_a = e.payload_json) === null || _a === void 0 ? void 0 : _a.response) === null || _b === void 0 ? void 0 : _b.length) || 0); }, 0) / checkpointEvents.length;
            if (avgLength > 50)
                score += 10;
            else if (avgLength < 20)
                score -= 10;
        }
        const unknownWordEvents = session.session_events.filter((e) => e.event_type === "MARK_UNKNOWN_WORD");
        const textLength = ((_b = (_a = session.contents) === null || _a === void 0 ? void 0 : _a.raw_text) === null || _b === void 0 ? void 0 : _b.length) || 1000;
        const unknownRate = unknownWordEvents.length / (textLength / 100);
        if (unknownRate > 2)
            score -= 15;
        else if (unknownRate < 0.5)
            score += 10;
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    async calculateProduction(session) {
        let score = 50;
        const keyIdeaEvents = session.session_events.filter((e) => e.event_type === "MARK_KEY_IDEA");
        if (keyIdeaEvents.length === 0) {
            score = 5;
        }
        else if (keyIdeaEvents.length < 3) {
            score = 25;
        }
        else if (keyIdeaEvents.length < 7) {
            score = 55;
        }
        else if (keyIdeaEvents.length < 12) {
            score = 80;
        }
        else {
            score = 95;
        }
        const productionEvents = session.session_events.filter((e) => e.event_type === "PRODUCTION_SUBMIT");
        if (productionEvents.length > 0) {
            const avgLength = productionEvents.reduce((sum, e) => { var _a, _b; return sum + (((_b = (_a = e.payload_json) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.length) || 0); }, 0) / productionEvents.length;
            if (avgLength > 200)
                score += 15;
            else if (avgLength > 100)
                score += 10;
            else if (avgLength > 50)
                score += 5;
        }
        return Math.max(0, Math.min(100, Math.round(score)));
    }
    async calculateFrustration(session) {
        var _a, _b;
        let frustration = 0;
        const expectedDuration = this.estimateExpectedDuration(session);
        const actualDuration = this.calculateActualDuration(session);
        if (actualDuration > expectedDuration * 2) {
            frustration += 30;
        }
        else if (actualDuration > expectedDuration * 1.5) {
            frustration += 15;
        }
        const unknownWordEvents = session.session_events.filter((e) => e.event_type === "MARK_UNKNOWN_WORD");
        const textLength = ((_b = (_a = session.contents) === null || _a === void 0 ? void 0 : _a.raw_text) === null || _b === void 0 ? void 0 : _b.length) || 1000;
        const unknownRate = unknownWordEvents.length / (textLength / 100);
        if (unknownRate > 3)
            frustration += 25;
        else if (unknownRate > 2)
            frustration += 15;
        else if (unknownRate > 1)
            frustration += 5;
        const checkpointEvents = session.session_events.filter((e) => e.event_type === "CHECKPOINT_RESPONSE");
        const weakResponses = checkpointEvents.filter((e) => { var _a, _b; return (((_b = (_a = e.payload_json) === null || _a === void 0 ? void 0 : _a.response) === null || _b === void 0 ? void 0 : _b.length) || 0) < 10; }).length;
        if (weakResponses > checkpointEvents.length * 0.5) {
            frustration += 20;
        }
        const quizEvents = session.session_events.filter((e) => e.event_type === "QUIZ_RESPONSE");
        const incorrectCount = quizEvents.filter((e) => { var _a; return ((_a = e.payload_json) === null || _a === void 0 ? void 0 : _a.correct) === false; }).length;
        const quizFailureRate = quizEvents.length > 0 ? incorrectCount / quizEvents.length : 0;
        if (quizFailureRate > 0.6)
            frustration += 20;
        else if (quizFailureRate > 0.4)
            frustration += 10;
        return Math.max(0, Math.min(100, Math.round(frustration)));
    }
    estimateExpectedDuration(session) {
        var _a, _b;
        const textLength = ((_b = (_a = session.contents) === null || _a === void 0 ? void 0 : _a.raw_text) === null || _b === void 0 ? void 0 : _b.length) || 1000;
        const wordsCount = textLength / 5;
        const baseMinutes = (wordsCount / 200) * 1.5;
        const layerMultiplier = {
            L1: 0.8,
            L2: 1.0,
            L3: 1.3,
        };
        const layer = session.asset_layer || "L2";
        const expectedMinutes = baseMinutes * (layerMultiplier[layer] || 1.0);
        return expectedMinutes * 60;
    }
    calculateActualDuration(session) {
        if (!session.session_events || session.session_events.length === 0)
            return 0;
        const timestamps = session.session_events
            .map((e) => e.created_at || new Date())
            .filter((t) => t instanceof Date)
            .sort((a, b) => a.getTime() - b.getTime());
        if (timestamps.length === 0)
            return 0;
        const start = timestamps[0];
        const end = timestamps[timestamps.length - 1];
        return (end.getTime() - start.getTime()) / 1000;
    }
};
exports.ComputeSessionOutcomesUseCase = ComputeSessionOutcomesUseCase;
exports.ComputeSessionOutcomesUseCase = ComputeSessionOutcomesUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(sessions_repository_interface_1.ISessionsRepository)),
    __param(1, (0, common_1.Inject)(content_repository_interface_1.IContentRepository)),
    __param(2, (0, common_1.Inject)(outcomes_repository_interface_1.IOutcomesRepository)),
    __metadata("design:paramtypes", [Object, Object, Object])
], ComputeSessionOutcomesUseCase);
//# sourceMappingURL=compute-session-outcomes.use-case.js.map