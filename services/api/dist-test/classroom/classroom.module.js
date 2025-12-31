"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassroomModule = void 0;
const common_1 = require("@nestjs/common");
const classroom_controller_1 = require("./classroom.controller");
const classroom_service_1 = require("./services/classroom.service");
const enrollment_service_1 = require("./services/enrollment.service");
const class_policy_service_1 = require("./services/class-policy.service");
const class_plan_service_1 = require("./services/class-plan.service");
const class_intervention_service_1 = require("./services/class-intervention.service");
const class_dashboard_service_1 = require("./services/class-dashboard.service");
const class_gradebook_service_1 = require("./services/class-gradebook.service");
const prisma_module_1 = require("../prisma/prisma.module");
const prompt_library_module_1 = require("../prompts/prompt-library.module");
const events_module_1 = require("../events/events.module");
const privacy_module_1 = require("../privacy/privacy.module");
const prisma_classroom_repository_1 = require("./infrastructure/repositories/prisma-classroom.repository");
const prisma_enrollment_repository_1 = require("./infrastructure/repositories/prisma-enrollment.repository");
const create_classroom_use_case_1 = require("./application/use-cases/create-classroom.use-case");
const get_classroom_use_case_1 = require("./application/use-cases/get-classroom.use-case");
const update_classroom_use_case_1 = require("./application/use-cases/update-classroom.use-case");
const delete_classroom_use_case_1 = require("./application/use-cases/delete-classroom.use-case");
const get_educator_classrooms_use_case_1 = require("./application/use-cases/get-educator-classrooms.use-case");
const enroll_student_use_case_1 = require("./application/use-cases/enroll-student.use-case");
const remove_student_use_case_1 = require("./application/use-cases/remove-student.use-case");
const get_classroom_enrollments_use_case_1 = require("./application/use-cases/get-classroom-enrollments.use-case");
const get_student_enrollments_use_case_1 = require("./application/use-cases/get-student-enrollments.use-case");
const classroom_repository_interface_1 = require("./domain/interfaces/classroom.repository.interface");
const enrollment_repository_interface_1 = require("./domain/interfaces/enrollment.repository.interface");
let ClassroomModule = class ClassroomModule {
};
exports.ClassroomModule = ClassroomModule;
exports.ClassroomModule = ClassroomModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, prompt_library_module_1.PromptLibraryModule, events_module_1.EventsModule, privacy_module_1.PrivacyModule],
        controllers: [classroom_controller_1.ClassroomController],
        providers: [
            classroom_service_1.ClassroomService,
            enrollment_service_1.EnrollmentService,
            class_policy_service_1.ClassPolicyService,
            class_plan_service_1.ClassPlanService,
            class_intervention_service_1.ClassInterventionService,
            class_dashboard_service_1.ClassDashboardService,
            class_gradebook_service_1.ClassGradebookService,
            { provide: classroom_repository_interface_1.IClassroomRepository, useClass: prisma_classroom_repository_1.PrismaClassroomRepository },
            { provide: enrollment_repository_interface_1.IEnrollmentRepository, useClass: prisma_enrollment_repository_1.PrismaEnrollmentRepository },
            create_classroom_use_case_1.CreateClassroomUseCase,
            get_classroom_use_case_1.GetClassroomUseCase,
            update_classroom_use_case_1.UpdateClassroomUseCase,
            delete_classroom_use_case_1.DeleteClassroomUseCase,
            get_educator_classrooms_use_case_1.GetEducatorClassroomsUseCase,
            enroll_student_use_case_1.EnrollStudentUseCase,
            remove_student_use_case_1.RemoveStudentUseCase,
            get_classroom_enrollments_use_case_1.GetClassroomEnrollmentsUseCase,
            get_student_enrollments_use_case_1.GetStudentEnrollmentsUseCase,
        ],
        exports: [
            classroom_service_1.ClassroomService,
            enrollment_service_1.EnrollmentService,
            class_policy_service_1.ClassPolicyService,
            class_plan_service_1.ClassPlanService,
            class_intervention_service_1.ClassInterventionService,
            class_dashboard_service_1.ClassDashboardService,
            class_gradebook_service_1.ClassGradebookService,
            classroom_repository_interface_1.IClassroomRepository,
            enrollment_repository_interface_1.IEnrollmentRepository,
        ],
    })
], ClassroomModule);
//# sourceMappingURL=classroom.module.js.map