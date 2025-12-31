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
exports.GamesController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const games_service_1 = require("./games.service");
const game_progress_service_1 = require("./game-progress.service");
const game_leaderboard_service_1 = require("./game-leaderboard.service");
let GamesController = class GamesController {
    constructor(gamesService, gameProgressService, leaderboardService) {
        this.gamesService = gamesService;
        this.gameProgressService = gameProgressService;
        this.leaderboardService = leaderboardService;
    }
    async getGames() {
        return this.gamesService.getGamesCatalog();
    }
    async getUserProgress(req) {
        return this.gameProgressService.getUserProgress(req.user.id);
    }
    async getGameProgress(req, gameId) {
        return this.gameProgressService.getGameProgress(req.user.id, gameId);
    }
    async updateGameProgress(req, gameId, update) {
        return this.gameProgressService.updateProgress(req.user.id, gameId, update);
    }
    async getLeaderboard() {
        return this.leaderboardService.getGlobalLeaderboard(10);
    }
    async getMyRank(req) {
        return this.leaderboardService.getUserRank(req.user.id);
    }
};
exports.GamesController = GamesController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "getGames", null);
__decorate([
    (0, common_1.Get)("progress"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "getUserProgress", null);
__decorate([
    (0, common_1.Get)("progress/:gameId"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("gameId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "getGameProgress", null);
__decorate([
    (0, common_1.Post)("progress/:gameId"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("gameId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "updateGameProgress", null);
__decorate([
    (0, common_1.Get)("leaderboard"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "getLeaderboard", null);
__decorate([
    (0, common_1.Get)("leaderboard/me"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GamesController.prototype, "getMyRank", null);
exports.GamesController = GamesController = __decorate([
    (0, common_1.Controller)("games"),
    __metadata("design:paramtypes", [games_service_1.GamesService,
        game_progress_service_1.GameProgressService,
        game_leaderboard_service_1.GameLeaderboardService])
], GamesController);
//# sourceMappingURL=games.controller.js.map