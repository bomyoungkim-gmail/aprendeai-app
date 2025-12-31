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
exports.StudyGroupsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const study_groups_service_1 = require("./study-groups.service");
const group_sessions_service_1 = require("./group-sessions.service");
const group_chat_service_1 = require("./group-chat.service");
const study_groups_ws_gateway_1 = require("../websocket/study-groups-ws.gateway");
const events_1 = require("../websocket/events");
const create_group_dto_1 = require("./dto/create-group.dto");
const invite_member_dto_1 = require("./dto/invite-member.dto");
const add_content_dto_1 = require("./dto/add-content.dto");
const send_chat_message_dto_1 = require("./dto/send-chat-message.dto");
let StudyGroupsController = class StudyGroupsController {
    constructor(studyGroupsService, groupSessionsService, groupChatService, wsGateway) {
        this.studyGroupsService = studyGroupsService;
        this.groupSessionsService = groupSessionsService;
        this.groupChatService = groupChatService;
        this.wsGateway = wsGateway;
    }
    async createGroup(req, dto) {
        return this.studyGroupsService.createGroup(req.user.id, dto);
    }
    async getMyGroups(req) {
        return this.studyGroupsService.getGroupsByUser(req.user.id);
    }
    async getGroup(groupId, req) {
        return this.studyGroupsService.getGroup(groupId, req.user.id);
    }
    async inviteMember(groupId, dto, req) {
        await this.studyGroupsService.inviteMember(groupId, req.user.id, dto);
        return { message: "Member invited successfully" };
    }
    async removeMember(groupId, userId, req) {
        await this.studyGroupsService.removeMember(groupId, req.user.id, userId);
        return { message: "Member removed successfully" };
    }
    async addContent(groupId, dto, req) {
        await this.studyGroupsService.addContent(groupId, req.user.id, dto.content_id);
        return { message: "Content added to playlist" };
    }
    async removeContent(groupId, contentId, req) {
        await this.studyGroupsService.removeContent(groupId, req.user.id, contentId);
        return { message: "Content removed from playlist" };
    }
    async getGroupSessions(groupId, req) {
        await this.studyGroupsService.getGroup(groupId, req.user.id);
        return this.groupSessionsService.getGroupSessions(groupId);
    }
    async sendChatMessage(sessionId, dto, req) {
        const chatMessage = await this.groupChatService.sendMessage(sessionId, req.user.id, dto);
        this.wsGateway.emitToSession(sessionId, events_1.StudyGroupEvent.CHAT_MESSAGE, Object.assign(Object.assign({}, chatMessage), { timestamp: new Date().toISOString() }));
        return chatMessage;
    }
    async getChatMessages(sessionId, round_index, req) {
        const roundIdx = parseInt(round_index, 10);
        return this.groupChatService.getMessages(sessionId, roundIdx, req.user.id);
    }
};
exports.StudyGroupsController = StudyGroupsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_group_dto_1.CreateGroupDto]),
    __metadata("design:returntype", Promise)
], StudyGroupsController.prototype, "createGroup", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudyGroupsController.prototype, "getMyGroups", null);
__decorate([
    (0, common_1.Get)(":groupId"),
    __param(0, (0, common_1.Param)("groupId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StudyGroupsController.prototype, "getGroup", null);
__decorate([
    (0, common_1.Post)(":groupId/members/invite"),
    __param(0, (0, common_1.Param)("groupId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, invite_member_dto_1.InviteGroupMemberDto, Object]),
    __metadata("design:returntype", Promise)
], StudyGroupsController.prototype, "inviteMember", null);
__decorate([
    (0, common_1.Delete)(":groupId/members/:userId"),
    __param(0, (0, common_1.Param)("groupId")),
    __param(1, (0, common_1.Param)("userId")),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], StudyGroupsController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Post)(":groupId/contents"),
    __param(0, (0, common_1.Param)("groupId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_content_dto_1.AddContentDto, Object]),
    __metadata("design:returntype", Promise)
], StudyGroupsController.prototype, "addContent", null);
__decorate([
    (0, common_1.Delete)(":groupId/contents/:contentId"),
    __param(0, (0, common_1.Param)("groupId")),
    __param(1, (0, common_1.Param)("contentId")),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], StudyGroupsController.prototype, "removeContent", null);
__decorate([
    (0, common_1.Get)(":groupId/sessions"),
    __param(0, (0, common_1.Param)("groupId")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StudyGroupsController.prototype, "getGroupSessions", null);
__decorate([
    (0, common_1.Post)("sessions/:sessionId/chat"),
    __param(0, (0, common_1.Param)("sessionId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, send_chat_message_dto_1.SendChatMessageDto, Object]),
    __metadata("design:returntype", Promise)
], StudyGroupsController.prototype, "sendChatMessage", null);
__decorate([
    (0, common_1.Get)("sessions/:sessionId/chat"),
    __param(0, (0, common_1.Param)("sessionId")),
    __param(1, (0, common_1.Query)("round_index")),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], StudyGroupsController.prototype, "getChatMessages", null);
exports.StudyGroupsController = StudyGroupsController = __decorate([
    (0, common_1.Controller)("groups"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __metadata("design:paramtypes", [study_groups_service_1.StudyGroupsService,
        group_sessions_service_1.GroupSessionsService,
        group_chat_service_1.GroupChatService,
        study_groups_ws_gateway_1.StudyGroupsWebSocketGateway])
], StudyGroupsController);
//# sourceMappingURL=study-groups.controller.js.map