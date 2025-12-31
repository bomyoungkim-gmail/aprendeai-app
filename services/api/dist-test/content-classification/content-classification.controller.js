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
exports.ContentClassificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const content_classification_service_1 = require("./content-classification.service");
const jwt_auth_guard_1 = require("../auth/infrastructure/jwt-auth.guard");
const roles_guard_1 = require("../admin/guards/roles.guard");
const roles_decorator_1 = require("../admin/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let ContentClassificationController = class ContentClassificationController {
    constructor(classificationService) {
        this.classificationService = classificationService;
    }
    async classifyContent(dto) {
        return this.classificationService.classifyContent(dto);
    }
    async suggestClassification(contentId, dto) {
        return this.classificationService.suggestClassification(contentId, dto.title, dto.description);
    }
    async filterContent(dto) {
        return this.classificationService.filterContentByAge(dto.items, dto.familyAgeRange);
    }
};
exports.ContentClassificationController = ContentClassificationController;
__decorate([
    (0, common_1.Post)("classify"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN, client_1.ContextRole.TEACHER),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "AI-classify content for age appropriateness" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentClassificationController.prototype, "classifyContent", null);
__decorate([
    (0, common_1.Post)("suggest/:contentId"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.ContextRole.INSTITUTION_EDUCATION_ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get AI classification suggestion for content" }),
    __param(0, (0, common_1.Param)("contentId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContentClassificationController.prototype, "suggestClassification", null);
__decorate([
    (0, common_1.Post)("filter"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Filter content by family age settings" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ContentClassificationController.prototype, "filterContent", null);
exports.ContentClassificationController = ContentClassificationController = __decorate([
    (0, swagger_1.ApiTags)("content-classification"),
    (0, common_1.Controller)("content-classification"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [content_classification_service_1.ContentClassificationService])
], ContentClassificationController);
//# sourceMappingURL=content-classification.controller.js.map