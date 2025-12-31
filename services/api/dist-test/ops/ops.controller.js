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
exports.OpsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/infrastructure/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/presentation/decorators/current-user.decorator");
const ops_service_1 = require("./ops.service");
const ops_dto_1 = require("./dto/ops.dto");
const routes_constants_1 = require("../common/constants/routes.constants");
let OpsController = class OpsController {
    constructor(opsService) {
        this.opsService = opsService;
    }
    async getDailySnapshot(user) {
        return this.opsService.getDailySnapshot(user.id);
    }
    async getWhatsNext(user) {
        return this.opsService.getWhatsNext(user.id);
    }
    async getContextCards(user) {
        return this.opsService.getContextCards(user.id);
    }
    async logTime(user, dto) {
        return this.opsService.logTime(user.id, dto);
    }
    async getBootPrompt(user) {
        return this.opsService.getBootPrompt(user.id);
    }
    async getClosePrompt(user) {
        return this.opsService.getClosePrompt(user.id);
    }
};
exports.OpsController = OpsController;
__decorate([
    (0, common_1.Get)("daily-snapshot"),
    (0, swagger_1.ApiOperation)({ summary: "Get daily operational snapshot" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OpsController.prototype, "getDailySnapshot", null);
__decorate([
    (0, common_1.Get)("what-next"),
    (0, swagger_1.ApiOperation)({ summary: "Get next prioritized tasks" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OpsController.prototype, "getWhatsNext", null);
__decorate([
    (0, common_1.Get)("context-cards"),
    (0, swagger_1.ApiOperation)({ summary: "Get context-aware action cards" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OpsController.prototype, "getContextCards", null);
__decorate([
    (0, common_1.Post)("log"),
    (0, swagger_1.ApiOperation)({ summary: "Log time spent studying" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ops_dto_1.LogTimeDto]),
    __metadata("design:returntype", Promise)
], OpsController.prototype, "logTime", null);
__decorate([
    (0, common_1.Get)("boot"),
    (0, swagger_1.ApiOperation)({ summary: "Get daily boot prompt" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OpsController.prototype, "getBootPrompt", null);
__decorate([
    (0, common_1.Get)("close"),
    (0, swagger_1.ApiOperation)({ summary: "Get daily close prompt" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OpsController.prototype, "getClosePrompt", null);
exports.OpsController = OpsController = __decorate([
    (0, swagger_1.ApiTags)("OpsCoach"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(routes_constants_1.ROUTES.OPS.BASE),
    __metadata("design:paramtypes", [ops_service_1.OpsService])
], OpsController);
//# sourceMappingURL=ops.controller.js.map