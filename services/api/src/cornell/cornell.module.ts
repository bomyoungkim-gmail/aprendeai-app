import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { CornellController } from "./cornell.controller";
import { CornellService } from "./cornell.service";
import { ContentService } from "./services/content.service";
import { StorageService } from "./services/storage.service";
import { VideoModule } from "../video/video.module";
import { TranscriptionModule } from "../transcription/transcription.module";
import { FamilyModule } from "../family/family.module";
import { QueueModule } from "../queue/queue.module";
import { ActivityModule } from "../activity/activity.module";
import { TopicMasteryModule } from "../analytics/topic-mastery.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [PrismaModule, VideoModule, TranscriptionModule, FamilyModule, QueueModule, ActivityModule, TopicMasteryModule, NotificationsModule],
  controllers: [CornellController],
  providers: [CornellService, ContentService, StorageService],
  exports: [CornellService, ContentService],
})
export class CornellModule {}
