"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamilyModule = void 0;
const common_1 = require("@nestjs/common");
const family_service_1 = require("./family.service");
const family_controller_1 = require("./family.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const billing_module_1 = require("../billing/billing.module");
const prompt_library_module_1 = require("../prompts/prompt-library.module");
const events_module_1 = require("../events/events.module");
const state_machine_module_1 = require("../state-machine/state-machine.module");
const privacy_module_1 = require("../privacy/privacy.module");
const ops_coach_service_1 = require("./services/ops-coach.service");
const family_policy_service_1 = require("./services/family-policy.service");
const co_reading_service_1 = require("./services/co-reading.service");
const teachback_service_1 = require("./services/teachback.service");
const family_dashboard_service_1 = require("./services/family-dashboard.service");
const family_repository_interface_1 = require("./domain/family.repository.interface");
const prisma_family_repository_1 = require("./infrastructure/repositories/prisma-family.repository");
const create_family_use_case_1 = require("./application/use-cases/create-family.use-case");
let FamilyModule = class FamilyModule {
};
exports.FamilyModule = FamilyModule;
exports.FamilyModule = FamilyModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            billing_module_1.BillingModule,
            prompt_library_module_1.PromptLibraryModule,
            events_module_1.EventsModule,
            state_machine_module_1.StateMachineModule,
            privacy_module_1.PrivacyModule,
        ],
        controllers: [family_controller_1.FamilyController],
        providers: [
            family_service_1.FamilyService,
            create_family_use_case_1.CreateFamilyUseCase,
            {
                provide: family_repository_interface_1.IFamilyRepository,
                useClass: prisma_family_repository_1.PrismaFamilyRepository,
            },
            ops_coach_service_1.OpsCoachService,
            family_policy_service_1.FamilyPolicyService,
            co_reading_service_1.CoReadingService,
            teachback_service_1.TeachBackService,
            family_dashboard_service_1.FamilyDashboardService,
        ],
        exports: [
            family_service_1.FamilyService,
            create_family_use_case_1.CreateFamilyUseCase,
            ops_coach_service_1.OpsCoachService,
            family_policy_service_1.FamilyPolicyService,
            co_reading_service_1.CoReadingService,
            teachback_service_1.TeachBackService,
            family_dashboard_service_1.FamilyDashboardService,
            family_repository_interface_1.IFamilyRepository,
        ],
    })
], FamilyModule);
//# sourceMappingURL=family.module.js.map