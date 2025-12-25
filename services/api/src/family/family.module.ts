import { Module } from "@nestjs/common";
import { FamilyController } from "./family.controller";
import { FamilyService } from "./family.service";
import { FamilyPolicyService } from "./services/family-policy.service";
import { CoReadingService } from "./services/co-reading.service";
import { TeachBackService } from "./services/teachback.service";
import { FamilyDashboardService } from "./services/family-dashboard.service";
import { OpsCoachService } from "./services/ops-coach.service";
import { PrismaModule } from "../prisma/prisma.module";
import { PromptLibraryModule } from "../prompts/prompt-library.module";
import { EventsModule } from "../events/events.module";
import { StateMachineModule } from "../state-machine/state-machine.module";
import { PrivacyModule } from "../privacy/privacy.module";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [
    PrismaModule,
    PromptLibraryModule,
    EventsModule,
    StateMachineModule,
    PrivacyModule,
    EmailModule,
  ],
  controllers: [FamilyController],
  providers: [
    FamilyService,
    FamilyPolicyService,
    CoReadingService,
    TeachBackService,
    FamilyDashboardService,
    OpsCoachService,
  ],
  exports: [
    FamilyService,
    FamilyPolicyService,
    CoReadingService,
    TeachBackService,
    FamilyDashboardService,
    OpsCoachService,
  ],
})
export class FamilyModule {}
