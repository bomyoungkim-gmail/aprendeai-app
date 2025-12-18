import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfileModule } from '../profiles/profile.module';
import { GamificationModule } from '../gamification/gamification.module';
import { VocabModule } from '../vocab/vocab.module';
import { OutcomesModule } from '../outcomes/outcomes.module';
import { ReadingSessionsService } from './reading-sessions.service';
import { ReadingSessionsController } from './reading-sessions.controller';

@Module({
  imports: [PrismaModule, ProfileModule, GamificationModule, VocabModule, OutcomesModule],
  controllers: [ReadingSessionsController],
  providers: [ReadingSessionsService],
  exports: [ReadingSessionsService],
})
export class SessionsModule {}
