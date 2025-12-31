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
exports.ThreadsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/infrastructure/jwt-auth.guard");
const threads_service_1 = require("./threads.service");
const sharing_dto_1 = require("./dto/sharing.dto");
let ThreadsController = class ThreadsController {
    constructor(threadsService) {
        this.threadsService = threadsService;
    }
    async getThread(query) {
        return this.threadsService.getThread(query);
    }
    async createThread(dto) {
        return this.threadsService.getThread(dto);
    }
    async addComment(threadId, dto, req) {
        return this.threadsService.createComment(threadId, req.user.id, dto);
    }
    async deleteComment(threadId, commentId, req) {
        return this.threadsService.deleteComment(commentId, req.user.id);
    }
};
exports.ThreadsController = ThreadsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get thread (lazy create) by context and target" }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sharing_dto_1.GetThreadsQuery]),
    __metadata("design:returntype", Promise)
], ThreadsController.prototype, "getThread", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Explicitly create thread" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [sharing_dto_1.GetThreadsQuery]),
    __metadata("design:returntype", Promise)
], ThreadsController.prototype, "createThread", null);
__decorate([
    (0, common_1.Post)(":id/comments"),
    (0, swagger_1.ApiOperation)({ summary: "Add comment to thread" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, sharing_dto_1.CreateCommentRequest, Object]),
    __metadata("design:returntype", Promise)
], ThreadsController.prototype, "addComment", null);
__decorate([
    (0, common_1.Delete)(":threadId/comments/:commentId"),
    (0, swagger_1.ApiOperation)({ summary: "Delete (soft) comment" }),
    __param(0, (0, common_1.Param)("threadId")),
    __param(1, (0, common_1.Param)("commentId")),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ThreadsController.prototype, "deleteComment", null);
exports.ThreadsController = ThreadsController = __decorate([
    (0, swagger_1.ApiTags)("Threads"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("threads"),
    __metadata("design:paramtypes", [threads_service_1.ThreadsService])
], ThreadsController);
//# sourceMappingURL=threads.controller.js.map