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
exports.GroupSessionsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const group_sessions_service_1 = require("./group-sessions.service");
const group_rounds_service_1 = require("./group-rounds.service");
const create_session_dto_1 = require("./dto/create-session.dto");
const update_session_status_dto_1 = require("./dto/update-session-status.dto");
const update_prompt_dto_1 = require("./dto/update-prompt.dto");
const advance_round_dto_1 = require("./dto/advance-round.dto");
const submit_event_dto_1 = require("./dto/submit-event.dto");
let GroupSessionsController = class GroupSessionsController {
    constructor(groupSessionsService, groupRoundsService) {
        this.groupSessionsService = groupSessionsService;
        this.groupRoundsService = groupRoundsService;
    }
    async createSession(groupId, dto, req) {
        return this.groupSessionsService.createSession(groupId, req.user.id, dto);
    }
    async getSession(sessionId, req) {
        return this.groupSessionsService.getSession(sessionId, req.user.id);
    }
    async startSession(sessionId, req) {
        await this.groupSessionsService.startSession(sessionId, req.user.id);
        return { message: "Session started" };
    }
    async updateStatus(sessionId, dto, req) {
        await this.groupSessionsService.updateSessionStatus(sessionId, req.user.id, dto.status);
        return { message: "Session status updated" };
    }
    async updatePrompt(sessionId, roundIndex, dto, req) {
        return this.groupRoundsService.updatePrompt(sessionId, parseInt(roundIndex), req.user.id, dto);
    }
    async advanceRound(sessionId, roundIndex, dto, req) {
        return this.groupRoundsService.advanceRound(sessionId, parseInt(roundIndex), req.user.id, dto.to_status);
    }
    async submitEvent(sessionId, dto, req) {
        return this.groupRoundsService.submitEvent(sessionId, req.user.id, dto);
    }
    async getEvents(sessionId, round_index) {
        const index = round_index ? parseInt(round_index) : undefined;
        return this.groupRoundsService.getEvents(sessionId, index);
    }
    async getSharedCards(sessionId) {
        return this.groupRoundsService.getSharedCards(sessionId);
    }
};
exports.GroupSessionsController = GroupSessionsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Query)("groupId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_session_dto_1.CreateSessionDto, Object]),
    __metadata("design:returntype", Promise)
], GroupSessionsController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)(":sessionId"),
    __param(0, (0, common_1.Param)("sessionId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GroupSessionsController.prototype, "getSession", null);
__decorate([
    (0, common_1.Put)(":sessionId/start"),
    __param(0, (0, common_1.Param)("sessionId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GroupSessionsController.prototype, "startSession", null);
__decorate([
    (0, common_1.Put)(":sessionId/status"),
    __param(0, (0, common_1.Param)("sessionId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_session_status_dto_1.UpdateSessionStatusDto, Object]),
    __metadata("design:returntype", Promise)
], GroupSessionsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Put)(":sessionId/rounds/:roundIndex/prompt"),
    __param(0, (0, common_1.Param)("sessionId")),
    __param(1, (0, common_1.Param)("roundIndex")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_prompt_dto_1.UpdatePromptDto, Object]),
    __metadata("design:returntype", Promise)
], GroupSessionsController.prototype, "updatePrompt", null);
__decorate([
    (0, common_1.Post)(":sessionId/rounds/:roundIndex/advance"),
    __param(0, (0, common_1.Param)("sessionId")),
    __param(1, (0, common_1.Param)("roundIndex")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, advance_round_dto_1.AdvanceRoundDto, Object]),
    __metadata("design:returntype", Promise)
], GroupSessionsController.prototype, "advanceRound", null);
__decorate([
    (0, common_1.Post)(":sessionId/events"),
    __param(0, (0, common_1.Param)("sessionId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, submit_event_dto_1.SubmitEventDto, Object]),
    __metadata("design:returntype", Promise)
], GroupSessionsController.prototype, "submitEvent", null);
__decorate([
    (0, common_1.Get)(":sessionId/events"),
    __param(0, (0, common_1.Param)("sessionId")),
    __param(1, (0, common_1.Query)("round_index")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupSessionsController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Get)(":sessionId/shared-cards"),
    __param(0, (0, common_1.Param)("sessionId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupSessionsController.prototype, "getSharedCards", null);
exports.GroupSessionsController = GroupSessionsController = __decorate([
    (0, common_1.Controller)("group-sessions"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __metadata("design:paramtypes", [group_sessions_service_1.GroupSessionsService,
        group_rounds_service_1.GroupRoundsService])
], GroupSessionsController);
//# sourceMappingURL=group-sessions.controller.js.map