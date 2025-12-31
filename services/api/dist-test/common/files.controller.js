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
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const storage_service_1 = require("../cornell/services/storage.service");
const content_access_service_1 = require("../cornell/services/content-access.service");
let FilesController = class FilesController {
    constructor(storageService, contentAccessService) {
        this.storageService = storageService;
        this.contentAccessService = contentAccessService;
    }
    async viewFile(id, res, req) {
        const canAccess = await this.contentAccessService.canAccessFile(id, req.user.id);
        if (!canAccess) {
            throw new common_1.ForbiddenException("Access denied. This file may be private or shared within a specific group.");
        }
        await this.storageService.streamFile(id, res);
    }
    async getViewUrl(id, req) {
        const canAccess = await this.contentAccessService.canAccessFile(id, req.user.id);
        if (!canAccess) {
            throw new common_1.ForbiddenException("Access denied");
        }
        return this.storageService.getFileViewUrl(id);
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Get)(":id/view"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "viewFile", null);
__decorate([
    (0, common_1.Get)(":id/view-url"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getViewUrl", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)("files"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __metadata("design:paramtypes", [storage_service_1.StorageService,
        content_access_service_1.ContentAccessService])
], FilesController);
//# sourceMappingURL=files.controller.js.map