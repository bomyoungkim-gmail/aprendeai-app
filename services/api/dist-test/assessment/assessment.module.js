"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentModule = void 0;
const common_1 = require("@nestjs/common");
const assessment_controller_1 = require("./assessment.controller");
const assessment_service_1 = require("./assessment.service");
const prisma_module_1 = require("../prisma/prisma.module");
const topic_mastery_module_1 = require("../analytics/topic-mastery.module");
const assessment_repository_interface_1 = require("./domain/interfaces/assessment.repository.interface");
const prisma_assessment_repository_1 = require("./infrastructure/repositories/prisma-assessment.repository");
const create_assessment_use_case_1 = require("./application/use-cases/create-assessment.use-case");
const get_assessment_use_case_1 = require("./application/use-cases/get-assessment.use-case");
const submit_assessment_use_case_1 = require("./application/use-cases/submit-assessment.use-case");
let AssessmentModule = class AssessmentModule {
};
exports.AssessmentModule = AssessmentModule;
exports.AssessmentModule = AssessmentModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, topic_mastery_module_1.TopicMasteryModule],
        controllers: [assessment_controller_1.AssessmentController],
        providers: [
            assessment_service_1.AssessmentService,
            create_assessment_use_case_1.CreateAssessmentUseCase,
            get_assessment_use_case_1.GetAssessmentUseCase,
            submit_assessment_use_case_1.SubmitAssessmentUseCase,
            {
                provide: assessment_repository_interface_1.IAssessmentRepository,
                useClass: prisma_assessment_repository_1.PrismaAssessmentRepository,
            },
        ],
        exports: [assessment_service_1.AssessmentService],
    })
], AssessmentModule);
//# sourceMappingURL=assessment.module.js.map