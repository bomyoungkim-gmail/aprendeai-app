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
exports.AnnotationSearchController = exports.AnnotationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const annotation_service_1 = require("./annotation.service");
const annotation_export_service_1 = require("./annotation-export.service");
const annotation_dto_1 = require("./dto/annotation.dto");
const search_annotations_dto_1 = require("./dto/search-annotations.dto");
const create_reply_dto_1 = require("./dto/create-reply.dto");
const sharing_service_1 = require("../sharing/sharing.service");
const sharing_dto_1 = require("../sharing/dto/sharing.dto");
let AnnotationController = class AnnotationController {
    constructor(annotationService) {
        this.annotationService = annotationService;
    }
    create(contentId, dto, req) {
        return this.annotationService.create(contentId, req.user.id, dto);
    }
    getAll(contentId, groupId, req) {
        return this.annotationService.getByContent(contentId, req.user.id, groupId);
    }
    update(id, dto, req) {
        return this.annotationService.update(id, req.user.id, dto);
    }
    delete(id, req) {
        return this.annotationService.delete(id, req.user.id);
    }
};
exports.AnnotationController = AnnotationController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)("contentId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, annotation_dto_1.CreateAnnotationDto, Object]),
    __metadata("design:returntype", void 0)
], AnnotationController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)("contentId")),
    __param(1, (0, common_1.Query)("groupId")),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], AnnotationController.prototype, "getAll", null);
__decorate([
    (0, common_1.Put)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, annotation_dto_1.UpdateAnnotationDto, Object]),
    __metadata("design:returntype", void 0)
], AnnotationController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AnnotationController.prototype, "delete", null);
exports.AnnotationController = AnnotationController = __decorate([
    (0, common_1.Controller)("contents/:contentId/annotations"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __metadata("design:paramtypes", [annotation_service_1.AnnotationService])
], AnnotationController);
let AnnotationSearchController = class AnnotationSearchController {
    constructor(annotationService, exportService, sharingService) {
        this.annotationService = annotationService;
        this.exportService = exportService;
        this.sharingService = sharingService;
    }
    search(params, req) {
        return this.annotationService.searchAnnotations(req.user.id, params);
    }
    createReply(annotationId, dto, req) {
        return this.annotationService.createReply(annotationId, req.user.id, dto);
    }
    toggleFavorite(id, req) {
        return this.annotationService.toggleFavorite(id, req.user.id);
    }
    async exportAnnotations(format = "pdf", req, res) {
        const userId = req.user.id;
        if (format === "pdf") {
            const pdf = await this.exportService.exportToPDF(userId);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", "attachment; filename=annotations.pdf");
            return res.send(pdf);
        }
        else {
            const markdown = await this.exportService.exportToMarkdown(userId);
            res.setHeader("Content-Type", "text/markdown");
            res.setHeader("Content-Disposition", "attachment; filename=annotations.md");
            return res.send(markdown);
        }
    }
    async share(annotationId, dto, req) {
        return this.sharingService.shareAnnotation(req.user.id, annotationId, dto);
    }
    async revokeShare(annotationId, contextType, contextId, req) {
        return this.sharingService.revokeAnnotationShare(req.user.id, annotationId, contextType, contextId);
    }
};
exports.AnnotationSearchController = AnnotationSearchController;
__decorate([
    (0, common_1.Get)("search"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_annotations_dto_1.SearchAnnotationsDto, Object]),
    __metadata("design:returntype", void 0)
], AnnotationSearchController.prototype, "search", null);
__decorate([
    (0, common_1.Post)(":id/reply"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_reply_dto_1.CreateReplyDto, Object]),
    __metadata("design:returntype", void 0)
], AnnotationSearchController.prototype, "createReply", null);
__decorate([
    (0, common_1.Patch)(":id/favorite"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AnnotationSearchController.prototype, "toggleFavorite", null);
__decorate([
    (0, common_1.Get)("export"),
    __param(0, (0, common_1.Query)("format")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AnnotationSearchController.prototype, "exportAnnotations", null);
__decorate([
    (0, common_1.Post)(":id/shares"),
    (0, swagger_1.ApiOperation)({ summary: "Share annotation with context" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sharing_dto_1.ShareAnnotationRequest, Object]),
    __metadata("design:returntype", Promise)
], AnnotationSearchController.prototype, "share", null);
__decorate([
    (0, common_1.Delete)(":id/shares"),
    (0, swagger_1.ApiOperation)({ summary: "Revoke annotation share" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Query)("contextType")),
    __param(2, (0, common_1.Query)("contextId")),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AnnotationSearchController.prototype, "revokeShare", null);
exports.AnnotationSearchController = AnnotationSearchController = __decorate([
    (0, common_1.Controller)("annotations"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __metadata("design:paramtypes", [annotation_service_1.AnnotationService,
        annotation_export_service_1.AnnotationExportService,
        sharing_service_1.SharingService])
], AnnotationSearchController);
//# sourceMappingURL=annotation.controller.js.map