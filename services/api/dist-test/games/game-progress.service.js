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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameProgressService = void 0;
const common_1 = require("@nestjs/common");
const get_user_progress_use_case_1 = require("./application/use-cases/get-user-progress.use-case");
const get_game_progress_use_case_1 = require("./application/use-cases/get-game-progress.use-case");
const update_game_progress_use_case_1 = require("./application/use-cases/update-game-progress.use-case");
let GameProgressService = class GameProgressService {
    constructor(getUserProgressUseCase, getGameProgressUseCase, updateGameProgressUseCase) {
        this.getUserProgressUseCase = getUserProgressUseCase;
        this.getGameProgressUseCase = getGameProgressUseCase;
        this.updateGameProgressUseCase = updateGameProgressUseCase;
    }
    async getUserProgress(userId) {
        return this.getUserProgressUseCase.execute(userId);
    }
    async getGameProgress(userId, gameId) {
        return this.getGameProgressUseCase.execute(userId, gameId);
    }
    async updateProgress(userId, gameId, update) {
        return this.updateGameProgressUseCase.execute(userId, gameId, update);
    }
};
exports.GameProgressService = GameProgressService;
exports.GameProgressService = GameProgressService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [get_user_progress_use_case_1.GetUserProgressUseCase,
        get_game_progress_use_case_1.GetGameProgressUseCase,
        update_game_progress_use_case_1.UpdateGameProgressUseCase])
], GameProgressService);
//# sourceMappingURL=game-progress.service.js.map