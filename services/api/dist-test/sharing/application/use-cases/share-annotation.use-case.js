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
exports.ShareAnnotationUseCase = void 0;
const common_1 = require("@nestjs/common");
const sharing_repository_interface_1 = require("../../domain/interfaces/sharing.repository.interface");
const annotation_share_entity_1 = require("../../domain/entities/annotation-share.entity");
let ShareAnnotationUseCase = class ShareAnnotationUseCase {
    constructor(sharingRepo) {
        this.sharingRepo = sharingRepo;
    }
    async execute(userId, annotationId, dto) {
        const share = new annotation_share_entity_1.AnnotationShare(annotationId, dto.contextType, dto.contextId, dto.mode, userId, new Date());
        return this.sharingRepo.upsertAnnotationShare(share);
    }
};
exports.ShareAnnotationUseCase = ShareAnnotationUseCase;
exports.ShareAnnotationUseCase = ShareAnnotationUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(sharing_repository_interface_1.ISharingRepository)),
    __metadata("design:paramtypes", [Object])
], ShareAnnotationUseCase);
//# sourceMappingURL=share-annotation.use-case.js.map