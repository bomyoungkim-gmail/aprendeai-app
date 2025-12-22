import { Module } from '@nestjs/common';
import { ClassroomController } from './classroom.controller';
import { ClassroomService } from './services/classroom.service';
import { EnrollmentService } from './services/enrollment.service';
import { ClassPolicyService } from './services/class-policy.service';
import { ClassPlanService } from './services/class-plan.service';
import { ClassInterventionService } from './services/class-intervention.service';
import { ClassDashboardService } from './services/class-dashboard.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PromptLibraryModule } from '../prompts/prompt-library.module';
import { EventsModule } from '../events/events.module';
import { PrivacyModule } from '../privacy/privacy.module';

@Module({
  imports: [
    PrismaModule,
    PromptLibraryModule,
    EventsModule,
    PrivacyModule,
  ],
  controllers: [ClassroomController],
  providers: [
    ClassroomService,
    EnrollmentService,
    ClassPolicyService,
    ClassPlanService,
    ClassInterventionService,
    ClassDashboardService,
  ],
  exports: [
    ClassroomService,
    EnrollmentService,
    ClassPolicyService,
    ClassPlanService,
    ClassInterventionService,
    ClassDashboardService,
  ],
})
export class ClassroomModule {}
