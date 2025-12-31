"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityModule = void 0;
const common_1 = require("@nestjs/common");
const activity_service_1 = require("./activity.service");
const activity_controller_1 = require("./activity.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const prisma_activity_repository_1 = require("./infrastructure/repositories/prisma-activity.repository");
const track_activity_use_case_1 = require("./application/use-cases/track-activity.use-case");
const get_activity_stats_use_case_1 = require("./application/use-cases/get-activity-stats.use-case");
const activity_repository_interface_1 = require("./domain/interfaces/activity.repository.interface");
let ActivityModule = class ActivityModule {
};
exports.ActivityModule = ActivityModule;
exports.ActivityModule = ActivityModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [activity_controller_1.ActivityController],
        providers: [
            activity_service_1.ActivityService,
            track_activity_use_case_1.TrackActivityUseCase,
            get_activity_stats_use_case_1.GetActivityStatsUseCase,
            { provide: activity_repository_interface_1.IActivityRepository, useClass: prisma_activity_repository_1.PrismaActivityRepository },
        ],
        exports: [activity_service_1.ActivityService, activity_repository_interface_1.IActivityRepository],
    })
], ActivityModule);
//# sourceMappingURL=activity.module.js.map