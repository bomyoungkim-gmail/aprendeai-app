import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from '../prisma/prisma.module';
import { ProfileModule } from '../profiles/profile.module';
import { GamificationModule } from '../gamification/gamification.module';
import { VocabModule } from '../vocab/vocab.module';
import { OutcomesModule } from '../outcomes/outcomes.module';
import { GatingModule } from '../gating/gating.module';
import { ReadingSessionsService } from './reading-sessions.service';
import { ReadingSessionsController } from './reading-sessions.controller';
import { QuickCommandParser } from './parsers/quick-command.parser';
import { AiServiceClient } from '../ai-service/ai-service.client'; 
import { VocabCaptureListener } from './listeners/vocab-capture.listener';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    ProfileModule,
    GamificationModule,
    VocabModule,
    OutcomesModule,
    GatingModule,
  ],
  controllers: [ReadingSessionsController],
  providers: [
    ReadingSessionsService,
    QuickCommandParser,
    AiServiceClient,
    VocabCaptureListener,
  ],
  exports: [ReadingSessionsService],
})
export class SessionsModule {}
