import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CornellController } from './cornell.controller';
import { CornellService } from './cornell.service';
import { ContentService } from './services/content.service';
import { StorageService } from './services/storage.service';
import { VideoModule } from '../video/video.module';
import { TranscriptionModule } from '../transcription/transcription.module';

@Module({
  imports: [PrismaModule, VideoModule, TranscriptionModule],
  controllers: [CornellController],
  providers: [CornellService, ContentService, StorageService],
  exports: [CornellService, ContentService],
})
export class CornellModule {}
