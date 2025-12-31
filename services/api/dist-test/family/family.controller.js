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
exports.FamilyController = void 0;
const common_1 = require("@nestjs/common");
const family_service_1 = require("./family.service");
const family_policy_service_1 = require("./services/family-policy.service");
const co_reading_service_1 = require("./services/co-reading.service");
const teachback_service_1 = require("./services/teachback.service");
const family_dashboard_service_1 = require("./services/family-dashboard.service");
const ops_coach_service_1 = require("./services/ops-coach.service");
const family_mapper_1 = require("../mappers/family.mapper");
const create_family_dto_1 = require("./dto/create-family.dto");
const invite_member_dto_1 = require("./dto/invite-member.dto");
const family_policy_dto_1 = require("./dto/family-policy.dto");
const co_session_dto_1 = require("./dto/co-session.dto");
const jwt_auth_guard_1 = require("../auth/infrastructure/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/presentation/decorators/current-user.decorator");
let FamilyController = class FamilyController {
    constructor(familyService, policyService, coReadingService, teachBackService, dashboardService, opsCoachService) {
        this.familyService = familyService;
        this.policyService = policyService;
        this.coReadingService = coReadingService;
        this.teachBackService = teachBackService;
        this.dashboardService = dashboardService;
        this.opsCoachService = opsCoachService;
    }
    async create(dto, req) {
        const family = await this.familyService.create(req.user.id, dto);
        return family_mapper_1.FamilyMapper.toDto(family);
    }
    async findAll(user) {
        const families = await this.familyService.findAllForUser(user.id);
        return family_mapper_1.FamilyMapper.toCollectionDto(families);
    }
    async getMyFamily(req) {
        const family = await this.familyService.getFamilyForOwner(req.user.id);
        if (!family)
            return {};
        return family_mapper_1.FamilyMapper.toDto(family);
    }
    findOne(id, user) {
        return this.familyService.findOne(id, user.id);
    }
    invite(id, user, inviteDto) {
        return this.familyService.inviteMember(id, user.id, inviteDto);
    }
    acceptInvite(id, user) {
        return this.familyService.acceptInvite(id, user.id);
    }
    getUsage(id, user) {
        return this.familyService.getAnalytics(id, user.id);
    }
    removeMember(id, memberUserId, user) {
        return this.familyService.removeMember(id, user.id, memberUserId);
    }
    transferOwnership(id, user, newOwnerId) {
        return this.familyService.transferOwnership(id, user.id, newOwnerId);
    }
    setPrimary(id, user) {
        return this.familyService.setPrimaryFamily(user.id, id);
    }
    deleteFamily(id, user) {
        return this.familyService.deleteFamily(id, user.id);
    }
    async createPolicy(dto) {
        return this.policyService.create(dto);
    }
    getEducatorDashboard(familyId, learnerId) {
        return this.dashboardService.getEducatorDashboard(familyId, learnerId);
    }
    startCoSession(dto) {
        return this.coReadingService.start(dto);
    }
    startTeachBack(dto) {
        return this.teachBackService.start(dto);
    }
    getPolicyConfirmationPrompt(policyId) {
        return this.policyService.getConfirmationPrompt(policyId);
    }
    finishCoSession(sessionId, body) {
        if (body.context.startedAt)
            body.context.startedAt = new Date(body.context.startedAt);
        if (body.context.phaseStartedAt)
            body.context.phaseStartedAt = new Date(body.context.phaseStartedAt);
        return this.coReadingService.finish(sessionId, body.context);
    }
    getCoSessionPrompt(sessionId, body) {
        const promptKeys = {
            BOOT: "OPS_DAILY_BOOT_LEARNER",
            PRE: "READ_PRE_CHOICE_SKIM",
            DURING: "READ_DURING_MARK_RULE",
            POST: "READ_POST_FREE_RECALL",
        };
        return this.opsCoachService.getDailyBootLearner();
    }
    getTeachBackPrompt(sessionId, body) {
        const step = body.step || 1;
        if (step === 1)
            return this.teachBackService.offerMission("learner_id");
        if (step === 2)
            return this.teachBackService.getStep2Prompt();
        if (step === 3)
            return this.teachBackService.getStep3Prompt();
        return { error: "Invalid step" };
    }
    finishTeachBackSession(sessionId, body) {
        return this.teachBackService.finish(sessionId, body.stars);
    }
    getWeeklyReportPrompt(body) {
        return this.opsCoachService.getWeeklyReportEducator(body.streak, body.compAvg);
    }
};
exports.FamilyController = FamilyController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a new family" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_family_dto_1.CreateFamilyDto, Object]),
    __metadata("design:returntype", Promise)
], FamilyController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "List my families" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FamilyController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("my-family"),
    (0, swagger_1.ApiOperation)({ summary: "Get primary family for dashboard" }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FamilyController.prototype, "getMyFamily", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get family details" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(":id/invite"),
    (0, swagger_1.ApiOperation)({ summary: "Invite a member to the family" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, invite_member_dto_1.InviteMemberDto]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "invite", null);
__decorate([
    (0, common_1.Post)(":id/accept"),
    (0, swagger_1.ApiOperation)({ summary: "Accept invitation to join family" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "acceptInvite", null);
__decorate([
    (0, common_1.Get)(":id/usage"),
    (0, swagger_1.ApiOperation)({ summary: "Get family usage analytics" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "getUsage", null);
__decorate([
    (0, common_1.Delete)(":id/members/:memberUserId"),
    (0, swagger_1.ApiOperation)({ summary: "Remove a member from the family" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("memberUserId")),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Post)(":id/transfer-ownership"),
    (0, swagger_1.ApiOperation)({ summary: "Transfer family ownership" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)("newOwnerId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "transferOwnership", null);
__decorate([
    (0, common_1.Post)(":id/primary"),
    (0, swagger_1.ApiOperation)({ summary: "Set family as primary context" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "setPrimary", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Delete a family" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "deleteFamily", null);
__decorate([
    (0, common_1.Post)("policy"),
    (0, swagger_1.ApiOperation)({ summary: "Create family policy" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [family_policy_dto_1.CreateFamilyPolicyDto]),
    __metadata("design:returntype", Promise)
], FamilyController.prototype, "createPolicy", null);
__decorate([
    (0, common_1.Get)(":familyId/educator-dashboard/:learnerId"),
    (0, swagger_1.ApiOperation)({ summary: "Get educator dashboard" }),
    __param(0, (0, common_1.Param)("familyId")),
    __param(1, (0, common_1.Param)("learnerId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "getEducatorDashboard", null);
__decorate([
    (0, common_1.Post)("co-sessions/start"),
    (0, swagger_1.ApiOperation)({ summary: "Start co-reading session" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [co_session_dto_1.StartCoSessionDto]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "startCoSession", null);
__decorate([
    (0, common_1.Post)("teachback/start"),
    (0, swagger_1.ApiOperation)({ summary: "Start teach-back session" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [co_session_dto_1.StartTeachBackDto]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "startTeachBack", null);
__decorate([
    (0, common_1.Post)("policy/:policyId/prompt"),
    (0, swagger_1.ApiOperation)({ summary: "Get policy confirmation prompt" }),
    __param(0, (0, common_1.Param)("policyId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "getPolicyConfirmationPrompt", null);
__decorate([
    (0, common_1.Post)("co-sessions/:id/finish"),
    (0, swagger_1.ApiOperation)({ summary: "Finish co-reading session" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "finishCoSession", null);
__decorate([
    (0, common_1.Post)("co-sessions/:id/prompt"),
    (0, swagger_1.ApiOperation)({ summary: "Get co-reading session prompt" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "getCoSessionPrompt", null);
__decorate([
    (0, common_1.Post)("teachback/:id/prompt"),
    (0, swagger_1.ApiOperation)({ summary: "Get teach-back step prompt" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "getTeachBackPrompt", null);
__decorate([
    (0, common_1.Post)("teachback/:id/finish"),
    (0, swagger_1.ApiOperation)({ summary: "Finish teach-back session" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "finishTeachBackSession", null);
__decorate([
    (0, common_1.Post)("reports/weekly/prompt"),
    (0, swagger_1.ApiOperation)({ summary: "Get weekly report prompt" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FamilyController.prototype, "getWeeklyReportPrompt", null);
exports.FamilyController = FamilyController = __decorate([
    (0, swagger_1.ApiTags)("Family"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("families"),
    __metadata("design:paramtypes", [family_service_1.FamilyService,
        family_policy_service_1.FamilyPolicyService,
        co_reading_service_1.CoReadingService,
        teachback_service_1.TeachBackService,
        family_dashboard_service_1.FamilyDashboardService,
        ops_coach_service_1.OpsCoachService])
], FamilyController);
//# sourceMappingURL=family.controller.js.map