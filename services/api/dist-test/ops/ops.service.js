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
exports.OpsService = void 0;
const common_1 = require("@nestjs/common");
const ops_coach_service_1 = require("../family/services/ops-coach.service");
const get_daily_snapshot_use_case_1 = require("./application/use-cases/get-daily-snapshot.use-case");
const get_task_queue_use_case_1 = require("./application/use-cases/get-task-queue.use-case");
const get_context_cards_use_case_1 = require("./application/use-cases/get-context-cards.use-case");
const log_study_time_use_case_1 = require("./application/use-cases/log-study-time.use-case");
let OpsService = class OpsService {
    constructor(getDailySnapshotUseCase, getTaskQueueUseCase, getContextCardsUseCase, logStudyTimeUseCase, opsCoach) {
        this.getDailySnapshotUseCase = getDailySnapshotUseCase;
        this.getTaskQueueUseCase = getTaskQueueUseCase;
        this.getContextCardsUseCase = getContextCardsUseCase;
        this.logStudyTimeUseCase = logStudyTimeUseCase;
        this.opsCoach = opsCoach;
    }
    async getDailySnapshot(userId) {
        return this.getDailySnapshotUseCase.execute(userId);
    }
    async getWhatsNext(userId) {
        return this.getTaskQueueUseCase.execute(userId);
    }
    async getContextCards(userId) {
        return this.getContextCardsUseCase.execute(userId);
    }
    async logTime(userId, dto) {
        return this.logStudyTimeUseCase.execute(userId, dto.minutes);
    }
    async getBootPrompt(userId) {
        return this.opsCoach.getDailyBootLearner();
    }
    async getClosePrompt(userId) {
        return this.opsCoach.getDailyCloseLearner();
    }
};
exports.OpsService = OpsService;
exports.OpsService = OpsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [get_daily_snapshot_use_case_1.GetDailySnapshotUseCase,
        get_task_queue_use_case_1.GetTaskQueueUseCase,
        get_context_cards_use_case_1.GetContextCardsUseCase,
        log_study_time_use_case_1.LogStudyTimeUseCase,
        ops_coach_service_1.OpsCoachService])
], OpsService);
//# sourceMappingURL=ops.service.js.map