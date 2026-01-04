import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiServiceModule } from '../ai-service/ai-service.module'; // AGENT SCRIPT A
import { DecisionWeightingModule } from './weighting/decision-weighting.module'; // GRAPH SCRIPT 09
import { DecisionService } from './application/decision.service';
import { ScaffoldingService } from './application/scaffolding.service';
import { CornellTriggerService } from './application/cornell-trigger.service';
import { DecisionController } from './decision.controller';
import { PrismaDecisionLogRepository } from './infrastructure/repositories/prisma-decision-log.repository';
import { IDecisionLogRepository } from './domain/decision-log.repository.interface';

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
    CornellTriggerService,
    {
      provide: IDecisionLogRepository,
      useClass: PrismaDecisionLogRepository,
    },
  ],
  exports: [DecisionService, ScaffoldingService, CornellTriggerService],
})
export class DecisionModule {}
