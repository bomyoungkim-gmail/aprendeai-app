"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutcomesModule = void 0;
const common_1 = require("@nestjs/common");
const outcomes_service_1 = require("./outcomes.service");
const prisma_module_1 = require("../prisma/prisma.module");
const outcomes_repository_interface_1 = require("./domain/outcomes.repository.interface");
const prisma_outcomes_repository_1 = require("./infrastructure/repositories/prisma-outcomes.repository");
const compute_session_outcomes_use_case_1 = require("./application/use-cases/compute-session-outcomes.use-case");
const sessions_module_1 = require("../sessions/sessions.module");
const cornell_module_1 = require("../cornell/cornell.module");
let OutcomesModule = class OutcomesModule {
};
exports.OutcomesModule = OutcomesModule;
exports.OutcomesModule = OutcomesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            (0, common_1.forwardRef)(() => sessions_module_1.SessionsModule),
            cornell_module_1.CornellModule,
        ],
        providers: [
            outcomes_service_1.OutcomesService,
            compute_session_outcomes_use_case_1.ComputeSessionOutcomesUseCase,
            {
                provide: outcomes_repository_interface_1.IOutcomesRepository,
                useClass: prisma_outcomes_repository_1.PrismaOutcomesRepository,
            },
        ],
        exports: [outcomes_service_1.OutcomesService, compute_session_outcomes_use_case_1.ComputeSessionOutcomesUseCase, outcomes_repository_interface_1.IOutcomesRepository],
    })
], OutcomesModule);
//# sourceMappingURL=outcomes.module.js.map