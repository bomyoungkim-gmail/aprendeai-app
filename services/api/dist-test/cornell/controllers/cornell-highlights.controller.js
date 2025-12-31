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
exports.CornellHighlightsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const rxjs_1 = require("rxjs");
const jwt_auth_guard_1 = require("../../auth/infrastructure/jwt-auth.guard");
const current_user_decorator_1 = require("../../auth/presentation/decorators/current-user.decorator");
const cornell_highlights_service_1 = require("../services/cornell-highlights.service");
const create_cornell_highlight_dto_1 = require("../dto/create-cornell-highlight.dto");
let CornellHighlightsController = class CornellHighlightsController {
    constructor(highlightsService) {
        this.highlightsService = highlightsService;
    }
    async createHighlight(contentId, userId, dto) {
        return this.highlightsService.createHighlight(contentId, userId, dto);
    }
    async getHighlights(contentId, userId) {
        return this.highlightsService.getHighlights(contentId, userId);
    }
    async updateVisibility(highlightId, userId, dto) {
        return this.highlightsService.updateVisibility(highlightId, userId, dto);
    }
    async deleteHighlight(highlightId, userId) {
        await this.highlightsService.deleteHighlight(highlightId, userId);
    }
    async createComment(highlightId, userId, dto) {
        return this.highlightsService.createComment(highlightId, userId, dto);
    }
    events(contentId) {
        return this.highlightsService.subscribeToEvents(contentId);
    }
};
exports.CornellHighlightsController = CornellHighlightsController;
__decorate([
    (0, common_1.Post)("contents/:contentId/highlights"),
    (0, swagger_1.ApiOperation)({
        summary: "Create Cornell highlight",
        description: "Create a new highlight with Cornell Notes type (NOTE, QUESTION, STAR, HIGHLIGHT)",
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Highlight created successfully" }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid input data" }),
    (0, swagger_1.ApiResponse)({ status: 403, description: "Forbidden - no access to context" }),
    __param(0, (0, common_1.Param)("contentId")),
    __param(1, (0, current_user_decorator_1.CurrentUser)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_cornell_highlight_dto_1.CreateCornellHighlightDto]),
    __metadata("design:returntype", Promise)
], CornellHighlightsController.prototype, "createHighlight", null);
__decorate([
    (0, common_1.Get)("contents/:contentId/highlights"),
    (0, swagger_1.ApiOperation)({
        summary: "Get content highlights",
        description: "Get all highlights for content, filtered by user permissions",
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Highlights retrieved successfully",
    }),
    __param(0, (0, common_1.Param)("contentId")),
    __param(1, (0, current_user_decorator_1.CurrentUser)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CornellHighlightsController.prototype, "getHighlights", null);
__decorate([
    (0, common_1.Patch)("highlights/:highlightId/visibility"),
    (0, swagger_1.ApiOperation)({
        summary: "Update highlight visibility",
        description: "Change highlight visibility settings (owner only)",
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Visibility updated successfully" }),
    (0, swagger_1.ApiResponse)({ status: 403, description: "Forbidden - not the owner" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Highlight not found" }),
    __param(0, (0, common_1.Param)("highlightId")),
    __param(1, (0, current_user_decorator_1.CurrentUser)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_cornell_highlight_dto_1.UpdateHighlightVisibilityDto]),
    __metadata("design:returntype", Promise)
], CornellHighlightsController.prototype, "updateVisibility", null);
__decorate([
    (0, common_1.Delete)("highlights/:highlightId"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({
        summary: "Delete highlight",
        description: "Soft delete a highlight (owner only)",
    }),
    (0, swagger_1.ApiResponse)({ status: 204, description: "Highlight deleted successfully" }),
    (0, swagger_1.ApiResponse)({ status: 403, description: "Forbidden - not the owner" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Highlight not found" }),
    __param(0, (0, common_1.Param)("highlightId")),
    __param(1, (0, current_user_decorator_1.CurrentUser)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CornellHighlightsController.prototype, "deleteHighlight", null);
__decorate([
    (0, common_1.Post)("highlights/:highlightId/comments"),
    (0, swagger_1.ApiOperation)({
        summary: "Add comment to highlight",
        description: "Create a comment on a highlight (thread system)",
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Comment created successfully" }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: "Forbidden - cannot read highlight",
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Highlight not found" }),
    __param(0, (0, common_1.Param)("highlightId")),
    __param(1, (0, current_user_decorator_1.CurrentUser)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_cornell_highlight_dto_1.CreateAnnotationCommentDto]),
    __metadata("design:returntype", Promise)
], CornellHighlightsController.prototype, "createComment", null);
__decorate([
    (0, common_1.Sse)("events/:contentId"),
    (0, swagger_1.ApiOperation)({ summary: "Stream real-time events for content" }),
    __param(0, (0, common_1.Param)("contentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", rxjs_1.Observable)
], CornellHighlightsController.prototype, "events", null);
exports.CornellHighlightsController = CornellHighlightsController = __decorate([
    (0, swagger_1.ApiTags)("Cornell Notes - Highlights"),
    (0, common_1.Controller)("cornell"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [cornell_highlights_service_1.CornellHighlightsService])
], CornellHighlightsController);
//# sourceMappingURL=cornell-highlights.controller.js.map