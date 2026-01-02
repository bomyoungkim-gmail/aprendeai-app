import { Module } from "@nestjs/common";
import { AssessmentController } from "./assessment.controller";
import { AssessmentService } from "./assessment.service";
import { PrismaModule } from "../prisma/prisma.module";
import { TopicMasteryModule } from "../analytics/topic-mastery.module";

// Repositories
import { IAssessmentRepository } from "./domain/interfaces/assessment.repository.interface";
import { PrismaAssessmentRepository } from "./infrastructure/repositories/prisma-assessment.repository";

// Use Cases
import { CreateAssessmentUseCase } from "./application/use-cases/create-assessment.use-case";
import { GetAssessmentUseCase } from "./application/use-cases/get-assessment.use-case";
import { SubmitAssessmentUseCase } from "./application/use-cases/submit-assessment.use-case";

import { ContentAccessModule } from "../cornell/content-access.module";

@Module({
  imports: [PrismaModule, TopicMasteryModule, ContentAccessModule],
  controllers: [AssessmentController],
  providers: [
    AssessmentService,
    CreateAssessmentUseCase,
    GetAssessmentUseCase,
    SubmitAssessmentUseCase,
    {
      provide: IAssessmentRepository,
      useClass: PrismaAssessmentRepository,
    },
  ],
  exports: [AssessmentService],
})
export class AssessmentModule {}
