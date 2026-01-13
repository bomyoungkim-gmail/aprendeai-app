import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { DecisionModule } from "../decision/decision.module";
import { SrsModule } from "../srs/srs.module";
import { AssessmentModule } from "../assessment/assessment.module";
import { SessionsModule } from "../sessions/sessions.module";
import { LearningController } from "./learning.controller";
import { LearningOrchestratorService } from "./application/learning-orchestrator.service";

/**
 * Learning Module
 *
 * Orchestrates the "next actions" for users by aggregating:
 * - Interventions from Decision Engine
 * - SRS reviews
 * - Assessment checkpoints
 */
@Module({
  imports: [
    PrismaModule,
    DecisionModule,
    SrsModule,
    AssessmentModule,
    SessionsModule,
  ],
  controllers: [LearningController],
  providers: [LearningOrchestratorService],
  exports: [LearningOrchestratorService],
})
export class LearningModule {}
