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
exports.GetTaskQueueUseCase = void 0;
const common_1 = require("@nestjs/common");
const ops_repository_interface_1 = require("../../domain/interfaces/ops.repository.interface");
const ops_task_entity_1 = require("../../domain/entities/ops-task.entity");
let GetTaskQueueUseCase = class GetTaskQueueUseCase {
    constructor(opsRepo) {
        this.opsRepo = opsRepo;
    }
    async execute(userId) {
        var _a;
        const tasks = [];
        const dueReviews = 0;
        if (dueReviews > 0) {
            tasks.push(new ops_task_entity_1.OpsTask('review-vocab', 'Review Vocabulary', `${dueReviews} cards waiting`, Math.min(dueReviews * 2, 30), 'REVIEW', '/dashboard/review', 'HIGH'));
        }
        const policy = await this.opsRepo.getUserPolicy(userId);
        const todayIndex = new Date().getDay();
        const isCoReadingDay = (_a = policy === null || policy === void 0 ? void 0 : policy.co_reading_days) === null || _a === void 0 ? void 0 : _a.includes(todayIndex);
        if (isCoReadingDay) {
            tasks.push(new ops_task_entity_1.OpsTask('co-reading', 'Co-Reading Session', 'Scheduled with your educator', 20, 'CO_READING', '/dashboard/co-reading', 'HIGH'));
        }
        if (tasks.length === 0) {
            tasks.push(new ops_task_entity_1.OpsTask('continue-learning', 'Continue Learning', 'Pick up where you left off', 15, 'LESSON', '/dashboard/library', 'MEDIUM'));
        }
        return tasks.slice(0, 3);
    }
};
exports.GetTaskQueueUseCase = GetTaskQueueUseCase;
exports.GetTaskQueueUseCase = GetTaskQueueUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(ops_repository_interface_1.IOpsRepository)),
    __metadata("design:paramtypes", [Object])
], GetTaskQueueUseCase);
//# sourceMappingURL=get-task-queue.use-case.js.map