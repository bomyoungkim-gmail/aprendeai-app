import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { PrismaModule } from "../prisma/prisma.module";
import { CornellController } from "./cornell.controller";
import { FilesController } from '../common/files.controller';
import { CornellService } from "./cornell.service";
import { ContentService } from "./services/content.service";
import { StorageService } from "./services/storage.service";
import { ContentAccessService } from "./services/content-access.service";
import { VideoModule } from "../video/video.module";
import { TranscriptionModule } from "../transcription/transcription.module";
import { FamilyModule } from "../family/family.module";
import { QueueModule } from "../queue/queue.module";
import { ActivityModule } from "../activity/activity.module";
import { TopicMasteryModule } from "../analytics/topic-mastery.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { cacheConfig } from "../config/cache.config";

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
  ],
  controllers: [CornellController, FilesController],
  providers: [CornellService, ContentService, StorageService, ContentAccessService],
  exports: [CornellService, ContentService, StorageService, ContentAccessService],
})
export class CornellModule {}
