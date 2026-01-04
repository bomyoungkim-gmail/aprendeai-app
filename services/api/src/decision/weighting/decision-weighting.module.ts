import { Module } from '@nestjs/common';
import { DcsCalculatorService } from './dcs-calculator.service';
import { DcsIntegrationHelper } from './dcs-integration.helper';
import { DecisionWeightingController } from './decision-weighting.controller';
import { DcsCalculatorListener } from './dcs-calculator.listener';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DecisionWeightingController],
  providers: [DcsCalculatorService, DcsIntegrationHelper, DcsCalculatorListener],
  exports: [DcsCalculatorService, DcsIntegrationHelper],
})
export class DecisionWeightingModule {}

