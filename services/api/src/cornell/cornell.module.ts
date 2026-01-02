import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { PrismaModule } from "../prisma/prisma.module";
import { CornellController, HighlightsController } from "./cornell.controller";
import { FilesController } from "../common/files.controller";
import { CornellService } from "./cornell.service";
import { ContentModeService } from './content-mode.service';
import { ContentService } from "./services/content.service";
import { StorageService } from "./services/storage.service";
import { ContentAccessModule } from "./content-access.module";
import { ContentAccessService } from "./services/content-access.service";
import { VideoModule } from "../video/video.module";
import { TranscriptionModule } from "../transcription/transcription.module";
import { FamilyModule } from "../family/family.module";
import { QueueModule } from "../queue/queue.module";
import { ActivityModule } from "../activity/activity.module";
import { TopicMasteryModule } from "../analytics/topic-mastery.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { cacheConfig } from "../config/cache.config";

import { ContentPedagogicalController } from "./controllers/content-pedagogical.controller";
import { ContentPedagogicalService } from "./services/content-pedagogical.service";
import { CornellHighlightsController } from "./controllers/cornell-highlights.controller";
import { CornellHighlightsService } from "./services/cornell-highlights.service";
import { ContentModeController } from "./content-mode.controller";

// Refactor Imports
import { IContentRepository } from "./domain/content.repository.interface";
import { PrismaContentRepository } from "./infrastructure/repositories/prisma-content.repository";
import { CreateContentUseCase } from "./application/use-cases/create-content.use-case";
import { GetContentUseCase } from "./application/use-cases/get-content.use-case";
import { ListContentUseCase } from "./application/use-cases/list-content.use-case";
import { UpdateContentUseCase } from "./application/use-cases/update-content.use-case";
import { DeleteContentUseCase } from "./application/use-cases/delete-content.use-case";

import { ICornellRepository } from "./domain/interfaces/cornell.repository.interface";
import { IHighlightsRepository } from "./domain/interfaces/highlights.repository.interface";
import { PrismaCornellRepository } from "./infrastructure/repositories/prisma-cornell.repository";
import { PrismaHighlightsRepository } from "./infrastructure/repositories/prisma-highlights.repository";
import { GetOrCreateCornellNoteUseCase } from "./application/use-cases/get-or-create-cornell-note.use-case";
import { UpdateCornellNoteUseCase } from "./application/use-cases/update-cornell-note.use-case";
import { CreateHighlightUseCase } from "./application/use-cases/create-highlight.use-case";
import { UpdateHighlightUseCase } from "./application/use-cases/update-highlight.use-case";
import { DeleteHighlightUseCase } from "./application/use-cases/delete-highlight.use-case";
import { GetHighlightsUseCase } from "./application/use-cases/get-highlights.use-case";

@Module({
  imports: [
    PrismaModule,
    CacheModule.register(cacheConfig),
    VideoModule,
    TranscriptionModule,
    FamilyModule,
    QueueModule,
    ActivityModule,
    TopicMasteryModule,
    NotificationsModule,
    ContentAccessModule,
  ],
  controllers: [
    CornellController,
    HighlightsController,
    FilesController,
    ContentPedagogicalController,
    CornellHighlightsController,
    ContentModeController, // Sprint 1 - Content Mode
  ],
  providers: [
    CornellService,
    ContentService,
    StorageService,
    ContentPedagogicalService,
    CornellHighlightsService,
    ContentModeService, // Sprint 1 - Content Mode
    // Content Providers (Previously Refactored)
    {
      provide: IContentRepository,
      useClass: PrismaContentRepository,
    },
    CreateContentUseCase,
    GetContentUseCase,
    ListContentUseCase,
    UpdateContentUseCase,
    DeleteContentUseCase,
    PrismaContentRepository,

    // Cornell & Highlights Providers (New)
    {
      provide: ICornellRepository,
      useClass: PrismaCornellRepository,
    },
    {
      provide: IHighlightsRepository,
      useClass: PrismaHighlightsRepository,
    },
    GetOrCreateCornellNoteUseCase,
    UpdateCornellNoteUseCase,
    CreateHighlightUseCase,
    UpdateHighlightUseCase,
    DeleteHighlightUseCase,
    GetHighlightsUseCase,
  ],
  exports: [
    CornellService,
    ContentService,
    StorageService,
    ContentAccessModule,
    // Export Content Use Cases
    IContentRepository,
    CreateContentUseCase,
    GetContentUseCase,
    ListContentUseCase,
    UpdateContentUseCase,
    DeleteContentUseCase,
    // Export Cornell Use Cases if needed by simplified services
    GetOrCreateCornellNoteUseCase,
    ICornellRepository,
    IHighlightsRepository,
  ],
})
export class CornellModule {}
