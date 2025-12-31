"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamificationModule = void 0;
const common_1 = require("@nestjs/common");
const gamification_controller_1 = require("./gamification.controller");
const gamification_service_1 = require("./gamification.service");
const prisma_gamification_repository_1 = require("./infrastructure/repositories/prisma-gamification.repository");
const gamification_repository_interface_1 = require("./domain/gamification.repository.interface");
const record_game_result_use_case_1 = require("./application/use-cases/record-game-result.use-case");
const prisma_module_1 = require("../prisma/prisma.module");
let GamificationModule = class GamificationModule {
};
exports.GamificationModule = GamificationModule;
exports.GamificationModule = GamificationModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [gamification_controller_1.GamificationController],
        providers: [
            gamification_service_1.GamificationService,
            record_game_result_use_case_1.RecordGameResultUseCase,
            {
                provide: gamification_repository_interface_1.IGamificationRepository,
                useClass: prisma_gamification_repository_1.PrismaGamificationRepository,
            },
        ],
        exports: [gamification_service_1.GamificationService, record_game_result_use_case_1.RecordGameResultUseCase],
    })
], GamificationModule);
//# sourceMappingURL=gamification.module.js.map