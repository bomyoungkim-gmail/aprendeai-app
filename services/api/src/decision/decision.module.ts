import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AiServiceModule } from "../ai-service/ai-service.module"; // AGENT SCRIPT A
import { DecisionWeightingModule } from "./weighting/decision-weighting.module"; // GRAPH SCRIPT 09
import { DecisionService } from "./application/decision.service";
import { ScaffoldingService } from "./application/scaffolding.service";
import { ScaffoldingInitializerService } from "./application/scaffolding-initializer.service"; // SCRIPT 03
import { ScaffoldingSignalDetectorService } from "./application/scaffolding-signal-detector.service"; // SCRIPT 03 - Fase 2
import { ScaffoldingBehaviorAdapterService } from "./application/scaffolding-behavior-adapter.service"; // SCRIPT 03 - Fase 3
import { FlowStateDetectorService } from "./application/flow-state-detector.service"; // SCRIPT 03 - GAP 8
import { CornellTriggerService } from "./application/cornell-trigger.service";
import { DecisionController } from "./decision.controller";
import { PrismaDecisionLogRepository } from "./infrastructure/repositories/prisma-decision-log.repository";
import { IDecisionLogRepository } from "./domain/decision-log.repository.interface";

/**
 * Decision Module
 *
 * Encapsulates the decision-making logic for learning interventions.
 * Exports DecisionService for use by other modules (e.g., orchestrator).
 *
 * AGENT SCRIPT A: Now imports AiServiceModule for Transfer Graph integration.
 * GRAPH SCRIPT 09: Now imports DecisionWeightingModule for DCS-based weighting.
 */
@Module({
  imports: [PrismaModule, AiServiceModule, DecisionWeightingModule], // GRAPH SCRIPT 09
  controllers: [DecisionController],
  providers: [
    DecisionService,
    ScaffoldingService,
    ScaffoldingInitializerService, // SCRIPT 03: Mode-aware initialization
    ScaffoldingSignalDetectorService, // SCRIPT 03 - Fase 2: Signal detection
    ScaffoldingBehaviorAdapterService, // SCRIPT 03 - Fase 3: Behavior adaptation
    FlowStateDetectorService, // SCRIPT 03 - GAP 8: Flow detection
    CornellTriggerService,
    {
      provide: IDecisionLogRepository,
      useClass: PrismaDecisionLogRepository,
    },
  ],
  exports: [
    DecisionService,
    ScaffoldingService,
    ScaffoldingInitializerService,
    CornellTriggerService,
    IDecisionLogRepository,
  ], // SCRIPT 03
})
export class DecisionModule {}
