import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { BillingModule } from '../billing/billing.module';
import { ExtractionService } from './extraction.service';
import { ExtractionController } from './extraction.controller';

@Module({
  imports: [PrismaModule, QueueModule, BillingModule],
  controllers: [ExtractionController],
  providers: [ExtractionService],
  exports: [ExtractionService],
})
export class ExtractionModule {}
