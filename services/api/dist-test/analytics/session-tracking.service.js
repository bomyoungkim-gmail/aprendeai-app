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
var SessionTrackingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionTrackingService = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const prisma_service_1 = require("../prisma/prisma.service");
const track_study_session_use_case_1 = require("./application/use-cases/track-study-session.use-case");
let SessionTrackingService = SessionTrackingService_1 = class SessionTrackingService {
    constructor(prisma, trackUseCase) {
        this.prisma = prisma;
        this.trackUseCase = trackUseCase;
        this.logger = new common_1.Logger(SessionTrackingService_1.name);
    }
    async handleSessionStart(event) {
        const user_id = event.user_id || event.userId;
        const activity_type = event.activity_type || event.activityType;
        const content_id = event.content_id || event.contentId;
        const source_id = event.source_id || event.sourceId;
        return this.trackUseCase.startSession(user_id, activity_type, content_id, source_id);
    }
    async handleSessionFinish(event) {
        return this.trackUseCase.finishSession(event.sessionId, {
            durationMinutes: event.duration_minutes || event.durationMinutes,
            netFocusMinutes: event.net_focus_minutes || event.netFocusMinutes,
            interruptions: event.interruptions,
            accuracyRate: event.accuracy_rate || event.accuracyRate,
            engagementScore: event.engagement_score || event.engagementScore,
        });
    }
    async handleSessionHeartbeat(event) {
        await this.trackUseCase.heartbeat(event.sessionId, event.status);
    }
    async handleReadingActivity(event) {
        const user_id = event.user_id || event.userId;
        const content_id = event.content_id || event.contentId;
        await this.trackUseCase.handleReadingActivity(user_id, content_id);
    }
    async findActiveSession(user_id, activityType) {
        return this.trackUseCase["repository"].findActiveSession(user_id, activityType);
    }
    async autoCloseAbandonedSessions(thresholdMinutes = 30) {
        const abandoned = await this.trackUseCase["repository"].findAbandonedSessions(thresholdMinutes);
        for (const session of abandoned) {
            const threshold = new Date(Date.now() - thresholdMinutes * 60 * 1000);
            const duration = Math.floor((threshold.getTime() - session.startTime.getTime()) /
                (1000 * 60));
            await this.trackUseCase.finishSession(session.id, {
                durationMinutes: duration,
                engagementScore: 20
            });
        }
        this.logger.log(`Auto-closed ${abandoned.length} abandoned sessions`);
        return abandoned.length;
    }
};
exports.SessionTrackingService = SessionTrackingService;
__decorate([
    (0, event_emitter_1.OnEvent)("session.started"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SessionTrackingService.prototype, "handleSessionStart", null);
__decorate([
    (0, event_emitter_1.OnEvent)("session.finished"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SessionTrackingService.prototype, "handleSessionFinish", null);
__decorate([
    (0, event_emitter_1.OnEvent)("session.heartbeat"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SessionTrackingService.prototype, "handleSessionHeartbeat", null);
__decorate([
    (0, event_emitter_1.OnEvent)("reading.activity"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SessionTrackingService.prototype, "handleReadingActivity", null);
exports.SessionTrackingService = SessionTrackingService = SessionTrackingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        track_study_session_use_case_1.TrackStudySessionUseCase])
], SessionTrackingService);
//# sourceMappingURL=session-tracking.service.js.map