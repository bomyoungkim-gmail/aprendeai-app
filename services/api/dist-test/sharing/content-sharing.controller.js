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
exports.ContentSharingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/infrastructure/jwt-auth.guard");
const sharing_service_1 = require("./sharing.service");
const sharing_dto_1 = require("./dto/sharing.dto");
let ContentSharingController = class ContentSharingController {
    constructor(sharingService) {
        this.sharingService = sharingService;
    }
    async share(contentId, dto, req) {
        return this.sharingService.shareContent(req.user.id, contentId, dto);
    }
    async revoke(contentId, contextType, contextId, req) {
        return this.sharingService.revokeContentShare(req.user.id, contentId, contextType, contextId);
    }
};
exports.ContentSharingController = ContentSharingController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: "Share content with a context (Classroom, Family, Group)",
    }),
    __param(0, (0, common_1.Param)("contentId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sharing_dto_1.ShareContentRequest, Object]),
    __metadata("design:returntype", Promise)
], ContentSharingController.prototype, "share", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiOperation)({ summary: "Revoke share" }),
    __param(0, (0, common_1.Param)("contentId")),
    __param(1, (0, common_1.Query)("contextType")),
    __param(2, (0, common_1.Query)("contextId")),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ContentSharingController.prototype, "revoke", null);
exports.ContentSharingController = ContentSharingController = __decorate([
    (0, swagger_1.ApiTags)("Sharing"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("contents/:contentId/shares"),
    __metadata("design:paramtypes", [sharing_service_1.SharingService])
], ContentSharingController);
//# sourceMappingURL=content-sharing.controller.js.map