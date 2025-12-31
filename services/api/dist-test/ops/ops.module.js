"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpsModule = void 0;
const common_1 = require("@nestjs/common");
const ops_controller_1 = require("./ops.controller");
const ops_service_1 = require("./ops.service");
const prisma_module_1 = require("../prisma/prisma.module");
const family_module_1 = require("../family/family.module");
const prisma_ops_repository_1 = require("./infrastructure/repositories/prisma-ops.repository");
const get_daily_snapshot_use_case_1 = require("./application/use-cases/get-daily-snapshot.use-case");
const get_task_queue_use_case_1 = require("./application/use-cases/get-task-queue.use-case");
const get_context_cards_use_case_1 = require("./application/use-cases/get-context-cards.use-case");
const log_study_time_use_case_1 = require("./application/use-cases/log-study-time.use-case");
const ops_repository_interface_1 = require("./domain/interfaces/ops.repository.interface");
let OpsModule = class OpsModule {
};
exports.OpsModule = OpsModule;
exports.OpsModule = OpsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, family_module_1.FamilyModule],
        controllers: [ops_controller_1.OpsController],
        providers: [
            ops_service_1.OpsService,
            { provide: ops_repository_interface_1.IOpsRepository, useClass: prisma_ops_repository_1.PrismaOpsRepository },
            get_daily_snapshot_use_case_1.GetDailySnapshotUseCase,
            get_task_queue_use_case_1.GetTaskQueueUseCase,
            get_context_cards_use_case_1.GetContextCardsUseCase,
            log_study_time_use_case_1.LogStudyTimeUseCase,
        ],
        exports: [ops_service_1.OpsService, ops_repository_interface_1.IOpsRepository],
    })
], OpsModule);
//# sourceMappingURL=ops.module.js.map