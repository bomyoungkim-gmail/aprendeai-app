"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionsModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const prisma_module_1 = require("../prisma/prisma.module");
const profile_module_1 = require("../profiles/profile.module");
const gamification_module_1 = require("../gamification/gamification.module");
const vocab_module_1 = require("../vocab/vocab.module");
const outcomes_module_1 = require("../outcomes/outcomes.module");
const gating_module_1 = require("../gating/gating.module");
const reading_sessions_service_1 = require("./reading-sessions.service");
const reading_sessions_controller_1 = require("./reading-sessions.controller");
const prisma_sessions_repository_1 = require("./infrastructure/repositories/prisma-sessions.repository");
const sessions_repository_interface_1 = require("./domain/sessions.repository.interface");
const start_session_use_case_1 = require("./application/use-cases/start-session.use-case");
const get_session_use_case_1 = require("./application/use-cases/get-session.use-case");
const update_pre_phase_use_case_1 = require("./application/use-cases/update-pre-phase.use-case");
const advance_phase_use_case_1 = require("./application/use-cases/advance-phase.use-case");
const record_event_use_case_1 = require("./application/use-cases/record-event.use-case");
const quick_command_parser_1 = require("./parsers/quick-command.parser");
const ai_service_client_1 = require("../ai-service/ai-service.client");
const vocab_capture_listener_1 = require("./listeners/vocab-capture.listener");
const activity_module_1 = require("../activity/activity.module");
const cornell_module_1 = require("../cornell/cornell.module");
let SessionsModule = class SessionsModule {
};
exports.SessionsModule = SessionsModule;
exports.SessionsModule = SessionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            prisma_module_1.PrismaModule,
            profile_module_1.ProfileModule,
            gamification_module_1.GamificationModule,
            vocab_module_1.VocabModule,
            (0, common_1.forwardRef)(() => outcomes_module_1.OutcomesModule),
            gating_module_1.GatingModule,
            activity_module_1.ActivityModule,
            cornell_module_1.CornellModule,
        ],
        controllers: [reading_sessions_controller_1.ReadingSessionsController],
        providers: [
            reading_sessions_service_1.ReadingSessionsService,
            quick_command_parser_1.QuickCommandParser,
            ai_service_client_1.AiServiceClient,
            vocab_capture_listener_1.VocabCaptureListener,
            {
                provide: sessions_repository_interface_1.ISessionsRepository,
                useClass: prisma_sessions_repository_1.PrismaSessionsRepository,
            },
            start_session_use_case_1.StartSessionUseCase,
            get_session_use_case_1.GetSessionUseCase,
            update_pre_phase_use_case_1.UpdatePrePhaseUseCase,
            advance_phase_use_case_1.AdvancePhaseUseCase,
            record_event_use_case_1.RecordEventUseCase,
        ],
        exports: [reading_sessions_service_1.ReadingSessionsService, sessions_repository_interface_1.ISessionsRepository],
    })
], SessionsModule);
//# sourceMappingURL=sessions.module.js.map