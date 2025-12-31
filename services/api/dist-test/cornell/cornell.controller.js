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
exports.HighlightsController = exports.CornellController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const passport_1 = require("@nestjs/passport");
const cornell_service_1 = require("./cornell.service");
const storage_service_1 = require("./services/storage.service");
const content_service_1 = require("./services/content.service");
const queue_service_1 = require("../queue/queue.service");
const cornell_dto_1 = require("./dto/cornell.dto");
const upload_content_dto_1 = require("./dto/upload-content.dto");
const notifications_gateway_1 = require("../notifications/notifications.gateway");
const create_content_use_case_1 = require("./application/use-cases/create-content.use-case");
const constants_1 = require("../config/constants");
let CornellController = class CornellController {
    constructor(cornellService, storageService, contentService, queueService, notificationsGateway, createContentUseCase) {
        this.cornellService = cornellService;
        this.storageService = storageService;
        this.contentService = contentService;
        this.queueService = queueService;
        this.notificationsGateway = notificationsGateway;
        this.createContentUseCase = createContentUseCase;
    }
    async createContent(dto, req) {
        return this.contentService.createManualContent(req.user.id, dto);
    }
    async updateContent(id, dto, req) {
        return this.contentService.updateContent(id, req.user.id, dto);
    }
    async getMyContents(req) {
        return this.cornellService.getMyContents(req.user.id);
    }
    async getContent(id, req) {
        return this.cornellService.getContent(id, req.user.id);
    }
    async deleteContent(id, req) {
        return this.cornellService.deleteContent(id, req.user.id);
    }
    async bulkDeleteContents(body, req) {
        return this.cornellService.bulkDeleteContents(body.contentIds, req.user.id);
    }
    async uploadContent(file, dto, req) {
        if (!file) {
            throw new common_1.BadRequestException("File is required");
        }
        return this.createContentUseCase.execute(file, dto, req.user.id);
    }
    async triggerSimplify(id, body) {
        try {
            const payload = {
                action: "SIMPLIFY",
                contentId: id,
                text: body.text,
                level: body.level || constants_1.DEFAULTS.SCHOOL_LEVEL.ELEMENTARY_5,
                targetLang: body.lang || constants_1.DEFAULTS.LANGUAGE.PT_BR,
            };
            await this.queueService.publish(constants_1.QUEUES.CONTENT_PROCESS, payload);
            return { message: "Simplification task queued" };
        }
        catch (err) {
            console.error(err);
            throw new common_1.HttpException("Failed to queue task", common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async triggerAssessment(id, body) {
        try {
            const payload = {
                action: "ASSESSMENT",
                contentId: id,
                text: body.text,
                level: body.level || constants_1.DEFAULTS.SCHOOL_LEVEL.HIGH_SCHOOL_1,
            };
            await this.queueService.publish(constants_1.QUEUES.CONTENT_PROCESS, payload);
            return { message: "Assessment task queued" };
        }
        catch (err) {
            console.error(err);
            throw new common_1.HttpException("Failed to queue task", common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getHighlights(id, req) {
        return this.cornellService.getHighlights(id, req.user.id);
    }
    async createHighlight(id, dto, req) {
        return this.cornellService.createHighlight(id, dto, req.user.id);
    }
    async getCornellNotes(id, req) {
        return this.cornellService.getOrCreateCornellNotes(id, req.user.id);
    }
    async updateCornellNotes(id, dto, req) {
        return this.cornellService.updateCornellNotes(id, dto, req.user.id);
    }
    async handleJobComplete(contentId, body) {
        if (body.success) {
            this.notificationsGateway.emitContentUpdate(contentId, body.type);
        }
        return { message: "Notification sent" };
    }
};
exports.CornellController = CornellController;
__decorate([
    (0, common_1.Post)("create_manual"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [cornell_dto_1.CreateContentDto, Object]),
    __metadata("design:returntype", Promise)
], CornellController.prototype, "createContent", null);
__decorate([
    (0, common_1.Patch)(":id/update"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cornell_dto_1.UpdateContentDto, Object]),
    __metadata("design:returntype", Promise)
], CornellController.prototype, "updateContent", null);
__decorate([
    (0, common_1.Get)("my-contents"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CornellController.prototype, "getMyContents", null);
__decorate([
    (0, common_1.Get)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CornellController.prototype, "getContent", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CornellController.prototype, "deleteContent", null);
__decorate([
    (0, common_1.Post)("bulk-delete"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CornellController.prototype, "bulkDeleteContents", null);
__decorate([
    (0, common_1.Post)("upload"),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)("file", {
        limits: { fileSize: constants_1.UPLOAD_LIMITS.CONTENT_FILE_SIZE },
        fileFilter: (req, file, cb) => {
            const allowed = [
                "application/pdf",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "text/plain",
            ];
            if (allowed.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException("Only PDF, DOCX, and TXT files are allowed"), false);
            }
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, upload_content_dto_1.UploadContentDto, Object]),
    __metadata("design:returntype", Promise)
], CornellController.prototype, "uploadContent", null);
__decorate([
    (0, common_1.Post)(":id/simplify"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CornellController.prototype, "triggerSimplify", null);
__decorate([
    (0, common_1.Post)(":id/assessment"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CornellController.prototype, "triggerAssessment", null);
__decorate([
    (0, common_1.Get)(":id/highlights"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CornellController.prototype, "getHighlights", null);
__decorate([
    (0, common_1.Post)(":id/highlights"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cornell_dto_1.CreateHighlightDto, Object]),
    __metadata("design:returntype", Promise)
], CornellController.prototype, "createHighlight", null);
__decorate([
    (0, common_1.Get)(":id/cornell"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CornellController.prototype, "getCornellNotes", null);
__decorate([
    (0, common_1.Put)(":id/cornell"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cornell_dto_1.UpdateCornellDto, Object]),
    __metadata("design:returntype", Promise)
], CornellController.prototype, "updateCornellNotes", null);
__decorate([
    (0, common_1.Post)("jobs/:contentId/complete"),
    (0, common_1.SetMetadata)("isPublic", true),
    __param(0, (0, common_1.Param)("contentId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CornellController.prototype, "handleJobComplete", null);
exports.CornellController = CornellController = __decorate([
    (0, common_1.Controller)("contents"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __metadata("design:paramtypes", [cornell_service_1.CornellService,
        storage_service_1.StorageService,
        content_service_1.ContentService,
        queue_service_1.QueueService,
        notifications_gateway_1.NotificationsGateway,
        create_content_use_case_1.CreateContentUseCase])
], CornellController);
let HighlightsController = class HighlightsController {
    constructor(cornellService) {
        this.cornellService = cornellService;
    }
    async updateHighlight(id, dto, req) {
        return this.cornellService.updateHighlight(id, dto, req.user.id);
    }
    async deleteHighlight(id, req) {
        return this.cornellService.deleteHighlight(id, req.user.id);
    }
};
exports.HighlightsController = HighlightsController;
__decorate([
    (0, common_1.Put)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, cornell_dto_1.UpdateHighlightDto, Object]),
    __metadata("design:returntype", Promise)
], HighlightsController.prototype, "updateHighlight", null);
__decorate([
    (0, common_1.Delete)(":id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], HighlightsController.prototype, "deleteHighlight", null);
exports.HighlightsController = HighlightsController = __decorate([
    (0, common_1.Controller)("highlights"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __metadata("design:paramtypes", [cornell_service_1.CornellService])
], HighlightsController);
//# sourceMappingURL=cornell.controller.js.map