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
exports.ManageGroupContentUseCase = void 0;
const common_1 = require("@nestjs/common");
const study_groups_repository_interface_1 = require("../../domain/study-groups.repository.interface");
let ManageGroupContentUseCase = class ManageGroupContentUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async addContent(groupId, userId, contentId) {
        const member = await this.repository.findMember(groupId, userId);
        if (!member || member.status !== "ACTIVE") {
            throw new common_1.ForbiddenException("Access denied: not an active member");
        }
        const isShared = await this.repository.isContentShared(groupId, contentId);
        if (isShared) {
            throw new common_1.BadRequestException("Content already in playlist");
        }
        await this.repository.addContentShare(groupId, contentId, userId);
    }
    async removeContent(groupId, userId, contentId) {
        const member = await this.repository.findMember(groupId, userId);
        if (!member || member.status !== "ACTIVE" || !["OWNER", "MOD"].includes(member.role)) {
            throw new common_1.ForbiddenException("Access denied: requires role OWNER or MOD");
        }
        await this.repository.removeContentShare(groupId, contentId);
    }
};
exports.ManageGroupContentUseCase = ManageGroupContentUseCase;
exports.ManageGroupContentUseCase = ManageGroupContentUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(study_groups_repository_interface_1.IStudyGroupsRepository)),
    __metadata("design:paramtypes", [Object])
], ManageGroupContentUseCase);
//# sourceMappingURL=manage-group-content.use-case.js.map