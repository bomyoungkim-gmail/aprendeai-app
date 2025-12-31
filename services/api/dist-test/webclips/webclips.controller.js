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
exports.WebClipsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/infrastructure/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/presentation/decorators/current-user.decorator");
const webclips_service_1 = require("./webclips.service");
const webclip_dto_1 = require("./dto/webclip.dto");
const routes_constants_1 = require("../common/constants/routes.constants");
const extension_scope_guard_1 = require("../auth/infrastructure/extension-scope.guard");
let WebClipsController = class WebClipsController {
    constructor(webClipsService) {
        this.webClipsService = webClipsService;
    }
    async createWebClip(user, dto) {
        return this.webClipsService.createWebClip(user.id, dto);
    }
    async startSession(user, contentId, dto) {
        return this.webClipsService.startSession(user.id, contentId, dto);
    }
    async getWebClip(user, contentId) {
        return this.webClipsService.getWebClip(user.id, contentId);
    }
};
exports.WebClipsController = WebClipsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, extension_scope_guard_1.ExtensionScopeGuard),
    (0, extension_scope_guard_1.RequireExtensionScopes)("extension:webclip:create"),
    (0, swagger_1.ApiOperation)({ summary: "Create WebClip from browser extension" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, webclip_dto_1.CreateWebClipDto]),
    __metadata("design:returntype", Promise)
], WebClipsController.prototype, "createWebClip", null);
__decorate([
    (0, common_1.Post)(":contentId/sessions/start"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, extension_scope_guard_1.ExtensionScopeGuard),
    (0, extension_scope_guard_1.RequireExtensionScopes)("extension:session:start"),
    (0, swagger_1.ApiOperation)({ summary: "Start reading session for WebClip" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("contentId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, webclip_dto_1.StartWebClipSessionDto]),
    __metadata("design:returntype", Promise)
], WebClipsController.prototype, "startSession", null);
__decorate([
    (0, common_1.Get)(":contentId"),
    (0, swagger_1.ApiOperation)({ summary: "Get WebClip by ID" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("contentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], WebClipsController.prototype, "getWebClip", null);
exports.WebClipsController = WebClipsController = __decorate([
    (0, swagger_1.ApiTags)("WebClips"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(routes_constants_1.ROUTES.WEBCLIP.BASE),
    __metadata("design:paramtypes", [webclips_service_1.WebClipsService])
], WebClipsController);
//# sourceMappingURL=webclips.controller.js.map