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
exports.ReadingSessionsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const reading_sessions_service_1 = require("./reading-sessions.service");
const reading_sessions_dto_1 = require("./dto/reading-sessions.dto");
const start_session_dto_1 = require("./dto/start-session.dto");
const prompt_message_dto_1 = require("./dto/prompt-message.dto");
const sessions_query_dto_1 = require("./dto/sessions-query.dto");
let ReadingSessionsController = class ReadingSessionsController {
    constructor(sessionService) {
        this.sessionService = sessionService;
    }
    async startSessionPromptOnly(dto, req) {
        return this.sessionService.startSessionPromptOnly(req.user.id, dto);
    }
    async sendPrompt(sessionId, dto, req) {
        return this.sessionService.processPrompt(sessionId, dto, req.user.id);
    }
    async finishSessionPromptOnly(sessionId, dto, req) {
        return this.sessionService.finishSessionPromptOnly(sessionId, req.user.id, dto);
    }
    async getUserSessions(req, query) {
        return this.sessionService.getUserSessions(req.user.id, query);
    }
    async exportSessions(req, format = "json") {
        const result = await this.sessionService.exportSessions(req.user.id, format);
        if (format === "csv") {
            return {
                data: result.csv,
                filename: `sessions_${new Date().toISOString().split("T")[0]}.csv`,
            };
        }
        return result;
    }
    async getAnalytics(req, days = "30") {
        return this.sessionService.getActivityAnalytics(req.user.id, parseInt(days));
    }
    async startSession(contentId, req) {
        return this.sessionService.startSession(req.user.id, contentId);
    }
    async getSession(id, req) {
        return this.sessionService.getSession(id, req.user.id);
    }
    async updatePrePhase(id, dto, req) {
        return this.sessionService.updatePrePhase(id, req.user.id, dto);
    }
    async recordEvent(id, dto) {
        return this.sessionService.recordEvent(id, dto.eventType, dto.payload);
    }
    async advancePhase(id, dto, req) {
        return this.sessionService.advancePhase(id, req.user.id, dto.toPhase);
    }
    async createSessionForContent(contentId, req) {
        return this.sessionService.startSession(req.user.id, contentId);
    }
    async getSessionById(id, req) {
        return this.sessionService.getSession(id, req.user.id);
    }
    async updateSessionPrePhase(id, dto, req) {
        return this.sessionService.updatePrePhase(id, req.user.id, dto);
    }
    async recordSessionEvent(id, dto) {
        return this.sessionService.recordEvent(id, dto.eventType, dto.payload);
    }
    async advanceSessionPhase(id, dto, req) {
        return this.sessionService.advancePhase(id, req.user.id, dto.toPhase);
    }
};
exports.ReadingSessionsController = ReadingSessionsController;
__decorate([
    (0, common_1.Post)("sessions/start"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [start_session_dto_1.StartSessionDto, Object]),
    __metadata("design:returntype", Promise)
], ReadingSessionsController.prototype, "startSessionPromptOnly", null);
__decorate([
    (0, common_1.Post)("sessions/:id/prompt"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, prompt_message_dto_1.PromptMessageDto, Object]),
    __metadata("design:returntype", Promise)
], ReadingSessionsController.prototype, "sendPrompt", null);
__decorate([
    (0, common_1.Post)("sessions/:id/finish"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, start_session_dto_1.FinishSessionDto, Object]),
    __metadata("design:returntype", Promise)
], ReadingSessionsController.prototype, "finishSessionPromptOnly", null);
__decorate([
    (0, common_1.Get)("sessions"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, sessions_query_dto_1.SessionsQueryDto]),
    __metadata("design:returntype", Promise)
], ReadingSessionsController.prototype, "getUserSessions", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: "Export session history",
        description: "Export all user sessions to CSV or JSON format for data portability (LGPD compliance)",
    }),
    (0, swagger_1.ApiQuery)({
        name: "format",
        required: false,
        enum: ["csv", "json"],
        description: "Export format (default: json)",
    }),
    (0, common_1.Get)("sessions/export"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("format")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReadingSessionsController.prototype, "exportSessions", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: "Get session analytics",
        description: "Returns activity metrics and aggregations for visualization (heatmaps, phase distribution)",
    }),
    (0, swagger_1.ApiQuery)({
        name: "days",
        required: false,
        type: Number,
        description: "Number of days to analyze (default: 30)",
    }),
    (0, common_1.Get)("sessions/analytics"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("days")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReadingSessionsController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Post)("contents/:contentId/reading-sessions"),
    __param(0, (0, common_1.Param)("contentId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReadingSessionsController.prototype, "startSession", null);
__decorate([
    (0, common_1.Get)("reading-sessions/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReadingSessionsController.prototype, "getSession", null);
__decorate([
    (0, common_1.Put)("reading-sessions/:id/pre"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reading_sessions_dto_1.PrePhaseDto, Object]),
    __metadata("design:returntype", Promise)
], ReadingSessionsController.prototype, "updatePrePhase", null);
__decorate([
    (0, common_1.Post)("reading-sessions/:id/events"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reading_sessions_dto_1.RecordEventDto]),
    __metadata("design:returntype", Promise)
], ReadingSessionsController.prototype, "recordEvent", null);
__decorate([
    (0, common_1.Post)("reading-sessions/:id/advance"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reading_sessions_dto_1.AdvancePhaseDto, Object]),
    __metadata("design:returntype", Promise)
], ReadingSessionsController.prototype, "advancePhase", null);
__decorate([
    (0, common_1.Post)("contents/:id/sessions"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReadingSessionsController.prototype, "createSessionForContent", null);
__decorate([
    (0, common_1.Get)("sessions/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReadingSessionsController.prototype, "getSessionById", null);
__decorate([
    (0, common_1.Put)("sessions/:id/pre"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reading_sessions_dto_1.PrePhaseDto, Object]),
    __metadata("design:returntype", Promise)
], ReadingSessionsController.prototype, "updateSessionPrePhase", null);
__decorate([
    (0, common_1.Post)("sessions/:id/events"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reading_sessions_dto_1.RecordEventDto]),
    __metadata("design:returntype", Promise)
], ReadingSessionsController.prototype, "recordSessionEvent", null);
__decorate([
    (0, common_1.Post)("sessions/:id/advance"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reading_sessions_dto_1.AdvancePhaseDto, Object]),
    __metadata("design:returntype", Promise)
], ReadingSessionsController.prototype, "advanceSessionPhase", null);
exports.ReadingSessionsController = ReadingSessionsController = __decorate([
    (0, swagger_1.ApiTags)("sessions"),
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [reading_sessions_service_1.ReadingSessionsService])
], ReadingSessionsController);
//# sourceMappingURL=reading-sessions.controller.js.map