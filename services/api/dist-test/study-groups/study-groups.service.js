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
exports.StudyGroupsService = void 0;
const common_1 = require("@nestjs/common");
const study_groups_repository_interface_1 = require("./domain/study-groups.repository.interface");
const create_study_group_use_case_1 = require("./application/use-cases/create-study-group.use-case");
const invite_group_member_use_case_1 = require("./application/use-cases/invite-group-member.use-case");
const manage_group_content_use_case_1 = require("./application/use-cases/manage-group-content.use-case");
let StudyGroupsService = class StudyGroupsService {
    constructor(repository, createGroupUseCase, inviteMemberUseCase, manageContentUseCase) {
        this.repository = repository;
        this.createGroupUseCase = createGroupUseCase;
        this.inviteMemberUseCase = inviteMemberUseCase;
        this.manageContentUseCase = manageContentUseCase;
    }
    async createGroup(userId, dto) {
        return this.createGroupUseCase.execute(userId, dto);
    }
    async getGroupsByUser(userId) {
        return this.repository.findByUser(userId);
    }
    async getGroup(groupId, userId) {
        return this.repository.findById(groupId);
    }
    async inviteMember(groupId, inviterId, dto) {
        return this.inviteMemberUseCase.execute(groupId, inviterId, dto);
    }
    async addContent(groupId, userId, contentId) {
        return this.manageContentUseCase.addContent(groupId, userId, contentId);
    }
    async removeContent(groupId, userId, contentId) {
        return this.manageContentUseCase.removeContent(groupId, userId, contentId);
    }
    async assertMembership(groupId, userId) {
        const member = await this.repository.findMember(groupId, userId);
        if (!member || member.status !== "ACTIVE") {
            throw new Error("Access denied: not an active member");
        }
        return member;
    }
    async getActiveMembers(groupId) {
        return this.repository.findActiveMembers(groupId);
    }
    async removeMember(groupId, removerId, targetUserId) {
        await this.repository.updateMember(groupId, targetUserId, { status: "REMOVED" });
    }
};
exports.StudyGroupsService = StudyGroupsService;
exports.StudyGroupsService = StudyGroupsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(study_groups_repository_interface_1.IStudyGroupsRepository)),
    __metadata("design:paramtypes", [Object, create_study_group_use_case_1.CreateStudyGroupUseCase,
        invite_group_member_use_case_1.InviteGroupMemberUseCase,
        manage_group_content_use_case_1.ManageGroupContentUseCase])
], StudyGroupsService);
//# sourceMappingURL=study-groups.service.js.map