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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharingService = void 0;
const common_1 = require("@nestjs/common");
const share_content_use_case_1 = require("./application/use-cases/share-content.use-case");
const revoke_content_share_use_case_1 = require("./application/use-cases/revoke-content-share.use-case");
const share_annotation_use_case_1 = require("./application/use-cases/share-annotation.use-case");
const revoke_annotation_share_use_case_1 = require("./application/use-cases/revoke-annotation-share.use-case");
let SharingService = class SharingService {
    constructor(shareContentUseCase, revokeContentUseCase, shareAnnotationUseCase, revokeAnnotationUseCase) {
        this.shareContentUseCase = shareContentUseCase;
        this.revokeContentUseCase = revokeContentUseCase;
        this.shareAnnotationUseCase = shareAnnotationUseCase;
        this.revokeAnnotationUseCase = revokeAnnotationUseCase;
    }
    async shareContent(userId, contentId, dto) {
        return this.shareContentUseCase.execute(userId, contentId, {
            contextType: dto.contextType,
            contextId: dto.contextId,
            permission: dto.permission,
        });
    }
    async revokeContentShare(userId, contentId, contextType, contextId) {
        return this.revokeContentUseCase.execute(contentId, contextType, contextId);
    }
    async shareAnnotation(userId, annotationId, dto) {
        return this.shareAnnotationUseCase.execute(userId, annotationId, {
            contextType: dto.contextType,
            contextId: dto.contextId,
            mode: dto.mode,
        });
    }
    async revokeAnnotationShare(userId, annotationId, contextType, contextId) {
        return this.revokeAnnotationUseCase.execute(annotationId, contextType, contextId);
    }
};
exports.SharingService = SharingService;
exports.SharingService = SharingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [share_content_use_case_1.ShareContentUseCase,
        revoke_content_share_use_case_1.RevokeContentShareUseCase,
        share_annotation_use_case_1.ShareAnnotationUseCase,
        revoke_annotation_share_use_case_1.RevokeAnnotationShareUseCase])
], SharingService);
//# sourceMappingURL=sharing.service.js.map