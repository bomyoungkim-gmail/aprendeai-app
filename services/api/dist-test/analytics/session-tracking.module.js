"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionTrackingModule = void 0;
const common_1 = require("@nestjs/common");
const session_tracking_service_1 = require("./session-tracking.service");
const prisma_module_1 = require("../prisma/prisma.module");
const analytics_repository_interface_1 = require("./domain/analytics.repository.interface");
const prisma_analytics_repository_1 = require("./infrastructure/repositories/prisma-analytics.repository");
const track_study_session_use_case_1 = require("./application/use-cases/track-study-session.use-case");
let SessionTrackingModule = class SessionTrackingModule {
};
exports.SessionTrackingModule = SessionTrackingModule;
exports.SessionTrackingModule = SessionTrackingModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        providers: [
            session_tracking_service_1.SessionTrackingService,
            track_study_session_use_case_1.TrackStudySessionUseCase,
            {
                provide: analytics_repository_interface_1.IAnalyticsRepository,
                useClass: prisma_analytics_repository_1.PrismaAnalyticsRepository,
            },
        ],
        exports: [session_tracking_service_1.SessionTrackingService, track_study_session_use_case_1.TrackStudySessionUseCase, analytics_repository_interface_1.IAnalyticsRepository],
    })
], SessionTrackingModule);
//# sourceMappingURL=session-tracking.module.js.map