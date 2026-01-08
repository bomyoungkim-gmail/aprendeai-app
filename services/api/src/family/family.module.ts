import { Module } from "@nestjs/common";
import { FamilyService } from "./family.service";
import { FamilyController } from "./family.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { BillingModule } from "../billing/billing.module";
import { PromptLibraryModule } from "../prompts/prompt-library.module";
import { EventsModule } from "../events/events.module";
import { StateMachineModule } from "../state-machine/state-machine.module";
import { PrivacyModule } from "../privacy/privacy.module";
import { GamificationModule } from "../gamification/gamification.module";
import { SrsModule } from "../srs/srs.module";

// Services
import { OpsCoachService } from "./services/ops-coach.service";
import { FamilyPolicyService } from "./services/family-policy.service";
import { CoReadingService } from "./services/co-reading.service";
import { TeachBackService } from "./services/teachback.service";
import { FamilyDashboardService } from "./services/family-dashboard.service";

// Repositories
import { IFamilyRepository } from "./domain/family.repository.interface";
import { PrismaFamilyRepository } from "./infrastructure/repositories/prisma-family.repository";

// Use Cases
import { CreateFamilyUseCase } from "./application/use-cases/create-family.use-case";

@Module({
  imports: [
    PrismaModule,
    BillingModule,
    PromptLibraryModule,
    EventsModule,
    StateMachineModule,
    PrivacyModule,
    GamificationModule,
    SrsModule,
  ],
  controllers: [FamilyController],
  providers: [
    FamilyService,
    CreateFamilyUseCase,
    {
      provide: IFamilyRepository,
      useClass: PrismaFamilyRepository,
    },
    OpsCoachService,
    FamilyPolicyService,
    CoReadingService,
    TeachBackService,
    FamilyDashboardService,
  ],
  exports: [
    FamilyService,
    CreateFamilyUseCase,
    OpsCoachService,
    FamilyPolicyService,
    CoReadingService,
    TeachBackService,
    FamilyDashboardService,
    IFamilyRepository,
  ],
})
export class FamilyModule {}
