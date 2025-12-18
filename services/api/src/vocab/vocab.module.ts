import { Module } from '@nestjs/common';
import { VocabService } from './vocab.service';
import { VocabController } from './vocab.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VocabController],
  providers: [VocabService],
  exports: [VocabService],
})
export class VocabModule {}
