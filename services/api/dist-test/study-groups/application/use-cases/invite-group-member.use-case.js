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
exports.InviteGroupMemberUseCase = void 0;
const common_1 = require("@nestjs/common");
const study_groups_repository_interface_1 = require("../../domain/study-groups.repository.interface");
const study_group_entity_1 = require("../../domain/study-group.entity");
const uuid_1 = require("uuid");
let InviteGroupMemberUseCase = class InviteGroupMemberUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(groupId, inviterId, dto) {
        const inviter = await this.repository.findMember(groupId, inviterId);
        if (!inviter || inviter.status !== "ACTIVE") {
            throw new common_1.ForbiddenException("Access denied: not an active member");
        }
        if (!["OWNER", "MOD"].includes(inviter.role)) {
            throw new common_1.ForbiddenException("Access denied: requires role OWNER or MOD");
        }
        const existing = await this.repository.findMember(groupId, dto.user_id);
        if (existing) {
            if (existing.status === "ACTIVE") {
                throw new common_1.BadRequestException("User is already an active member");
            }
            await this.repository.updateMember(groupId, dto.user_id, {
                status: "INVITED",
                role: dto.role,
            });
            return;
        }
        const member = new study_group_entity_1.StudyGroupMember({
            id: (0, uuid_1.v4)(),
            groupId,
            userId: dto.user_id,
            role: dto.role,
            status: "INVITED",
        });
        await this.repository.addMember(member);
    }
};
exports.InviteGroupMemberUseCase = InviteGroupMemberUseCase;
exports.InviteGroupMemberUseCase = InviteGroupMemberUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(study_groups_repository_interface_1.IStudyGroupsRepository)),
    __metadata("design:paramtypes", [Object])
], InviteGroupMemberUseCase);
//# sourceMappingURL=invite-group-member.use-case.js.map