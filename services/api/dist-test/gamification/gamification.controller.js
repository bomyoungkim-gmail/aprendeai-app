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
exports.GamificationController = void 0;
const common_1 = require("@nestjs/common");
const gamification_service_1 = require("./gamification.service");
const passport_1 = require("@nestjs/passport");
const gamification_dto_1 = require("./dto/gamification.dto");
let GamificationController = class GamificationController {
    constructor(gamificationService) {
        this.gamificationService = gamificationService;
    }
    getDashboard(req) {
        return this.gamificationService.getDashboard(req.user.id);
    }
    getGoalAchievements(req) {
        return this.gamificationService.getGoalAchievements(req.user.id);
    }
    setGoal(req, dto) {
        return this.gamificationService.setDailyGoal(req.user.id, dto);
    }
    registerActivity(req, dto) {
        return this.gamificationService.registerActivity(req.user.id, dto);
    }
};
exports.GamificationController = GamificationController;
__decorate([
    (0, common_1.Get)("dashboard"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GamificationController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)("goal-achievements"),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GamificationController.prototype, "getGoalAchievements", null);
__decorate([
    (0, common_1.Post)("goal"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, gamification_dto_1.SetDailyGoalDto]),
    __metadata("design:returntype", void 0)
], GamificationController.prototype, "setGoal", null);
__decorate([
    (0, common_1.Post)("activity"),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, gamification_dto_1.ActivityProgressDto]),
    __metadata("design:returntype", void 0)
], GamificationController.prototype, "registerActivity", null);
exports.GamificationController = GamificationController = __decorate([
    (0, common_1.Controller)("gamification"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __metadata("design:paramtypes", [gamification_service_1.GamificationService])
], GamificationController);
//# sourceMappingURL=gamification.controller.js.map