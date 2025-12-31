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
var TrackStudySessionUseCase_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackStudySessionUseCase = void 0;
const common_1 = require("@nestjs/common");
const analytics_repository_interface_1 = require("../../domain/analytics.repository.interface");
const study_session_entity_1 = require("../../domain/study-session.entity");
const uuid_1 = require("uuid");
let TrackStudySessionUseCase = TrackStudySessionUseCase_1 = class TrackStudySessionUseCase {
    constructor(repository) {
        this.repository = repository;
        this.logger = new common_1.Logger(TrackStudySessionUseCase_1.name);
    }
    async startSession(userId, activityType, contentId, sourceId) {
        const session = new study_session_entity_1.StudySession({
            id: (0, uuid_1.v4)(),
            userId,
            activityType,
            contentId,
            sourceId,
            startTime: new Date(),
        });
        const created = await this.repository.createSession(session);
        this.logger.log(`Session started: ${created.id} (${activityType}) for user ${userId}`);
        return created;
    }
    async finishSession(sessionId, data) {
        let focusScore;
        if (data.netFocusMinutes != null && data.durationMinutes != null && data.durationMinutes > 0) {
            focusScore = (data.netFocusMinutes / data.durationMinutes) * 100;
        }
        const updated = await this.repository.updateSession(sessionId, {
            endTime: new Date(),
            durationMinutes: data.durationMinutes,
            netFocusMinutes: data.netFocusMinutes,
            interruptions: data.interruptions,
            focusScore,
            accuracyRate: data.accuracyRate,
            engagementScore: data.engagementScore,
        });
        this.logger.log(`Session finished: ${updated.id} (Focus: ${focusScore === null || focusScore === void 0 ? void 0 : focusScore.toFixed(1)}%)`);
        return updated;
    }
    async heartbeat(sessionId, status) {
        if (status === "blurred") {
            await this.repository.incrementInterruptions(sessionId);
        }
    }
    async handleReadingActivity(userId, contentId) {
        let activeSession = await this.repository.findReadingSession(userId, contentId);
        if (!activeSession) {
            activeSession = await this.startSession(userId, "reading", contentId);
        }
        const idleTime = Date.now() - activeSession.startTime.getTime();
        if (idleTime > 15 * 60 * 1000) {
            const durationMinutes = Math.floor(idleTime / (1000 * 60));
            await this.finishSession(activeSession.id, {
                durationMinutes,
                engagementScore: 70
            });
            this.logger.log(`Reading session auto-closed: ${activeSession.id}`);
        }
    }
};
exports.TrackStudySessionUseCase = TrackStudySessionUseCase;
exports.TrackStudySessionUseCase = TrackStudySessionUseCase = TrackStudySessionUseCase_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(analytics_repository_interface_1.IAnalyticsRepository)),
    __metadata("design:paramtypes", [Object])
], TrackStudySessionUseCase);
//# sourceMappingURL=track-study-session.use-case.js.map