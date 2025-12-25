import { Module } from "@nestjs/common";
import { AssessmentController } from "./assessment.controller";
import { AssessmentService } from "./assessment.service";
import { PrismaModule } from "../prisma/prisma.module";
import { TopicMasteryModule } from "../analytics/topic-mastery.module";

@Module({
  imports: [PrismaModule, TopicMasteryModule],
  controllers: [AssessmentController],
  providers: [AssessmentService],
  exports: [AssessmentService],
})
export class AssessmentModule {}
