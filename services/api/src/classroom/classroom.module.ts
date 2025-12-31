import { Module } from "@nestjs/common";
import { ClassroomController } from "./classroom.controller";
import { ClassroomService } from "./services/classroom.service";
import { EnrollmentService } from "./services/enrollment.service";
import { ClassPolicyService } from "./services/class-policy.service";
import { ClassPlanService } from "./services/class-plan.service";
import { ClassInterventionService } from "./services/class-intervention.service";
import { ClassDashboardService } from "./services/class-dashboard.service";
import { ClassGradebookService } from "./services/class-gradebook.service";
import { PrismaModule } from "../prisma/prisma.module";
import { PromptLibraryModule } from "../prompts/prompt-library.module";
import { EventsModule } from "../events/events.module";
import { PrivacyModule } from "../privacy/privacy.module";

// Infrastructure
import { PrismaClassroomRepository } from "./infrastructure/repositories/prisma-classroom.repository";
import { PrismaEnrollmentRepository } from "./infrastructure/repositories/prisma-enrollment.repository";

// Use Cases
import { CreateClassroomUseCase } from "./application/use-cases/create-classroom.use-case";
import { GetClassroomUseCase } from "./application/use-cases/get-classroom.use-case";
import { UpdateClassroomUseCase } from "./application/use-cases/update-classroom.use-case";
import { DeleteClassroomUseCase } from "./application/use-cases/delete-classroom.use-case";
import { GetEducatorClassroomsUseCase } from "./application/use-cases/get-educator-classrooms.use-case";
import { EnrollStudentUseCase } from "./application/use-cases/enroll-student.use-case";
import { RemoveStudentUseCase } from "./application/use-cases/remove-student.use-case";
import { GetClassroomEnrollmentsUseCase } from "./application/use-cases/get-classroom-enrollments.use-case";
import { GetStudentEnrollmentsUseCase } from "./application/use-cases/get-student-enrollments.use-case";
import { IClassroomRepository } from "./domain/interfaces/classroom.repository.interface";
import { IEnrollmentRepository } from "./domain/interfaces/enrollment.repository.interface";

@Module({
  imports: [PrismaModule, PromptLibraryModule, EventsModule, PrivacyModule],
  controllers: [ClassroomController],
  providers: [
    ClassroomService,
    EnrollmentService,
    ClassPolicyService,
    ClassPlanService,
    ClassInterventionService,
    ClassDashboardService,
    ClassGradebookService,
    { provide: IClassroomRepository, useClass: PrismaClassroomRepository },
    { provide: IEnrollmentRepository, useClass: PrismaEnrollmentRepository },
    CreateClassroomUseCase,
    GetClassroomUseCase,
    UpdateClassroomUseCase,
    DeleteClassroomUseCase,
    GetEducatorClassroomsUseCase,
    EnrollStudentUseCase,
    RemoveStudentUseCase,
    GetClassroomEnrollmentsUseCase,
    GetStudentEnrollmentsUseCase,
  ],
  exports: [
    ClassroomService,
    EnrollmentService,
    ClassPolicyService,
    ClassPlanService,
    ClassInterventionService,
    ClassDashboardService,
    ClassGradebookService,
    IClassroomRepository,
    IEnrollmentRepository,
  ],
})
export class ClassroomModule {}
