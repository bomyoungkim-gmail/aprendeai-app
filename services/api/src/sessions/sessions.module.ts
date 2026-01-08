import { Module, forwardRef } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { PrismaModule } from "../prisma/prisma.module";
import { ProfileModule } from "../profiles/profile.module";
import { GamificationModule } from "../gamification/gamification.module";
import { VocabModule } from "../vocab/vocab.module";
import { OutcomesModule } from "../outcomes/outcomes.module";
import { GatingModule } from "../gating/gating.module";
import { ReadingSessionsService } from "./reading-sessions.service";
import { ReadingSessionsController } from "./reading-sessions.controller";
import { PrismaSessionsRepository } from "./infrastructure/repositories/prisma-sessions.repository";
import { ISessionsRepository } from "./domain/sessions.repository.interface";
import { StartSessionUseCase } from "./application/use-cases/start-session.use-case";
import { GetSessionUseCase } from "./application/use-cases/get-session.use-case";
import { UpdatePrePhaseUseCase } from "./application/use-cases/update-pre-phase.use-case";
import { AdvancePhaseUseCase } from "./application/use-cases/advance-phase.use-case";
import { RecordEventUseCase } from "./application/use-cases/record-event.use-case";
import { UpdateReadingProgressUseCase } from "./application/use-cases/update-reading-progress.use-case";
import { GetReadingProgressUseCase } from "./application/use-cases/get-reading-progress.use-case";
import { CreateBookmarkUseCase } from "./application/use-cases/create-bookmark.use-case";
import { GetBookmarksUseCase } from "./application/use-cases/get-bookmarks.use-case";
import { DeleteBookmarkUseCase } from "./application/use-cases/delete-bookmark.use-case";
import { QuickCommandParser } from "./parsers/quick-command.parser";
import { AiServiceClient } from "../ai-service/ai-service.client";
import { VocabCaptureListener } from "./listeners/vocab-capture.listener";
import { ActivityModule } from "../activity/activity.module";
import { CornellModule } from "../cornell/cornell.module";
import { SrsModule } from "../srs/srs.module";
import { DecisionModule } from "../decision/decision.module"; // SCRIPT 03: For ScaffoldingInitializerService

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    ProfileModule,
    GamificationModule,
    VocabModule,
    forwardRef(() => OutcomesModule),
    GatingModule,
    ActivityModule,
    CornellModule,
    SrsModule,
    DecisionModule, // SCRIPT 03: Mode-aware scaffolding initialization
  ],
  controllers: [ReadingSessionsController],
  providers: [
    ReadingSessionsService,
    QuickCommandParser,
    AiServiceClient,
    VocabCaptureListener,
    {
      provide: ISessionsRepository,
      useClass: PrismaSessionsRepository,
    },
    StartSessionUseCase,
    GetSessionUseCase,
    UpdatePrePhaseUseCase,
    AdvancePhaseUseCase,
    RecordEventUseCase,
    UpdateReadingProgressUseCase,
    GetReadingProgressUseCase,
    CreateBookmarkUseCase,
    GetBookmarksUseCase,
    DeleteBookmarkUseCase,
  ],
  exports: [ReadingSessionsService, ISessionsRepository],
})
export class SessionsModule {}
