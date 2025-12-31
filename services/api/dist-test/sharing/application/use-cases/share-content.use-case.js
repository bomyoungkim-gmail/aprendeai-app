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
exports.ShareContentUseCase = void 0;
const common_1 = require("@nestjs/common");
const sharing_repository_interface_1 = require("../../domain/interfaces/sharing.repository.interface");
const content_share_entity_1 = require("../../domain/entities/content-share.entity");
const permission_evaluator_1 = require("../../../auth/domain/permission.evaluator");
let ShareContentUseCase = class ShareContentUseCase {
    constructor(sharingRepo, permissions) {
        this.sharingRepo = sharingRepo;
        this.permissions = permissions;
    }
    async execute(userId, contentId, dto) {
        if (dto.contextType === content_share_entity_1.ShareContextType.CLASSROOM && dto.permission === content_share_entity_1.SharePermission.ASSIGN) {
            const canAssign = await this.permissions.canCreateClassroom(userId);
            if (!canAssign) {
                throw new common_1.ForbiddenException('Only verified teachers can assign content in classrooms');
            }
        }
        const share = new content_share_entity_1.ContentShare(contentId, dto.contextType, dto.contextId, dto.permission, userId, new Date());
        return this.sharingRepo.upsertContentShare(share);
    }
};
exports.ShareContentUseCase = ShareContentUseCase;
exports.ShareContentUseCase = ShareContentUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(sharing_repository_interface_1.ISharingRepository)),
    __metadata("design:paramtypes", [Object, permission_evaluator_1.PermissionEvaluator])
], ShareContentUseCase);
//# sourceMappingURL=share-content.use-case.js.map