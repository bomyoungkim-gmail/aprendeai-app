import { Module } from '@nestjs/common';
import { GlossaryService, GlossaryController } from './glossary.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GlossaryController],
  providers: [GlossaryService],
  exports: [GlossaryService],
})
export class GlossaryModule {}
