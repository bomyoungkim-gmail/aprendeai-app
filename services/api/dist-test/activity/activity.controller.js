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
exports.ActivityController = void 0;
const common_1 = require("@nestjs/common");
const activity_service_1 = require("./activity.service");
const jwt_auth_guard_1 = require("../auth/infrastructure/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/presentation/decorators/current-user.decorator");
const class_validator_1 = require("class-validator");
class TrackActivityDto {
}
__decorate([
    (0, class_validator_1.IsEnum)(["study", "annotation", "read", "session"]),
    __metadata("design:type", String)
], TrackActivityDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TrackActivityDto.prototype, "minutes", void 0);
let ActivityController = class ActivityController {
    constructor(activityService) {
        this.activityService = activityService;
    }
    async trackActivity(userId, dto) {
        await this.activityService.trackActivity(userId, dto.type, dto.minutes);
        return { success: true };
    }
    async getHeatmap(userId, days) {
        const daysNum = days ? parseInt(days, 10) : 365;
        return this.activityService.getActivityHeatmap(userId, daysNum);
    }
    async getStats(userId) {
        return this.activityService.getActivityStats(userId);
    }
};
exports.ActivityController = ActivityController;
__decorate([
    (0, common_1.Post)("track"),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, TrackActivityDto]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "trackActivity", null);
__decorate([
    (0, common_1.Get)("heatmap"),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __param(1, (0, common_1.Query)("days")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "getHeatmap", null);
__decorate([
    (0, common_1.Get)("stats"),
    __param(0, (0, current_user_decorator_1.CurrentUser)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ActivityController.prototype, "getStats", null);
exports.ActivityController = ActivityController = __decorate([
    (0, common_1.Controller)("activity"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [activity_service_1.ActivityService])
], ActivityController);
//# sourceMappingURL=activity.controller.js.map