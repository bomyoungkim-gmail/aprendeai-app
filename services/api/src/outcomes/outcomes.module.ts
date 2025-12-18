import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { OutcomesService } from './outcomes.service';

@Module({
  imports: [PrismaModule],
  providers: [OutcomesService],
  exports: [OutcomesService],
})
export class OutcomesModule {}
