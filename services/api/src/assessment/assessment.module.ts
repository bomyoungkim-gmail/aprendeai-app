import { Module } from "@nestjs/common";
import { AssessmentController } from "./assessment.controller";
import { LearningCheckpointController } from "./learning-checkpoint.controller";
import { AssessmentService } from "./assessment.service";
import { PrismaModule } from "../prisma/prisma.module";
import { AnalyticsModule } from "../analytics/analytics.module";
import { TelemetryModule } from "../telemetry/telemetry.module";
import { RedisModule } from "../common/redis/redis.module";
import { LLMModule } from "../llm/llm.module";

// Repositories
import { IAssessmentRepository } from "./domain/interfaces/assessment.repository.interface";
import { PrismaAssessmentRepository } from "./infrastructure/repositories/prisma-assessment.repository";

// Use Cases
import { CreateAssessmentUseCase } from "./application/use-cases/create-assessment.use-case";
import { GetAssessmentUseCase } from "./application/use-cases/get-assessment.use-case";
import { SubmitAssessmentUseCase } from "./application/use-cases/submit-assessment.use-case";
import { AnswerCheckpointUseCase } from "./application/use-cases/answer-checkpoint.use-case";
import { AssessmentGenerationService } from "./application/assessment-generation.service";
import { AssessmentEvaluationService } from "./application/assessment-evaluation.service";
import { FeedbackGenerationService } from "./application/feedback-generation.service";

import { CornellModule } from "../cornell/cornell.module";
import { DecisionModule } from "../decision/decision.module";
import { TopicMasteryModule } from "../analytics/topic-mastery.module";
import { AiServiceModule } from "../ai-service/ai-service.module"; // Added export

@Module({
  imports: [
    PrismaModule,
    AnalyticsModule,
    TelemetryModule,
    CornellModule,
    DecisionModule,
    RedisModule,
    LLMModule,
    TopicMasteryModule,
    AiServiceModule, // Added import
  ],
  controllers: [AssessmentController, LearningCheckpointController],
  providers: [
    AssessmentService,
    AssessmentGenerationService,
    AssessmentEvaluationService,
    FeedbackGenerationService,
    CreateAssessmentUseCase,
    GetAssessmentUseCase,
    SubmitAssessmentUseCase,
    AnswerCheckpointUseCase,
    {
      provide: IAssessmentRepository,
      useClass: PrismaAssessmentRepository,
    },
  ],
  exports: [
    AssessmentService,
    AssessmentGenerationService,
    AssessmentEvaluationService,
    FeedbackGenerationService,
  ],
})
export class AssessmentModule {}
